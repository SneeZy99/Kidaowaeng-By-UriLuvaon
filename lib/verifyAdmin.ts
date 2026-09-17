import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { isStaffRole } from "@/lib/roles";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Verifies the Firebase ID token and confirms an admin-equivalent role. */
export async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new AuthError("ไม่พบ token การยืนยันตัวตน");

  const decoded = await adminAuth.verifyIdToken(token).catch(() => {
    throw new AuthError("Token ไม่ถูกต้องหรือหมดอายุ");
  });

  if (decoded.guildMember !== true) {
    throw new AuthError("Discord guild membership is required", 403);
  }

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const role = userSnap.exists ? userSnap.data()?.role : undefined;

  if (!isStaffRole(role)) {
    throw new AuthError("เฉพาะหัวหน้าแก๊งเท่านั้นที่ทำรายการนี้ได้", 403);
  }

  return { uid: decoded.uid, username: userSnap.data()?.username as string };
}
