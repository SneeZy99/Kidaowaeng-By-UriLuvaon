import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser, AuthError } from "@/lib/verifyUser";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyUser(req);
    const body = await req.json().catch(() => ({}));
    const icName = String(body?.icName ?? "").trim().replace(/\s+/g, " ");

    // Require at least a first and last name (two words).
    const parts = icName.split(" ").filter(Boolean);
    if (parts.length < 2 || icName.length < 3 || icName.length > 60) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อและนามสกุลให้ครบ (อย่างน้อย 2 คำ)" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
    }

    await userRef.update({ icName });
    return NextResponse.json({ ok: true, icName });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 400 });
  }
}
