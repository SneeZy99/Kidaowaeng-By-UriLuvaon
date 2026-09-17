import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { AuthError } from "@/lib/verifyAdmin";

export { AuthError };

/** Verifies the Firebase ID token in the Authorization header. Any signed-in user passes. */
export async function verifyUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new AuthError("ไม่พบ token การยืนยันตัวตน");

  const decoded = await adminAuth.verifyIdToken(token).catch(() => {
    throw new AuthError("Token ไม่ถูกต้องหรือหมดอายุ");
  });

  return { uid: decoded.uid };
}
