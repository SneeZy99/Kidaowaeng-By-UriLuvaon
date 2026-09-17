import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(req);
    if (params.id === admin.uid) {
      return NextResponse.json(
        { error: "ไม่สามารถลบตัวเองออกจากระบบได้" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(params.id);
    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "ไม่พบสมาชิกนี้" }, { status: 404 });
    }

    // Soft-delete: keep the Firestore doc (so past logs still show the
    // member's name correctly) but flag it disabled and lock the Firebase
    // Auth account so the person can no longer sign in or use an existing
    // session.
    await userRef.update({ disabled: true });
    await adminAuth.updateUser(params.id, { disabled: true }).catch(() => {});
    await adminAuth.revokeRefreshTokens(params.id).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 400 });
  }
}
