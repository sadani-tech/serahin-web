import { randomBytes } from "crypto";

/**
 * Token akses portal pembeli (FR-5.1): acak & tidak berurutan.
 * 32 karakter URL-safe dari 24 byte acak kriptografis.
 */
export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
}
