import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = body.category;
    const quantity = body.quantity;
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!name || name.length > 80 || !CATEGORIES.has(category) || !Number.isInteger(quantity) || quantity < 0 || !validImageUrl(imageUrl)) {
      return NextResponse.json({ error: "ข้อมูลไอเทมไม่ถูกต้อง" }, { status: 400 });
    }
    await adminDb.collection("inventory").doc(params.id).update({ name, category, quantity, imageUrl, updatedAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "แก้ไขไอเทมไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(req);
    await adminDb.collection("inventory").doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "ลบไอเทมไม่สำเร็จ" }, { status: 500 });
  }
}
