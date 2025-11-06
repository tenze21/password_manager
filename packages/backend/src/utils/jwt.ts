import jwt from 'jsonwebtoken';
import {config} from '@config/env.js';
import { TOKEN_EXPIRY } from '@password_manager/shared';

/**
 * JWT Utilities
 * 
 * JSON Web Tokens for stateless authentication
 */

/**
 * JWT payload for access tokens
 */
export interface AccessTokenPayload{
    userId: string;
    email: string;
    type: 'access';
}

/**
 * JWT payload for refresh tokens
 */
export interface RefreshTokenPayload{
    userId: string;
    type: 'refresh';
}

/**
 * Generic JWT payload
 */
type TokenPayload= AccessTokenPayload | RefreshTokenPayload;

/**
 * Generate an access token
 * 
 * Access tokens are short-lived (15 minutes)
 * Include user info needed for authorization
 * 
 * @param userId - User's ID
 * @param email - User's email
 * @returns Signed JWT token
 */
export function generateAccessToken(userId: string, email: string): string{
    const payload: AccessTokenPayload={
        userId,
        email,
        type: 'access'
    };
    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
        issuer: 'password-manager',
        audience: 'password-manager-api',
    });
}

/**
 * Generate a refresh token
 * 
 * Refresh tokens are long-lived (7 days)
 * Used to get new access tokens
 * Should be stored securely (httpOnly cookie)
 * 
 * @param userId - User's ID
 * @returns Signed JWT token
 */
export function generateRefreshToken(userId: string): string{
    const payload: RefreshTokenPayload={
        userId,
        type: 'refresh'
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
        issuer: 'password-manager',
        audience: 'password-manager-api',
    });
}

/**
 * Verify and decode an access token
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null{
    try {
        const decoded= jwt.verify(token, config.jwt.accessSecret, {
            issuer: 'password-manager',
            audience: "password-manager-api",
        })as AccessTokenPayload;

        // verify token type
        if(decoded.type !== 'access'){
            return null;
        }

        return decoded;
    } catch (error) {
        // Token expired, invalid signature, or malformed
        return null;
    }
}

/**
 * Verify and decode a refresh token
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null{
    try {
        const decoded= jwt.verify(token, config.jwt.refreshSecret, {
            issuer: 'password-manager',
            audience: 'password-manager-api'
        })as RefreshTokenPayload;

        // verify token type
        if(decoded.type !== 'refresh'){
            return null;
        }

        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Decode token without verification
 * 
 * Useful for debugging or extracting info from expired tokens
 * DO NOT use for authentication!
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if malformed
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}