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
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const isMember = token ? await adminAuth.verifyIdToken(token).then(() => true).catch(() => false) : false;
    const snapshot = await adminDb.collection("users").get();
    const members = snapshot.docs
      .map((member) => {
        const data = member.data();
        const icName = data.icName ?? data.displayName ?? "สมาชิกแก๊ง";
        if (!isMember) return { uid: member.id, discordId: "", username: "", avatarUrl: "", role: "member", icName, displayName: "", facebookUrl: data.facebookUrl ?? "", createdAt: 0 };
        return {
          uid: member.id,
          discordId: data.discordId ?? "",
          username: data.username ?? "สมาชิกแก๊ง",
          avatarUrl: data.avatarUrl ?? "",
          role: data.role === "admin" ? "admin" : "member",
          icName,
          displayName: data.displayName ?? "",
          facebookUrl: data.facebookUrl ?? "",
          createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? 0,
        };
      })
      .sort((a, b) => Number(b.role === "admin") - Number(a.role === "admin") || a.icName.localeCompare(b.icName));

    return NextResponse.json({ members, isMember });
  } catch (error) {
    console.error("Members read failed", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดรายชื่อสมาชิกได้" }, { status: 401 });
  }
}
