"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { AppUser } from "@/lib/types";
import { isStaffRole } from "@/lib/roles";

async function request(path: string, method: "POST" | "PATCH" | "DELETE", token: Promise<string>, body?: unknown) {
  const response = await fetch(path, { method, headers: { Authorization: `Bearer ${await token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "บันทึกไม่สำเร็จ");
}

export function MemberAdminControls({ member, onChanged }: { member?: AppUser; onChanged: () => void }) {
  const { firebaseUser, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!isStaffRole(profile?.role) || !firebaseUser) return null;
  const run = async (action: () => Promise<void>) => { setBusy(true); try { await action(); onChanged(); } catch (error) { window.alert(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"); } finally { setBusy(false); } };
  const add = () => { const icName = window.prompt("ชื่อสมาชิก")?.trim(); if (!icName) return; const facebookUrl = window.prompt("ลิงก์ Facebook (เว้นว่างได้)", "")?.trim(); if (facebookUrl === undefined) return; void run(() => request("/api/members", "POST", firebaseUser.getIdToken(), { icName, facebookUrl })); };
  const edit = () => { if (!member) return; const icName = window.prompt("ชื่อสมาชิก", member.icName || member.displayName || member.username)?.trim(); if (!icName) return; const facebookUrl = window.prompt("ลิงก์ Facebook (เว้นว่างได้)", member.facebookUrl || "")?.trim(); if (facebookUrl === undefined) return; void run(() => request(`/api/members/${encodeURIComponent(member.uid)}`, "PATCH", firebaseUser.getIdToken(), { icName, facebookUrl })); };
  const changeRole = () => { if (!member) return; const selected = window.prompt("กำหนดโรล: admin, vp หรือ member", member.role); if (selected === null) return; const role = selected.trim().toLowerCase(); if (role !== "admin" && role !== "vp" && role !== "member") { window.alert("กรุณาระบุ admin, vp หรือ member"); return; } void run(() => request(`/api/members/${encodeURIComponent(member.uid)}`, "PATCH", firebaseUser.getIdToken(), { icName: member.icName || member.displayName || member.username, facebookUrl: member.facebookUrl || "", role })); };
  const remove = () => { if (!member || !window.confirm(`ลบ ${member.icName || member.username} ออกจากรายชื่อ?`)) return; void run(() => request(`/api/members/${encodeURIComponent(member.uid)}`, "DELETE", firebaseUser.getIdToken())); };
  if (!member) return <button onClick={add} disabled={busy} className="rounded-md bg-vault-brass px-3 py-2 text-xs font-semibold text-vault-bg disabled:opacity-50">+ เพิ่มสมาชิก</button>;
  return <div className="mt-3 flex gap-2"><button onClick={edit} disabled={busy} className="rounded border border-vault-brass/50 px-2 py-1 text-[10px] text-vault-brass disabled:opacity-50">แก้ไข</button><button onClick={changeRole} disabled={busy} className="rounded border border-vault-green/50 px-2 py-1 text-[10px] text-vault-green disabled:opacity-50">ปรับโรล</button><button onClick={remove} disabled={busy} className="rounded border border-vault-red/50 px-2 py-1 text-[10px] text-vault-red disabled:opacity-50">ลบ</button></div>;
}
