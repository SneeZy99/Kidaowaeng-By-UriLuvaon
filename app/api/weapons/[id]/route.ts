import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";
import { verifyGuildMember } from "@/lib/verifyMember";

async function getIdentity(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AuthError("ไม่พบ token การยืนยันตัวตน");
  return verifyGuildMember(req);
}

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = await getIdentity(req);
    const ref = adminDb.collection("weapons").doc(params.id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: "ไม่พบอาวุธ" }, { status: 404 });
    const current = snapshot.data()!;
    let isAdmin = false;
    try { await verifyAdmin(req); isAdmin = true; } catch {}
    if (!isAdmin && current.ownerId !== decoded.uid) {
      return NextResponse.json({ error: "แก้ไขได้เฉพาะอาวุธของตัวเอง" }, { status: 403 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const quantity = body.quantity;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!name || name.length > 80 || !Number.isInteger(quantity) || quantity <= 0 || !validImageUrl(imageUrl)) {
      return NextResponse.json({ error: "ชื่ออาวุธหรือจำนวนไม่ถูกต้อง" }, { status: 400 });
    }
    await ref.update({ name, quantity, note, imageUrl, updatedAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "แก้ไขอาวุธไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = await getIdentity(req);
    const ref = adminDb.collection("weapons").doc(params.id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: "ไม่พบอาวุธ" }, { status: 404 });
    const current = snapshot.data()!;
    let isAdmin = false;
    try { await verifyAdmin(req); isAdmin = true; } catch {}
    if (!isAdmin && current.ownerId !== decoded.uid) {
      return NextResponse.json({ error: "ลบได้เฉพาะอาวุธของตัวเอง" }, { status: 403 });
    }
    await adminDb.collection("transactions").add({
      kind: "withdraw",
      targetType: "weapon",
      targetKey: params.id,
      targetLabel: current.name ?? "อาวุธ",
      amount: Number(current.quantity ?? 0),
      note: current.note ?? "",
      status: "approved",
      action: "remove_weapon",
      requestedBy: current.ownerId ?? decoded.uid,
      requestedByName: current.ownerName ?? "สมาชิกแก๊ง",
      requestedByAvatar: current.ownerAvatar ?? "",
      createdAt: Date.now(),
      reviewedBy: decoded.uid,
    });
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "ลบอาวุธไม่สำเร็จ" }, { status: 500 });
  }
}
