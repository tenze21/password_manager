import { argon2id } from 'hash-wasm';
import { ARGON2_PARAMS } from '@password_manager/shared';

/**
 * Client-Side Cryptography Utilities
 */

// ==========================================
// KEY DERIVATION
// ==========================================

/**
 * Derive encryption key from master password
 */
export async function deriveEncryptionKey(
  masterPassword: string,
  salt: string
): Promise<string> {
  const saltBytes = base64ToUint8Array(salt);
  
  const hash = await argon2id({
    password: masterPassword,
    salt: saltBytes,
    parallelism: ARGON2_PARAMS.PARALLELISM,
    iterations: ARGON2_PARAMS.ITERATIONS,
    memorySize: ARGON2_PARAMS.MEMORY,
    hashLength: ARGON2_PARAMS.HASH_LENGTH,
    outputType: 'hex',
  });
  
  return hash;
}

/**
 * Derive master password hash for authentication
 */
export async function deriveMasterPasswordHash(
  masterPassword: string,
  salt: string
): Promise<string> {
  return deriveEncryptionKey(masterPassword, salt);
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): string {
  const saltArray = new Uint8Array(ARGON2_PARAMS.SALT_LENGTH);
  crypto.getRandomValues(saltArray);
  return uint8ArrayToBase64(saltArray);
}

// ==========================================
// SYMMETRIC ENCRYPTION (AES-GCM)
// ==========================================

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(
  plaintext: string,
  key: string
): Promise<{ ciphertext: string; iv: string }> {
  const keyBuffer = hexToUint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer as unknown as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer },
    cryptoKey,
    plaintextBuffer.buffer
  );
  
  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
    iv: uint8ArrayToBase64(iv),
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(
  ciphertext: string,
  key: string,
  iv: string
): Promise<string> {
  const keyBuffer = hexToUint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer as unknown as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const ciphertextBuffer = base64ToUint8Array(ciphertext);
  const ivBuffer = base64ToUint8Array(iv);
  
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer as unknown as ArrayBuffer },
    cryptoKey,
    ciphertextBuffer as unknown as ArrayBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

// ==========================================
// RSA KEY PAIR GENERATION
// ==========================================

/**
 * Generate RSA key pair
 */
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = uint8ArrayToBase64(new Uint8Array(publicKeyBuffer));
  const publicKeyPEM = formatKeyAsPEM(publicKeyBase64, 'PUBLIC KEY');

  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyBase64 = uint8ArrayToBase64(new Uint8Array(privateKeyBuffer));
  const privateKeyPEM = formatKeyAsPEM(privateKeyBase64, 'PRIVATE KEY');

  return {
    publicKey: publicKeyPEM,
    privateKey: privateKeyPEM,
  };
}

function formatKeyAsPEM(base64Key: string, type: string): string {
  const pemHeader = `-----BEGIN ${type}-----`;
  const pemFooter = `-----END ${type}-----`;
  const keyLines = base64Key.match(/.{1,64}/g) || [];
  return `${pemHeader}\n${keyLines.join('\n')}\n${pemFooter}`;
}

export async function encryptPrivateKey(
  privateKeyPEM: string,
  encryptionKey: string
): Promise<{ ciphertext: string; iv: string }> {
  return encrypt(privateKeyPEM, encryptionKey);
}

export async function decryptPrivateKey(
  encryptedPrivateKey: string,
  encryptionKey: string,
  iv: string
): Promise<string> {
  return decrypt(encryptedPrivateKey, encryptionKey, iv);
}

// ==========================================
// PASSWORD ENTRY ENCRYPTION
// ==========================================

/**
 * Encrypt a password entry field
 */
export async function encryptField(
  plaintext: string,
  encryptionKey: string
): Promise<string> {
  const { ciphertext, iv } = await encrypt(plaintext, encryptionKey);
  return `${iv}:${ciphertext}`;
}

/**
 * Decrypt a password entry field
 */
export async function decryptField(
  encrypted: string,
  encryptionKey: string
): Promise<string> {
  const [iv, ciphertext] = encrypted.split(':');
  
  if (!iv || !ciphertext) {
    throw new Error('Invalid encrypted data format');
  }
  
  return decrypt(ciphertext, encryptionKey, iv);
}

// ==========================================
// PASSWORD GENERATOR
// ==========================================

/**
 * Generate a random password
 */
export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  }
): string {
  let charset = '';
  
  if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (options.numbers) charset += '0123456789';
  if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (charset.length === 0) {
    throw new Error('At least one character set must be selected');
  }
  
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i]! % charset.length];
  }
  
  return password;
}

/**
 * Calculate password strength score (0-4)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  return Math.min(score, 4);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// ==========================================
// ENCODING UTILITIES
// ==========================================

function uint8ArrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

function hexToUint8Array(hex: string): Uint8Array {
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    array[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return array;
}