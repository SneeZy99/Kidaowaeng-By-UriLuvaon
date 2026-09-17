import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { AuthError, verifyAdmin } from "@/lib/verifyAdmin";

function facebookUrl(value: unknown) {
  if (value === "") return "";
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" && ["facebook.com", "m.facebook.com", "fb.com"].includes(host) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const icName = typeof body.icName === "string" ? body.icName.trim().replace(/\s+/g, " ") : "";
    const facebook = facebookUrl(body.facebookUrl ?? "");
    const role = body.role === undefined ? undefined : body.role === "admin" || body.role === "member" ? body.role : null;
    if (icName.length < 2 || icName.length > 60 || facebook === null || role === null) {
      return NextResponse.json({ error: "Invalid member details" }, { status: 400 });
    }
    const ref = adminDb.collection("users").doc(params.id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    await ref.update({ icName, displayName: icName, facebookUrl: facebook, ...(role ? { role } : {}) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Member update failed", error);
    return NextResponse.json({ error: "Unable to update member" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdmin(req);
    if (params.id === admin.uid) return NextResponse.json({ error: "You cannot remove your own admin account" }, { status: 400 });
    const ref = adminDb.collection("users").doc(params.id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Member delete failed", error);
    return NextResponse.json({ error: "Unable to remove member" }, { status: 500 });
  }
}
