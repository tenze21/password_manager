import { z } from "zod";
import { TwoFactorMethod } from "../types";

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Email validation
 * - Must be valid email format
 * - Normalized to lowercase
 */

export const EmailSchema = z.email('Invalid email format').toLowerCase().trim();

/**
 * Master password validation (client-side only)
 * - Minimum 12 characters (industry standard for strong passwords)
 * - Must contain uppercase, lowercase, number, special char
 * 
 * Note: This is validated on client before hashing.
 * Server only receives the hash.
 */
export const MasterPasswordSchema = z
    .string()
    .min(12, 'Master password must be atleast 12 characters.')
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character.");

/**
 * Password hash validation (server-side)
 * The hash is a hex string from Argon2
 */
export const PasswordHashSchema=z
    .string()
    .min(32, "Invalid password hash format");

/**
 * Base64 encoded string validation
 * Used for encrypted data, keys, IVs, etc.
 */
export const Base64WithIvSchema=z
    .string()
    .regex(/^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/, "Invalid base64 with iv format.");

export const Base64Schema=z
    .string()
    .regex(/^[A-Za-z0-9+/]+=*$/, "Invalid base64 format")

/**
 * PEM format validation (for RSA keys)
 * Validates PEM-formatted keys with headers, footers, and base64 content
 */
export const PEMSchema = z
  .string()
  .regex(
    /^-----BEGIN [A-Z\s]+-----\n[\s\S]+\n-----END [A-Z\s]+-----$/,
    'Invalid PEM format'
  );

/**
 * Registration schema
 */
export const RegisterSchema=z.object({
    email: EmailSchema,
    masterPasswordHash: PasswordHashSchema,
    encryptedPrivateKey: Base64WithIvSchema,
    publicKey: PEMSchema,
    salt: Base64Schema
});

/**
 * Login schema
*/
export const LoginSchema=z.object({
    email: EmailSchema,
    masterPasswordHash: PasswordHashSchema,
    twoFactorCode: z.string().length(6).optional() //6-digit OTP
});

/**
 * Password entry creation schema
 */
export const CreatePasswordEntrySchema= z.object({
    websiteUrl: z.url().optional(),
    websiteName: z.string().min(1, "Website name is required").max(255),
    encryptedUsername: Base64WithIvSchema,
    encryptedPassword: Base64WithIvSchema,
    encryptedNotes: Base64WithIvSchema.optional(),
    folder: z.string().max(100).optional(),
    favorite: z.boolean().default(false)
});

/**
 * Password entry update schema
 * All fields optional (partial update)
 */
export const UpdatePasswordEntrySchema= CreatePasswordEntrySchema.partial();

/**
 * 2FA verification code schema
 */
export const TwoFactorCodeSchema=z
    .string()
    .length(6, "2FA code must be 6 digits.")
    .regex(/^\d{6}$/, "2FA code must contain only digits.");

/**
 * 2FA method schema
 */
export const TwoFactorMethodSchema= z.enum(TwoFactorMethod);

// ============================================
// INFERRED TYPES FROM SCHEMAS
// ============================================

/**
 * This is where Zod shines - we can infer TypeScript types from schemas
 * Single source of truth for both validation and types
 */
export type RegisterInput= z.infer<typeof RegisterSchema>;
export type LoginInput= z.infer<typeof LoginSchema>;
export type CreatePasswordEntryInput= z.infer<typeof CreatePasswordEntrySchema>;
export type UpdatePasswordEntryInput= z.infer<typeof UpdatePasswordEntrySchema>;

/*
    BENEFIT OS USING ZOD
    Perfect! Also remember: TypeScript types disappear at runtime (they're compile-time only), 
    but Zod schemas exist at runtime, catching invalid data from external sources (APIs, user input, etc.).
*/