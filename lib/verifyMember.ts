import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { AuthError } from "@/lib/verifyAdmin";

/** Verifies a Firebase session minted after Discord guild membership was checked. */
export async function verifyGuildMember(req: NextRequest): Promise<DecodedIdToken> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new AuthError("Authentication token is required");

  const decoded = await adminAuth.verifyIdToken(token).catch(() => {
    throw new AuthError("Invalid or expired authentication token");
  });
  if (decoded.guildMember !== true) {
    throw new AuthError("Discord guild membership is required", 403);
  }
  return decoded;
}
