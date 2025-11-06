import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Cryptography Utilities
 * 
 * Server-side crypto operations for authentication
 * Note: Vault encryption/decryption happens CLIENT-SIDE only
 */

/**
 * Hash a password using bcrypt
 * 
 * bcrypt is used for the SERVER-SIDE hash layer
 * This is the second hash (client sends Argon2 hash, we hash it again)
 * 
 * @param password - The password to hash (already Argon2 hashed from client)
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string>{
    const saltRound=12; //Higer=more secure but slower
    return bcrypt.hash(password, saltRound);
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain password to verify
 * @param hash - Stored hash to compare against
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean>{
    return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random token
 * 
 * Used for:
 * - Email verification tokens
 * - Password reset tokens
 * - 2FA backup codes
 * 
 * @param bytes - Number of random bytes (default: 32)
 * @returns Hex-encoded random string
 */
export function generateRandomToken(bytes: number=32): string{
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a 6-digit numeric code
 * 
 * Used for email-based 2FA
 * 
 * @returns 6-digit string (e.g., "123456")
 */
export function generateSixDigitCode(): string{
    // Generate number between 0 and 999999
    const code= crypto.randomInt(0, 1000000);
    // Pad with leading zeros
    return code.toString().padStart(6, '0');
}

/**
 * Timing-safe string comparison
 * 
 * Regular === comparison can leak timing information
 * Attackers can use timing attacks to guess values
 * 
 * crypto.timingSafeEqual ensures constant-time comparison
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */

/*
VULNERABLE
if (userCode === correctCode) { ... }
Takes less time if first character is wrong
Attacker can guess character-by-character
   
SECURE
if (timingSafeEqual(userCode, correctCode)) { ... }
Always takes same time regardless of where strings differ
*/

export function timingSafeEqual(a:string, b:string): boolean{
    // ensure both strings are the same length (pad shorter one)
    const length= Math.max(a.length, b.length);
    const bufferA= Buffer.from(a.padEnd(length, '\0'));
    const bufferB= Buffer.from(b.padEnd(length, '\0'));

    return crypto.timingSafeEqual(bufferA, bufferB);
}