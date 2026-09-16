"use client";

import { useState } from "react";
import { useInventory } from "@/lib/hooks";
import { CATEGORY_LABELS, ItemCategory, InventoryItem } from "@/lib/types";
import { TransactionModal } from "@/components/TransactionModal";
import { AddItemForm } from "@/components/AddItemForm";
import { useAuth } from "@/components/AuthProvider";

const CATEGORY_ORDER: ItemCategory[] = ["weapon", "drug", "equipment"];

interface ModalState {
  item: InventoryItem;
  kind: "deposit" | "withdraw";
}

export function InventoryPanel() {
  const { items, loading } = useInventory();
  const { profile } = useAuth();
  const [modal, setModal] = useState<ModalState | null>(null);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  }));

  return (
    <section className="vault-reveal rounded-lg border border-vault-border bg-vault-surface shadow-panel">
      <div className="border-b border-vault-border px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-vault-text">
          คลังไอเทม
        </h2>
        <p className="text-xs text-vault-muted">แยกตามหมวดหมู่ — จำนวนคงเหลือจริงในคลัง</p>
      </div>

      <div className="divide-y divide-vault-border">
        {grouped.map(({ category, items: catItems }) => (
          <div key={category} className="px-6 py-4">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-vault-brassDim">
              {CATEGORY_LABELS[category]}
            </h3>

            {loading && (
              <p className="text-sm text-vault-muted">กำลังโหลด...</p>
            )}

            {!loading && catItems.length === 0 && (
              <p className="text-sm text-vault-muted">ยังไม่มีไอเทมในหมวดนี้</p>
            )}

            <ul className="space-y-2">
              {catItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-vault-border bg-vault-bg/40 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm text-vault-text">{item.name}</p>
                    <p className="ledger-figure font-mono text-xs text-vault-muted">
                      คงเหลือ {item.quantity} ชิ้น
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModal({ item, kind: "deposit" })}
                      className="rounded-md border border-vault-green/40 bg-vault-green/10 px-3 py-1.5 text-xs font-medium text-vault-green transition hover:bg-vault-green/20"
                    >
                      ฝาก
                    </button>
                    <button
                      onClick={() => setModal({ item, kind: "withdraw" })}
                      className="rounded-md border border-vault-red/40 bg-vault-red/10 px-3 py-1.5 text-xs font-medium text-vault-red transition hover:bg-vault-red/20"
                    >
                      เบิก
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
