import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

async function requireUser(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("Missing authentication token");
  await adminAuth.verifyIdToken(token);
}

export async function GET(req: NextRequest) {
  try {
    await requireUser(req);
    const snapshot = await adminDb.collection("users").get();
    const members = snapshot.docs
      .map((member) => {
        const data = member.data();
        return {
          uid: member.id,
          discordId: data.discordId ?? "",
          username: data.username ?? "สมาชิกแก๊ง",
          avatarUrl: data.avatarUrl ?? "",
          role: data.role === "admin" ? "admin" : "member",
          icName: data.icName ?? "",
          displayName: data.displayName ?? "",
          createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? 0,
        };
      })
      .sort((a, b) => Number(b.role === "admin") - Number(a.role === "admin") || a.username.localeCompare(b.username));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Members read failed", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดรายชื่อสมาชิกได้" }, { status: 401 });
  }
}
