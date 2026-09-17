"use client";

import { useMemo, useState } from "react";
import { useInventory } from "@/lib/hooks";
import { CATEGORY_LABELS, ItemCategory, InventoryItem } from "@/lib/types";
import { TransactionModal } from "@/components/TransactionModal";
import { AddItemForm } from "@/components/AddItemForm";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";

interface ModalState {
  item: InventoryItem;
  kind: "deposit" | "withdraw";
}

export function InventoryPanel() {
  const { items, loading } = useInventory();
  const { profile } = useAuth();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ItemCategory>("all");
  const [sort, setSort] = useState<"name" | "quantity">("name");

  const manageItem = async (item: InventoryItem, action: "edit" | "delete") => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    if (action === "delete" && !window.confirm(`ลบ ${item.name} ใช่หรือไม่?`)) return;
    let body: { name?: string; category?: ItemCategory; quantity?: number; imageUrl?: string } | undefined;
    if (action === "edit") {
      const name = window.prompt("ชื่อไอเทม", item.name)?.trim();
      if (!name) return;
      const quantity = Number(window.prompt("จำนวน", String(item.quantity)));
      if (!Number.isInteger(quantity) || quantity < 0) return;
      const imageUrl = window.prompt("ลิงก์รูป Discord", item.imageUrl ?? "") ?? item.imageUrl ?? "";
      body = { name, category: item.category, quantity, imageUrl };
    }
    await fetch(`/api/inventory/${item.id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    window.location.reload();
  };

  const filteredItems = useMemo(() => items
    .filter((item) =>
      (categoryFilter === "all" || item.category === categoryFilter) &&
      `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase().trim())
    )
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b.quantity - a.quantity),
  [items, search, categoryFilter, sort]);
  return (
    <section className="vault-reveal overflow-hidden rounded-lg border border-vault-border bg-vault-surface shadow-panel">
      <div className="border-b border-vault-border px-6 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-vault-brass">Vault Market</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-vault-text">คลังไอเทม</h2>
            <p className="mt-1 text-xs text-vault-muted">รายการไอเทมทั้งหมดในคลังแก๊ง</p>
          </div>
          <span className="hidden rounded-full border border-vault-green/30 bg-vault-green/10 px-3 py-1 text-[11px] text-vault-green sm:block">{filteredItems.length} รายการ</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-vault-border bg-vault-bg/60 px-3 py-3">
          {[["all", "ทั้งหมด"], ["drug", "ยา"], ["equipment", "อุปกรณ์"]].map(([value, label]) => (
            <button key={value} onClick={() => setCategoryFilter(value as "all" | ItemCategory)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${categoryFilter === value ? "bg-vault-brass text-vault-bg" : "border border-vault-border text-vault-muted hover:text-vault-text"}`}>
              {label}
            </button>
          ))}
          <select value={sort} onChange={(e) => setSort(e.target.value as "name" | "quantity")} className="rounded-md border border-vault-border bg-vault-surface px-3 py-1.5 text-xs text-vault-muted outline-none focus:border-vault-brass">
            <option value="name">เรียงตามชื่อ</option>
            <option value="quantity">เรียงตามจำนวน</option>
          </select>
          <div className="ml-auto flex min-w-[220px] flex-1 gap-2 sm:max-w-sm">
            <input value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSearch(draftSearch)} placeholder="ค้นหาเพิ่มเติม" className="min-w-0 flex-1 rounded-md border border-vault-border bg-vault-surface px-3 py-1.5 text-xs text-vault-text outline-none focus:border-vault-brass" />
            <button onClick={() => setSearch(draftSearch)} className="rounded-md bg-vault-brass px-3 py-1.5 text-xs font-semibold text-vault-bg hover:bg-vault-amber">ค้นหา</button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading && <p className="py-10 text-center text-sm text-vault-muted">กำลังโหลด...</p>}
        {!loading && filteredItems.length === 0 && <p className="py-10 text-center text-sm text-vault-muted">ยังไม่มีไอเทมที่ตรงกับการค้นหา</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-vault-border bg-vault-bg/70 transition hover:-translate-y-0.5 hover:border-vault-brass/70"
                >
                  <div className="relative flex h-36 items-center justify-center border-b border-vault-border bg-[radial-gradient(circle_at_50%_35%,rgba(242,155,255,0.22),transparent_45%),linear-gradient(135deg,#211633,#0d0916)]">
                    <span className="absolute left-2 top-2 z-10 rounded bg-vault-green px-2 py-1 text-[10px] font-bold text-vault-bg">{CATEGORY_LABELS[item.category]}</span>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <span className="text-5xl text-vault-brass/80">{item.category === "drug" ? "✦" : "◇"}</span>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-h-10 font-display text-base font-semibold text-vault-text">{item.name}</p>
                    </div>
                    <p className="mt-2 font-mono text-2xl font-semibold text-vault-brass">{item.quantity}<span className="ml-1 text-xs text-vault-muted">ชิ้น</span></p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => setModal({ item, kind: "deposit" })} className="rounded-md border border-vault-green/60 bg-vault-green/5 px-2 py-2 text-xs font-medium text-vault-green shadow-[0_0_14px_-10px_rgba(126,231,193,0.9)] hover:bg-vault-green/15">ฝาก</button>
                      <button onClick={() => setModal({ item, kind: "withdraw" })} className="rounded-md border border-vault-red/60 bg-vault-red/5 px-2 py-2 text-xs font-medium text-vault-red shadow-[0_0_14px_-10px_rgba(255,114,159,0.9)] hover:bg-vault-red/15">เบิก</button>
                    </div>
                    {profile?.role === "admin" && <div className="mt-2 flex gap-2 border-t border-vault-border pt-2"><button onClick={() => manageItem(item, "edit")} className="text-xs text-vault-muted hover:text-vault-brass">แก้ไข</button><button onClick={() => manageItem(item, "delete")} className="text-xs text-vault-red hover:underline">ลบ</button></div>}
                  </div>
                </article>
              ))}
        </div>
      </div>

      {profile?.role === "admin" && <AddItemForm />}

      {modal && (
        <TransactionModal
          targetType="item"
          targetKey={modal.item.id}
          targetLabel={modal.item.name}
          initialKind={modal.kind}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
