import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyGuildMember } from "@/lib/verifyMember";

export async function PATCH(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "ไม่พบ token" }, { status: 401 });
    const user = await verifyGuildMember(req);
    const body = await req.json();
    const icName = typeof body.icName === "string" ? body.icName.trim().replace(/\s+/g, " ") : "";
    const facebookUrl = typeof body.facebookUrl === "string" ? body.facebookUrl.trim() : "";
    if (icName.length < 3 || icName.length > 60 || !icName.includes(" ")) {
      return NextResponse.json({ error: "กรุณากรอกชื่อและนามสกุล IC" }, { status: 400 });
    }
    if (facebookUrl) {
      let url: URL;
      try { url = new URL(facebookUrl); } catch { return NextResponse.json({ error: "ลิงก์ Facebook ไม่ถูกต้อง" }, { status: 400 }); }
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (url.protocol !== "https:" || (host !== "facebook.com" && host !== "fb.com" && host !== "m.facebook.com")) {
        return NextResponse.json({ error: "กรุณาใช้ลิงก์จาก Facebook" }, { status: 400 });
      }
    }
    await adminDb.collection("users").doc(user.uid).set({ icName, displayName: icName, facebookUrl }, { merge: true });
    return NextResponse.json({ ok: true, icName, facebookUrl });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "บันทึกโปรไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}
