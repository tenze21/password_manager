import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@utils/jwt.js";
import { User } from "@models/index.js";
import { ERROR_CODES, UserPublicData } from "@password_manager/shared";

/**
 * Authentication Middleware
 * 
 * Protects routes by verifying JWT access token
 * Attaches user data to request object
*/
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        // Extract token from Authorization header
        // Format: "Bearer <token>"
        const authHeader= req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            res.status(401).json({
                success: false,
                error:{
                    code: ERROR_CODES.UNAUTHORIZED,
                    message: 'No token provided'
                }
            });
            return;
        }

        const token= authHeader.substring(7); //Remove "Bearer" prefix
        // verify token
        const payload = verifyAccessToken(token);
        if(!payload){
            res.status(401).json({
                success: false,
                error: {
                    code: ERROR_CODES.TOKEN_EXPIRED,
                    message: 'Invalid or expired'
                }
            });
            return;
        }

        // Fetch user from database (user still exist)
        const user= await User.findByPk(payload.userId);
        if(!user){
            res.status(401).json({
                success: false,
                error:{
                    code: ERROR_CODES.UNAUTHORIZED,
                    message: 'User not found'
                }
            });
            return;
        }

        // Attach user data to request
        const userPublicData: UserPublicData={
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        req.user= userPublicData;

        // Continue to next middleware/route handler
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication middleware
 * 
 * Attaches user if token is valid, but doesn't reject if missing
 * Useful for routes that behave differently for authenticated users
*/
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      next();
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (payload) {
      const user = await User.findByPk(payload.userId);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on errors, just continue without user
    next();
  }
}