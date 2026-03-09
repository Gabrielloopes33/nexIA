/**
 * Simple encryption/decryption utilities for sensitive data
 * In production, use a proper encryption library like crypto-js or node:crypto with AES
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production";

/**
 * Encrypt a string
 * Note: This is a simple implementation. In production, use proper encryption.
 */
export function encrypt(text: string): string {
  try {
    // For now, we'll use a simple base64 encoding
    // In production, replace with proper AES encryption using node:crypto
    const buffer = Buffer.from(text);
    return buffer.toString("base64");
  } catch (error) {
    console.error("[Crypto] Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string
 * Note: This is a simple implementation. In production, use proper decryption.
 */
export function decrypt(encryptedText: string): string {
  try {
    // For now, we'll use a simple base64 decoding
    // In production, replace with proper AES decryption using node:crypto
    const buffer = Buffer.from(encryptedText, "base64");
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("[Crypto] Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a random string for tokens/IDs
 */
export function generateRandomString(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash a string (for verification tokens, etc.)
 */
export function hashString(text: string): string {
  // Simple hash - replace with proper hashing in production
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
