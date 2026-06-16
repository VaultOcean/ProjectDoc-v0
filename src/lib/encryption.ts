import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-dev-key-32-chars-long!!";
const ALGORITHM = "aes-256-gcm";

export function encryptField(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0")),
    iv
  );

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
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0")),
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function maskSensitiveData(value: string, keepChars: number = 4): string {
  if (value.length <= keepChars) return "****";
  return value.slice(0, keepChars) + "*".repeat(value.length - keepChars);
}
