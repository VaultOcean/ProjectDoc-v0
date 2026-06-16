import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const COOKIE = "vo_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Verify the cookie and return the current user, or null. Never throws. */
export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid as string | undefined;
    if (!uid) return null;
    return await db.user.findUnique({ where: { id: uid } });
  } catch {
    return null;
  }
}

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(input: {
  email?: unknown;
  password?: unknown;
  handle?: unknown;
}): { email: string; password: string; handle?: string } | { error: string } {
  const { email, password, handle } = input;
  if (typeof email !== "string" || !EMAIL_RE.test(email)) return { error: "Enter a valid email." };
  if (typeof password !== "string" || password.length < 8 || password.length > 200)
    return { error: "Password must be 8–200 characters." };
  if (handle !== undefined) {
    if (typeof handle !== "string" || !HANDLE_RE.test(handle))
      return { error: "Handle must be 3–24 characters: letters, numbers, _ or -." };
    return { email: email.toLowerCase(), password, handle };
  }
  return { email: email.toLowerCase(), password };
}
