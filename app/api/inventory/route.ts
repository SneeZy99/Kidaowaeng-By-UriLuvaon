import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";
import { verifyGuildMember } from "@/lib/verifyMember";
import type { InventoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["drug", "equipment"]);

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

async function getToken(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AuthError("ไม่พบ token การยืนยันตัวตน");
  return verifyGuildMember(req);
}

export async function GET(req: NextRequest) {
  try {
    await getToken(req);
    const snapshot = await adminDb.collection("inventory").get();
    const items = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as InventoryItem))
      .filter((item) => item.category === "drug" || item.category === "equipment")
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "โหลดคลังไอเทมไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = body.category;
    const quantity = body.quantity;
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!name || name.length > 80 || !CATEGORIES.has(category) || !Number.isInteger(quantity) || quantity < 0 || !validImageUrl(imageUrl)) {
      return NextResponse.json({ error: "ข้อมูลไอเทมไม่ถูกต้อง" }, { status: 400 });
    }
    const item = await adminDb.collection("inventory").add({
      name,
      category,
      quantity,
      imageUrl,
      updatedAt: Date.now(),
    });
    if (quantity > 0) {
      await adminDb.collection("transactions").add({
        kind: "deposit",
        targetType: "item",
        targetKey: item.id,
        targetLabel: name,
        amount: quantity,
        note: "เพิ่มไอเทมเข้าคลังโดยแอดมิน",
        status: "approved",
        requestedBy: admin.uid,
        requestedByName: admin.username,
        createdAt: Date.now(),
      });
    }
    return NextResponse.json({ ok: true, id: item.id });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "เพิ่มไอเทมไม่สำเร็จ" }, { status: 500 });
  }
}
