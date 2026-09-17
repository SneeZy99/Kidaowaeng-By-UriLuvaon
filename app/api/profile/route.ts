import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

function getBearerToken(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function PATCH(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "ไม่พบ token การยืนยันตัวตน" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";

    if (username.length < 2 || username.length > 32) {
      return NextResponse.json({ error: "ชื่อควรมีความยาว 2-32 ตัวอักษร" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "ไม่พบโปรไฟล์สมาชิก" }, { status: 404 });
    }

    const current = userSnap.data() ?? {};
    await userRef.update({ username });
    return NextResponse.json({ ok: true, username, avatarUrl: current.avatarUrl ?? "" });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "บันทึกโปรไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}
