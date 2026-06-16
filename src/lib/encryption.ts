import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * Derive a stable 32-byte key from ENCRYPTION_KEY.
 * In production the env var is mandatory; in dev we fall back to a clearly
 * marked insecure key so local work isn't blocked.
 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ENCRYPTION_KEY must be set to at least 32 characters in production."
      );
    }
    const fallback = "insecure-dev-key-do-not-use-in-prod!";
    return Buffer.from(fallback.slice(0, 32).padEnd(32, "0"));
  }
  // Hash any sufficiently long secret down to exactly 32 bytes.
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptField(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptField(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "hex"));

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function maskSensitiveData(value: string, keepChars: number = 4): string {
  if (value.length <= keepChars) return "****";
  return value.slice(0, keepChars) + "*".repeat(value.length - keepChars);
}
