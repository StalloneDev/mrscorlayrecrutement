import { createHmac, randomBytes } from "node:crypto";

export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInvitationToken(token: string): string | null {
  const secret = process.env.SESSION_SECRET || "mrs_corlay_fallback_secret_recruitment_2026";
  if (!token || token.length < 16) return null;
  return createHmac("sha256", secret).update(token).digest("hex");
}
