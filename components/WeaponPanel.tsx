"use client";

import { FormEvent, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { useWeapons } from "@/lib/hooks";
import { useAuth } from "@/components/AuthProvider";
import { isStaffRole } from "@/lib/roles";
import { formatDateTime } from "@/lib/format";
import type { WeaponRecord } from "@/lib/types";

export function WeaponPanel() {
  const { weapons, loading } = useWeapons();
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine">("all");
  const [sort, setSort] = useState<"newest" | "name" | "quantity">("newest");

  const manageWeapon = async (weapon: WeaponRecord, action: "edit" | "delete") => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    if (action === "delete" && !window.confirm(`ลบ ${weapon.name} ใช่หรือไม่?`)) return;
    let body: { name?: string; quantity?: number; note?: string; imageUrl?: string } | undefined;
    if (action === "edit") {
      const name = window.prompt("ชื่ออาวุธ", weapon.name)?.trim();
      if (!name) return;
      const quantity = Number(window.prompt("จำนวน", String(weapon.quantity)));
      if (!Number.isInteger(quantity) || quantity <= 0) return;
      const note = window.prompt("หมายเหตุ", weapon.note ?? "") ?? weapon.note ?? "";
      const imageUrl = window.prompt("ลิงก์รูป Discord", weapon.imageUrl ?? "") ?? weapon.imageUrl ?? "";
      body = { name, quantity, note, imageUrl };
    }
    await fetch(`/api/weapons/${weapon.id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    window.location.reload();
  };

  const addWeapon = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("ไม่พบ session");
      const response = await fetch("/api/weapons", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity: Number(quantity), note, imageUrl: imageUrl.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เพิ่มอาวุธไม่สำเร็จ");
      setName("");
      setQuantity("1");
      setNote("");
      setImageUrl("");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มอาวุธไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const visibleWeapons = useMemo(() => weapons
    .filter((weapon) =>
      (ownerFilter === "all" || weapon.ownerId === profile?.uid) &&
      `${weapon.name} ${weapon.ownerName} ${weapon.note ?? ""}`.toLowerCase().includes(search.toLowerCase().trim())
    )
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "quantity" ? b.quantity - a.quantity : b.createdAt - a.createdAt),
  [weapons, search, ownerFilter, sort, profile?.uid]);
  const visibleGrouped = visibleWeapons.reduce<Record<string, WeaponRecord[]>>((groups, weapon) => {
    (groups[weapon.ownerId] ??= []).push(weapon);
    return groups;
  }, {});

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <section className="vault-reveal overflow-hidden rounded-xl border border-vault-border bg-vault-surface shadow-panel">
        <div className="border-b border-vault-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-vault-red">Vault Armory // Live</p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-vault-text">คลังอาวุธสมาชิก</h1>
              <p className="mt-1 text-sm text-vault-muted">สมาชิกทุกคนเพิ่มอาวุธของตัวเองได้ และทุกคนจะเห็นว่าใครมีอาวุธอะไร</p>
            </div>
            <span className="hidden rounded-full border border-vault-red/35 bg-vault-red/10 px-3 py-1 font-mono text-[10px] tracking-wider text-vault-red sm:block">{weapons.length.toString().padStart(2, "0")} UNITS</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-vault-border bg-vault-bg/60 px-3 py-3">
            <button onClick={() => setOwnerFilter("all")} className={`rounded-full px-3 py-1.5 text-xs font-medium ${ownerFilter === "all" ? "bg-vault-brass text-vault-bg" : "border border-vault-border text-vault-muted"}`}>ทั้งหมด</button>
            <button onClick={() => setOwnerFilter("mine")} className={`rounded-full px-3 py-1.5 text-xs font-medium ${ownerFilter === "mine" ? "bg-vault-brass text-vault-bg" : "border border-vault-border text-vault-muted"}`}>ของฉัน</button>
            <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "name" | "quantity")} className="rounded-md border border-vault-border bg-vault-surface px-3 py-1.5 text-xs text-vault-muted outline-none focus:border-vault-brass">
              <option value="newest">เพิ่มล่าสุด</option>
              <option value="name">เรียงตามชื่อ</option>
              <option value="quantity">เรียงตามจำนวน</option>
            </select>
            <div className="ml-auto flex min-w-[220px] flex-1 gap-2 sm:max-w-sm">
              <input value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSearch(draftSearch)} placeholder="ค้นหาอาวุธหรือสมาชิก" className="min-w-0 flex-1 rounded-md border border-vault-border bg-vault-surface px-3 py-1.5 text-xs text-vault-text outline-none focus:border-vault-brass" />
              <button onClick={() => setSearch(draftSearch)} className="rounded-md bg-vault-brass px-3 py-1.5 text-xs font-semibold text-vault-bg">ค้นหา</button>
            </div>
          </div>
        </div>
        <form onSubmit={addWeapon} className="grid gap-3 border-b border-vault-border px-6 py-5 md:grid-cols-[1fr_140px_1fr_auto] md:items-end">
          <label className="text-xs text-vault-muted">ชื่ออาวุธ<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น Glock 17" className="mt-1 w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass" /></label>
          <label className="text-xs text-vault-muted">จำนวน<input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="mt-1 w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass" /></label>
          <label className="text-xs text-vault-muted">หมายเหตุ<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ประจำตัว" className="mt-1 w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass" /></label>
          <label className="text-xs text-vault-muted">ลิงก์รูป Discord<input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://cdn.discordapp.com/..." className="mt-1 w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass" /></label>
          <button disabled={saving} className="rounded-md bg-vault-brass px-4 py-2 text-sm font-medium text-vault-bg hover:bg-vault-amber disabled:opacity-50">{saving ? "กำลังเพิ่ม..." : "เพิ่มอาวุธ"}</button>
        </form>
        {error && <p className="px-6 pt-4 text-sm text-vault-red">{error}</p>}
      </section>

      <section className="vault-reveal overflow-hidden rounded-xl border border-vault-border bg-vault-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-vault-border px-6 py-4"><h2 className="font-display text-lg font-semibold text-vault-text">อาวุธของสมาชิก</h2><span className="font-mono text-[10px] tracking-widest text-vault-muted">REGISTRY</span></div>
        {loading && <p className="px-6 py-8 text-sm text-vault-muted">กำลังโหลด...</p>}
        {!loading && weapons.length === 0 && <p className="px-6 py-8 text-center text-sm text-vault-muted">ยังไม่มีรายการอาวุธ</p>}
        <div className="divide-y divide-vault-border">
          {Object.entries(visibleGrouped).map(([ownerId, ownerWeapons]) => (
            <div key={ownerId} className="px-6 py-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-vault-brass"><span className="h-1.5 w-1.5 rounded-full bg-vault-red shadow-[0_0_8px_rgba(181,101,75,0.95)]" />{ownerWeapons[0].ownerName}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ownerWeapons.map((weapon) => <article key={weapon.id} className="group overflow-hidden rounded-lg border border-vault-border bg-vault-bg/70 transition duration-200 hover:-translate-y-0.5 hover:border-vault-red/60 hover:shadow-[0_12px_30px_-18px_rgba(181,101,75,0.75)]"><div className="relative flex h-36 items-center justify-center border-b border-vault-border bg-[radial-gradient(circle_at_50%_35%,rgba(255,114,159,0.2),transparent_45%),linear-gradient(135deg,#2b1638,#0d0916)]"><span className="absolute left-2 top-2 z-10 rounded border border-vault-red/40 bg-vault-red/90 px-2 py-1 text-[10px] font-bold text-vault-bg">อาวุธ</span>{weapon.imageUrl ? <img src={weapon.imageUrl} alt={weapon.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span className="text-5xl text-vault-red/80">◈</span>}</div><div className="p-4"><div className="flex items-start justify-between gap-2"><p className="min-h-10 font-display text-base font-semibold text-vault-text">{weapon.name}</p><span className="rounded bg-vault-red/15 px-2 py-1 text-[10px] font-semibold text-vault-red">อาวุธ</span></div><p className="mt-2 font-mono text-2xl font-semibold text-vault-brass">{weapon.quantity}<span className="ml-1 text-xs text-vault-muted">ชิ้น</span></p><p className="mt-1 text-xs text-vault-muted">เจ้าของ: {weapon.ownerName}</p><p className="mt-1 text-xs text-vault-muted">{weapon.note || "ไม่มีหมายเหตุ"}</p><p className="mt-2 text-[11px] text-vault-muted">เพิ่มเมื่อ {formatDateTime(weapon.createdAt)}</p>{(isStaffRole(profile?.role) || profile?.uid === weapon.ownerId) && <div className="mt-3 flex gap-3 border-t border-vault-border pt-2"><button onClick={() => manageWeapon(weapon, "edit")} className="text-xs text-vault-muted hover:text-vault-brass">แก้ไข</button><button onClick={() => manageWeapon(weapon, "delete")} className="text-xs text-vault-red hover:underline">ลบ</button></div>}</div></article>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
