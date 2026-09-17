"use client";

import { useState } from "react";
import { useTreasury } from "@/lib/hooks";
import { formatMoney } from "@/lib/format";
import { MONEY_LABELS, MoneyKey } from "@/lib/types";
import { TransactionModal } from "@/components/TransactionModal";

const MONEY_ORDER: MoneyKey[] = ["cash", "redMoney"];

interface ModalState {
  key: MoneyKey;
  kind: "deposit" | "withdraw";
}

export function TreasuryPanel() {
  const { treasury, loading } = useTreasury();
  const [modal, setModal] = useState<ModalState | null>(null);

  return (
    <section className="vault-reveal rounded-lg border border-vault-border bg-vault-surface shadow-panel">
      <div className="border-b border-vault-border px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-vault-text">
          ยอดเงินคงคลัง
        </h2>
        <p className="text-xs text-vault-muted">
          อัปเดตเรียลไทม์ — ยอดจะเปลี่ยนก็ต่อเมื่อหัวหน้าแก๊งอนุมัติรายการแล้วเท่านั้น
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-vault-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {MONEY_ORDER.map((key) => (
          <div key={key} className="px-6 py-6">
            <p className="text-xs uppercase tracking-wide text-vault-muted">
              {MONEY_LABELS[key]}
            </p>
            <p className="ledger-figure mt-2 font-mono text-3xl font-semibold text-vault-brass">
              {loading ? "···" : formatMoney(treasury?.[key] ?? 0)}
              <span className="ml-1 text-sm text-vault-muted">฿</span>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setModal({ key, kind: "deposit" })}
                className="flex-1 rounded-md border border-vault-green/60 bg-vault-green/5 px-3 py-2 text-xs font-medium text-vault-green shadow-[0_0_14px_-10px_rgba(126,231,193,0.9)] transition hover:bg-vault-green/15 hover:shadow-[0_0_18px_-8px_rgba(126,231,193,0.9)]"
              >
                ฝากเงิน
              </button>
              <button
                onClick={() => setModal({ key, kind: "withdraw" })}
                className="flex-1 rounded-md border border-vault-red/60 bg-vault-red/5 px-3 py-2 text-xs font-medium text-vault-red shadow-[0_0_14px_-10px_rgba(255,114,159,0.9)] transition hover:bg-vault-red/15 hover:shadow-[0_0_18px_-8px_rgba(255,114,159,0.9)]"
              >
                เบิกเงิน
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <TransactionModal
          targetType="money"
          targetKey={modal.key}
          targetLabel={MONEY_LABELS[modal.key]}
          initialKind={modal.kind}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
