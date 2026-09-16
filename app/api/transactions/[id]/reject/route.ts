import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json().catch(() => ({}));
    const txRef = adminDb.collection("transactions").doc(params.id);

    await adminDb.runTransaction(async (t) => {
      const txSnap = await t.get(txRef);
      if (!txSnap.exists) throw new Error("ไม่พบรายการนี้");
      if (txSnap.data()!.status !== "pending") {
        throw new Error("รายการนี้ถูกดำเนินการไปแล้ว");
      }
      t.update(txRef, {
        status: "rejected",
        reviewedBy: admin.uid,
        reviewedByName: admin.username,
        reviewedAt: FieldValue.serverTimestamp(),
        rejectReason: body?.reason ?? "",
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
