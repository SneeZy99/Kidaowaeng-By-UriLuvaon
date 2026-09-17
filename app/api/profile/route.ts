import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "ไม่พบ token" }, { status: 401 });
    const user = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const icName = typeof body.icName === "string" ? body.icName.trim().replace(/\s+/g, " ") : "";
    if (icName.length < 3 || icName.length > 60 || !icName.includes(" ")) {
      return NextResponse.json({ error: "กรุณากรอกชื่อและนามสกุล IC" }, { status: 400 });
    }
    await adminDb.collection("users").doc(user.uid).set({ icName, displayName: icName }, { merge: true });
    return NextResponse.json({ ok: true, icName });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "บันทึกโปรไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}
