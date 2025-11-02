// ============================================
// CRYPTOGRAPHY CONSTANTS
// ============================================

/**
 * Argon2 parameters for key derivation
 * 
 * Argon2id is the recommended variant (hybrid of Argon2i and Argon2d)
 * - Resistant to side-channel attacks
 * - Resistant to GPU cracking
 * 
 * Parameters based on OWASP recommendations (2023)
 */
export const ARGON2_PARAMS={
    MEMORY: 64 * 1024, // 64 MB (memory cost)
    ITERATIONS: 3, //Time cost (iterations)
    PARALLELISM: 4, // Number of parallel threads
    HASH_LENGTH: 32, //output length in bytes
    SALT_LENGTH: 16, // salt length in bytes
} as const;

/**
 * AES-GCM encryption parameters
 * 
 * AES-GCM is an authenticated encryption mode
 * - Provides both confidentiality and authenticity
 * - Industry standard for modern encryption
 */
export const AES_PARAMS={
    KEY_LENGTH: 256, //AES-256 (32 bytes)
    IV_LENGTH: 12, // recommended IV length for GCM
    TAG_LENGTH: 128 // Authentication tag length (bits)
} as const;

// ============================================
// JWT CONSTANTS
// ============================================

/**
 * JWT token expiration times
 */
export const TOKEN_EXPIRY={
    ACCESS_TOKEN: '15m', //Short-lived access token
    REFRESH_TOKEN: '7d', //Longer-lived refresh token
    EMAIL_VERIFICATION: '24h', //Email verification token
    PASSWORD_RESET: '1h', //Password reset token
}as const;

// ============================================
// VALIDATION CONSTANTS
// ============================================

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS={
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
}as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMITS={
    LOGIN_ATTEMPTS: 5, //Max failed login attempts
    LOGIN_WINDOW: 15*60*1000, // 15 minutes in milliseconds
    API_REQUESTS: 100, // Max API requests per window
    API_WINDOW: 15*60*1000 // 15 minutes
}as const;

// ============================================
// ERROR CODES
// ============================================

/**
 * Standardized error codes for API responses
 * Makes error handling consistent across frontend/backend
 */
export const ERROR_CODES={
    // Authentication errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
    INVALID_TWO_FACTOR: 'INVALID_TWO_FACTOR',
    
    // Authorozation errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',

    //Resource errors
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    
    //server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR' 
}as const;

/**
 * Type-safe error code type
 */
export type ErrorCode= typeof ERROR_CODES[keyof typeof ERROR_CODES];