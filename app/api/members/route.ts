import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";

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
    const isMember = token
      ? await adminAuth.verifyIdToken(token).then((user) => user.guildMember === true).catch(() => false)
      : false;
    const snapshot = await adminDb.collection("users").get();
    const members = snapshot.docs
      .map((member) => {
        const data = member.data();
        const icName = data.icName ?? data.displayName ?? "สมาชิกแก๊ง";
        if (!isMember) return { uid: member.id, discordId: "", username: "", avatarUrl: data.avatarUrl ?? "", role: "member", icName, displayName: "", facebookUrl: data.facebookUrl ?? "", createdAt: 0 };
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

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const icName = typeof body.icName === "string" ? body.icName.trim().replace(/\s+/g, " ") : "";
    const facebookUrl = typeof body.facebookUrl === "string" ? body.facebookUrl.trim() : "";
    if (icName.length < 2 || icName.length > 60) return NextResponse.json({ error: "Invalid member name" }, { status: 400 });
    if (facebookUrl) {
      try {
        const url = new URL(facebookUrl);
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (url.protocol !== "https:" || !["facebook.com", "m.facebook.com", "fb.com"].includes(host)) throw new Error();
      } catch { return NextResponse.json({ error: "Invalid Facebook URL" }, { status: 400 }); }
    }
    const uid = `manual:${crypto.randomUUID()}`;
    await adminDb.collection("users").doc(uid).set({ uid, discordId: "", username: icName, avatarUrl: "", role: "member", guildMember: false, icName, displayName: icName, facebookUrl, createdAt: Date.now() });
    return NextResponse.json({ ok: true, uid }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Member create failed", error);
    return NextResponse.json({ error: "Unable to add member" }, { status: 500 });
  }
}
