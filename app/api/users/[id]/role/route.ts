import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json().catch(() => ({}));
    const role = body?.role;

    if (role !== "admin" && role !== "member") {
      return NextResponse.json({ error: "role ไม่ถูกต้อง" }, { status: 400 });
    }
    if (params.id === admin.uid) {
      return NextResponse.json(
        { error: "ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(params.id);
    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "ไม่พบสมาชิกนี้" }, { status: 404 });
    }

    await userRef.update({ role });

    // Refresh the custom claim used by Firestore rules, and force any active
    // session for this user to re-authenticate so the new role takes effect.
    await adminAuth.setCustomUserClaims(params.id, { role }).catch(() => {});
    await adminAuth.revokeRefreshTokens(params.id).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 400 });
  }
}
