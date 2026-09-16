"use client";

import { useTransactions } from "@/lib/hooks";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const map = {
    approved: "border-vault-green/40 bg-vault-green/10 text-vault-green",
    rejected: "border-vault-red/40 bg-vault-red/10 text-vault-red",
    pending: "border-vault-amber/40 bg-vault-amber/10 text-vault-amber",
  } as const;
  const label = {
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธแล้ว",
    pending: "รออนุมัติ",
  } as const;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export function LogsTable() {
  const { transactions, loading } = useTransactions(undefined, 30);

  return (
    <section className="vault-reveal rounded-lg border border-vault-border bg-vault-surface shadow-panel">
      <div className="border-b border-vault-border px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-vault-text">
          ประวัติล่าสุด
        </h2>
        <p className="text-xs text-vault-muted">ใครทำรายการอะไร เมื่อไหร่</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-vault-border text-xs uppercase tracking-wide text-vault-muted">
              <th className="px-6 py-3 font-normal">สมาชิก</th>
              <th className="px-4 py-3 font-normal">รายการ</th>
              <th className="px-4 py-3 font-normal">จำนวน</th>
              <th className="px-4 py-3 font-normal">สถานะ</th>
              <th className="px-6 py-3 font-normal">เวลา</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vault-border">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-vault-muted">
                  กำลังโหลด...
                </td>
              </tr>
            )}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-vault-muted">
                  ยังไม่มีประวัติรายการ
                </td>
              </tr>
            )}
            {transactions.map((tx) => (
              <tr key={tx.id} className="text-vault-text">
                <td className="px-6 py-3">{tx.requestedByName}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      tx.kind === "deposit" ? "text-vault-green" : "text-vault-red"
                    }
                  >
                    {tx.kind === "deposit" ? "ฝาก" : "เบิก"}
                  </span>{" "}
                  {tx.targetLabel}
                </td>
                <td className="ledger-figure px-4 py-3 font-mono">
                  {tx.targetType === "money"
                    ? `${formatMoney(tx.amount)} ฿`
                    : `${tx.amount} ชิ้น`}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="px-6 py-3 text-vault-muted">
                  {formatDateTime(tx.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
