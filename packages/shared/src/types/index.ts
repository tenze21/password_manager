// ============================================
// USER TYPES
// ============================================

/**
 * User entity as stored in the database
 * Contains authentication and account information
 */

export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    masterPasswordHash: string; // Derived from master password, used for authentication
    encryptedPrivateKey: string;// User's private key, encrypted with master password
    publicKey: string;// User's public key for sharing (future feature)
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Public user data safe to send to client
 * Excludes sensitive fields like password hash
 */
export interface UserPublicData {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// VAULT TYPES
// ============================================

/**
 * Password entry stored in the vault
 * All sensitive fields are encrypted on the client before storage
 */

export interface PasswordEntry {
    id: string;
    userId: string;
    websiteUrl?: string;
    websiteName: string;
    encryptedUsername: string; // Encrypted with user's encryption key
    encryptedPassword: string; // Encrypted with user's encryption key
    encryptedNotes?: string;  // Optional encrypted notes
    folder?: string; // Optional folder/category
    favorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Decrypted password entry (client-side only)
 * Never sent to server in this form
 */
export interface DecryptedPasswordEntry {
    id: string;
    websiteUrl?: string;
    username: string;
    password: string;
    notes?: string;
    folder?: string;
    favorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

/**
 * Registration request payload
 */
export interface RegisterRequest{
    email: string;
    masterPasswordHash: string; // Already hashed on client
    encryptedPrivateKey: string;
    publicKey: string;
    salt: string; // Salt used for key derivation (stored for login)
}

/**
 * Login request payload
 */
export interface LoginRequest{
    email: string;
    masterPassword: string;
    twoFactorCode?: string; // Optional 2FA code
}

/**
 * Authentication response
 */
export interface AuthResponse{
    user: UserPublicData;
    accessToken: string;
    refreshToken: string;
    encryptedPrivateKey: string; // Needed for client-side decryption
    salt: string; // Needed for key derivation
}

// ============================================
// 2FA TYPES
// ============================================

/**
 * Two-factor authentication methods
 */
export enum TwoFactorMethod{
    EMAIL='email',
    TOTP='totp', // Time-based One-Time Password (Google Authenticator)
}

/**
 * 2FA settings for a user
 */
export interface TwoFactorSettings{
    id: string;
    userId: string;
    method: TwoFactorMethod;
    enabled: boolean;
    secret?: string; // TOTP secret (encrypted)
    backupCodes?: string[];// Encrypted backup codes
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T=any>{
    success: true;
    data: T;
    message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse{
    success: false;
    error:{
        code: string;
        message: string;
        details?:any;
    };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any>= ApiSuccessResponse<T> | ApiErrorResponse;//CHECK

// ============================================
// CRYPTOGRAPHY TYPES
// ============================================

/**
 * Encryption metadata
 * Includes algorithm, IV, and other parameters needed for decryption
 */
export interface EncryptionMetadata{
    algorithm: string; // e.g., 'AES-GCM'
    iv: string; // Initialization vector (base64)
    salt?: string; //salt if used
}

/**
 * Encrypted data structure
*/
export interface EncryptedData{
    ciphertext: string; // Base64 encoded encrypted data
    metadata: EncryptionMetadata;
}