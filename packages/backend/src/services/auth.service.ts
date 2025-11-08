import {User} from '@models/index.js';
import {hashPassword, verifyPassword} from "@utils/crypto.js";
import { generateAccessToken, generateRefreshToken } from '@utils/jwt.js';
import { RegisterRequest, AuthResponse, LoginRequest, UserPublicData, ERROR_CODES } from '@password_manager/shared';

/**
 * Authentication Service
 * 
 * Business logic for user authentication
 * Separated from controllers for:
 * - Easier testing
 * - Reusability
 * - Cleaner code organization
 */

/**
 * Custom authentication error
 * 
 * Allows throwing errors with specific error codes
 */
export class AuthError extends Error{
    constructor(
        public code: string,
        message: string,
        public statusCode: number=400
    ){
        super(message);
        this.name= 'AuthError';
    }
}

/**
 * Register a new user
 * 
 * Flow:
 * 1. Check if email already exists
 * 2. Hash the password (client already hashed with Argon2)
 * 3. Create user in database
 * 4. Generate JWT tokens
 * 5. Return auth response
 * 
 * @param data - Registration data from client
 * @returns Authentication response with tokens
 * @throws AuthError if registration fails
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse>{
    const existingUser= await User.findOne({where: {email: data.email}});
    if(existingUser){
        throw new AuthError(ERROR_CODES.EMAIL_ALREADY_EXISTS, 'Email already registered', 409);
    }

    // Hash the password (second layer of hashing)
    // Client sent Argon2 hash, we hash it again with bcrypt
    const hashedPassword= await hashPassword(data.masterPasswordHash);

    // Create user
    const user= await User.create({
        email: data.email,
        masterPasswordHash: hashedPassword,
        encryptedPrivateKey: data.encryptedPrivateKey,
        publicKey: data.publicKey,
        salt: data.salt,
        emailVerified: false, //Email verification required
    });

    // Generate tokens
    const accessToken= generateAccessToken(user.id, user.email);
    const refreshToken= generateRefreshToken(user.id);

    // Prepare public user data (exclude sensitive fields)
    const userPublicData: UserPublicData={
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };

    return{
        user: userPublicData,
        accessToken,
        refreshToken,
        encryptedPrivateKey: user.encryptedPrivateKey,
        salt: user.salt,
    }
}

/**
 * Authenticate a user
 * 
 * Flow:
 * 1. Find user by email
 * 2. Check if account is locked
 * 3. Verify password
 * 4. Check 2FA if enabled
 * 5. Reset failed login attempts
 * 6. Generate tokens
 * 
 * @param data - Login credentials
 * @returns Authentication response with tokens
 * @throws AuthError if login fails
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse>{
    // Find user
    const user= await User.findOne({
        where: {email: data.email}, 
        include: ['twoFactorSettings'] //Include 2FA settings if exist
    });
    if(!user){
        throw new AuthError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    // Check if account is locked
    if(user.lockedUntil && user.lockedUntil > new Date()){
        const minutesLeft= Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new AuthError(ERROR_CODES.ACCOUNT_LOCKED, `Account locked. Try again in ${minutesLeft} minutes`, 423);
    }

    // Verify password
    const isPasswordValid= await verifyPassword(data.masterPasswordHash, user.masterPasswordHash);

    if(!isPasswordValid){
        // Increment failed login attempts
        await incrementFailedLoginAttempt(user);

        throw new AuthError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    // Check 2FA if enabled
    if(user.twoFactorSettings?.enabled){
        if(!data.twoFactorCode){
            throw new AuthError(
                ERROR_CODES.TWO_FACTOR_REQUIRED, 
                '2FA code required', 
                403
            );
        }
        // TODO: Verify 2FA code (we'll implement this later)
        // For now, just check if code is provided
    }

    // Reset failed login attempt on successful login
    if(user.failedLoginAttempts > 0){
        await user.update({
            failedLoginAttempts: 0,
            lockedUntil: null
        });
    }

    // Generate tokens
    const accessToken= generateAccessToken(user.id, user.email);
    const refreshToken= generateRefreshToken(user.id);

    // Prepare response
    const userPublicData: UserPublicData={
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };

    return{
        user: userPublicData,
        accessToken,
        refreshToken,
        encryptedPrivateKey: user.encryptedPrivateKey,
        salt: user.salt
    };
}

/**
 * Increment failed login attempts and lock account if needed
 * 
 * Brute force protection:
 * - After 5 failed attempts, lock account for 15 minutes
 * 
 * @param user - User instance
 */
async function incrementFailedLoginAttempt(user: User): Promise<void>{
    const newAttempts= user.failedLoginAttempts + 1;
    const MAX_ATTEMPTS= 5;
    const LOCK_DURATION_MS= 15 * 60 * 1000; //15 minutes

    let lockedUntil= user.lockedUntil;
    if(newAttempts >= MAX_ATTEMPTS){
        lockedUntil= new Date(Date.now() + LOCK_DURATION_MS);
    }

    await user.update({
        failedLoginAttempts: newAttempts,
        lockedUntil,
    });
}

/**
 * Refresh access token using refresh token
 * 
 * @param userId - User ID from refresh token
 * @returns New access token
 * @throws AuthError if user not found
*/
export async function refreshAccessToken(userId: string): Promise<string>{
    const user= await User.findByPk(userId);

    if(!user){
        throw new AuthError(
            ERROR_CODES.UNAUTHORIZED,
            'User not found',
            401
        );
    }
    return generateAccessToken(user.id, user.email);
}