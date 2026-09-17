import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAdmin(req);

    const userRef = adminDb.collection("users").doc(params.id);
    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "ไม่พบสมาชิกนี้" }, { status: 404 });
    }

    await userRef.update({ disabled: false });
    await adminAuth.updateUser(params.id, { disabled: false }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 400 });
  }
}
