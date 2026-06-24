import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "mecha_session";

/**
 * Derive an unguessable session token from the shared password.
 * Anyone who knows APP_PASSWORD (via the login form) gets this exact token
 * set as an httpOnly cookie; the cookie value can't be forged without the
 * password, so checking it server-side is enough for this throwaway setup.
 */
export function sessionToken(): string {
  const password = process.env.APP_PASSWORD ?? "";
  return createHash("sha256").update(`mecha::${password}`).digest("hex");
}

export function isValidPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "";
  // length-aware compare; fine for a single shared secret
  return expected.length > 0 && input === expected;
}

export function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return !!token && token === sessionToken();
}
