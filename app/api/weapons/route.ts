import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyGuildMember } from "@/lib/verifyMember";

export const dynamic = "force-dynamic";

function validImageUrl(value: unknown) {
  if (value === "") return true;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function getUser(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new Error("ไม่พบ token การยืนยันตัวตน");
  const decoded = await verifyGuildMember(req);
  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const user = userSnap.data() ?? {};
  return { uid: decoded.uid, username: user.username ?? decoded.username ?? "สมาชิกแก๊ง", avatarUrl: user.avatarUrl ?? decoded.avatarUrl ?? "" };
}

export async function GET(req: NextRequest) {
  try {
    await getUser(req);
    const snapshot = await adminDb.collection("weapons").get();
    const weapons = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ weapons });
  } catch (error) {
    console.error("Weapons read failed", error);
    return NextResponse.json({ error: "โหลดคลังอาวุธไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const quantity = body.quantity;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!name || name.length > 80 || !Number.isInteger(quantity) || quantity <= 0 || !validImageUrl(imageUrl)) {
      return NextResponse.json({ error: "ชื่ออาวุธหรือจำนวนไม่ถูกต้อง" }, { status: 400 });
    }

    const weapon = await adminDb.collection("weapons").add({
      name,
      quantity,
      note,
      imageUrl,
      ownerId: user.uid,
      ownerName: user.username,
      ownerAvatar: user.avatarUrl,
      createdAt: FieldValue.serverTimestamp(),
    });
    await adminDb.collection("transactions").add({
      kind: "deposit",
      targetType: "weapon",
      targetKey: weapon.id,
      targetLabel: name,
      amount: quantity,
      note,
      status: "approved",
      action: "add_weapon",
      requestedBy: user.uid,
      requestedByName: user.username,
      requestedByAvatar: user.avatarUrl,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: weapon.id });
  } catch (error) {
    console.error("Weapon create failed", error);
    return NextResponse.json({ error: "เพิ่มอาวุธไม่สำเร็จ" }, { status: 500 });
  }
}
