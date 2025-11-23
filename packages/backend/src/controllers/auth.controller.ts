import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, refreshAccessToken, AuthError } from "@services/auth.service.js";
import { RegisterSchema, LoginSchema } from "@password_manager/shared";
import { verifyRefreshToken } from "@utils/jwt.js";
import { ERROR_CODES } from "@password_manager/shared";
import {User} from '@models/index.js';

/**
 * Auth Controller
 * 
 * Handles HTTP requests/responses for authentication
 * Delegates business logic to auth service
 */

/**
 @desc register a new user
 @route POST /auth/register
 @access public 
*/
export async function register(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        // Validate request body with zod
        const validatedData= RegisterSchema.parse(req.body);

        // Call service layer
        const authResponse= await registerUser(validatedData);

        // set refresh token as httpOnly cookie (more secure than localStorage)
        res.cookie('refreshToken', authResponse.refreshToken, {
            httpOnly: true, //Javascript cannot access (XSS protection)
            secure: process.env.NODE_ENV === 'production', //HTTPS only in production
            sameSite: 'none', 
            maxAge: 7 * 24 * 60 * 60 * 1000, //7 days 
        });

        // Send response (don't send refresh token in body if it's in cookie)
        res.status(201).json({
            success: true,
            data:{
                user: authResponse.user,
                accessToken: authResponse.accessToken,
                encryptedPrivateKey: authResponse.encryptedPrivateKey,
                salt: authResponse.salt 
            }
        });
    } catch (error) {
        // Zod validation errors
        if(error instanceof Error && error.name === 'ZodError'){
            res.status(400).json({
                success: false,
                error:{
                    code: ERROR_CODES.VALIDATION_ERROR,
                    message: 'Validation failed',
                    details: error
                }
            });
            return;
        }

        // Custom auth errors
        if(error instanceof AuthError){
            res.status(error.statusCode).json({
                success: false,
                error:{
                    code: error.code,
                    message: error.message,
                }
            });
            return;
        }

        // Pass other errors to global error handler
        next(error);
    }
}

/** 
    @desc   Authenticate user and return tokens
    @route  POST /auth/login
    @access public
*/
export async function login(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        // Validate request body
        const validatedData= LoginSchema.parse(req.body);

        // call service layer
        const authResponse= await loginUser(validatedData);

        // Check if it's a full auth response or 2FA required
        if('user' in authResponse){
            // Set refresh token cookie 
            res.cookie('refreshToken', authResponse.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none',
                maxAge: 7*24*60*60*1000
            });
    
            res.json({
                success: true,
                data:{
                    user: authResponse.user,
                    accessToken: authResponse.accessToken,
                    encryptedPrivateKey: authResponse.encryptedPrivateKey,
                    salt: authResponse.salt
                }
            });
            return;
        }
    } catch (error) {
        if(error instanceof Error && error.name === 'ZodError'){
            res.status(400).json({
                success: false,
                error:{
                    code: ERROR_CODES.VALIDATION_ERROR,
                    message: 'Validation failed',
                    details: error
                }
            });
            return;
        }

        if(error instanceof AuthError){
            res.status(error.statusCode).json({
                success: false,
                error:{
                    code: error.code,
                    method: error.method,
                    message: error.message
                }
            }); 
            return;
        }
        next(error);
    }
}

/**
    @desc   Get new access token using refresh token
    @route  POST /auth/refresh
    @access private
*/
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        // Get refresh token from cookie
        const refreshToken= req.cookies.refreshToken;

        if(!refreshToken){
            res.status(401).json({
                success: false,
                error:{
                    code: ERROR_CODES.UNAUTHORIZED,
                    message: 'Refresh token not found'
                }
            });
            return;
        }

        // verify refresh token
        const payload= verifyRefreshToken(refreshToken);
        if(!payload){
            res.status(401).json({
                success: false,
                error:{
                    code: ERROR_CODES.TOKEN_EXPIRED,
                    message: 'Invalid or expired token'
                }
            });
            return;
        }

        // Generate new access token
        const accessToken= await refreshAccessToken(payload.userId);

        res.json({
            success: true,
            data: {accessToken}
        });
    } catch (error) {
        if(error instanceof AuthError){
            res.status(error.statusCode).json({
                success: false,
                error:{
                    code: error.code,
                    message: error.message
                }
            });
            return;
        }
        next(error);
    }
}

/**
    @desc   Clear refresh token cookie
    @route  POST /auth/logout
    @access private
*/
export async function logout(req: Request, res: Response): Promise<void>{
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    });
    res.json({
        success: true,
        data: {message: 'Logged out successfully'},
    });
}

/**
    @desc   Get current authenticated user, Requires authentication middleware
    @route  GET /auth/me
    @access private
*/
export async function getCurrentUser(req: Request, res:Response, next: NextFunction): Promise<void>{
    try {
        // User is attached to request by auth middleware
        const user=req.user;
        if(!user){
            res.status(401).json({
                success: false,
                error: {
                    code: ERROR_CODES.UNAUTHORIZED,
                    message: 'Not authenticated',
                }
            });
            return;
        }
        res.json({
            success: true,
            data: {user}
        });
    } catch (error) {
        next(error);
    }
}

/**
    @desc   Get user's salt for key derivation
    @route  POST /auth/get-salt
    @access public
*/
export async function getSalt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Email is required',
        },
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: ['salt'], // Only fetch salt, not sensitive data
    });

    if (!user) {
      // Return generic error to prevent email enumeration
      res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'No account found with this email',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { salt: user.salt },
    });
  } catch (error) {
    next(error);
  }
}