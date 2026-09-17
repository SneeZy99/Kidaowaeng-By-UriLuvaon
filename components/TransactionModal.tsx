"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/AuthProvider";
import { requestTransaction } from "@/lib/firestore-helpers";
import type { TransactionKind, TransactionTargetType } from "@/lib/types";

export function TransactionModal({
  targetType,
  targetKey,
  targetLabel,
  initialKind = "deposit",
  onClose,
}: {
  targetType: TransactionTargetType;
  targetKey: string;
  targetLabel: string;
  initialKind?: TransactionKind;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const [kind, setKind] = useState<TransactionKind>(initialKind);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unit = targetType === "money" ? "฿" : "ชิ้น";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      setError("กรุณาระบุจำนวนที่มากกว่า 0");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestTransaction({
        user: profile,
        kind,
        targetType,
        targetKey,
        targetLabel,
        amount: numeric,
        note: note.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("ส่งคำขอไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 sm:items-center">
      <div className="vault-reveal flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-lg border border-vault-border bg-vault-surface shadow-panel">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-vault-border bg-vault-surface px-5 py-4">
          <h3 className="font-display text-base font-semibold text-vault-text">
            {targetLabel}
          </h3>
          <button
            onClick={onClose}
            className="text-vault-muted transition hover:text-vault-text"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <p className="text-vault-green">ส่งคำขอเรียบร้อย</p>
            <p className="mt-1 text-sm text-vault-muted">
              รอหัวหน้าแก๊งอนุมัติ — ยอดคงคลังจะยังไม่เปลี่ยนจนกว่าจะอนุมัติ
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-md border border-vault-border px-4 py-2 text-sm text-vault-text hover:bg-vault-surface2"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind("deposit")}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  kind === "deposit"
                    ? "border-vault-green/50 bg-vault-green/15 text-vault-green"
                    : "border-vault-border text-vault-muted hover:text-vault-text"
                }`}
              >
                ฝาก
              </button>
              <button
                type="button"
                onClick={() => setKind("withdraw")}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  kind === "withdraw"
                    ? "border-vault-red/50 bg-vault-red/15 text-vault-red"
                    : "border-vault-border text-vault-muted hover:text-vault-text"
                }`}
              >
                เบิก
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs text-vault-muted">
                จำนวน ({unit})
              </label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 font-mono text-vault-text outline-none focus:border-vault-brass"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-vault-muted">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass"
                placeholder="เช่น เบิกไปใช้ในภารกิจ..."
              />
            </div>

            {error && <p className="text-sm text-vault-red">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-vault-border px-4 py-2.5 text-sm text-vault-muted transition hover:border-vault-brass/60 hover:text-vault-text"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-vault-brass px-4 py-2.5 text-sm font-medium text-vault-bg transition hover:bg-vault-amber disabled:opacity-50"
              >
                {submitting ? "กำลังส่ง..." : "ส่งคำขอ"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
