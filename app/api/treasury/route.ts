import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "ไม่พบ token การยืนยันตัวตน" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);
    const snapshot = await adminDb.collection("treasury").doc("main").get();
    const data = snapshot.data() ?? {};

    return NextResponse.json({
      treasury: {
        cash: Number(data.cash ?? 0),
        redMoney: Number(data.redMoney ?? 0),
        updatedAt: Number(data.updatedAt ?? 0),
      },
    });
  } catch (error) {
    console.error("Treasury read failed", error);
    return NextResponse.json({ error: "โหลดยอดเงินไม่สำเร็จ" }, { status: 500 });
  }
}
