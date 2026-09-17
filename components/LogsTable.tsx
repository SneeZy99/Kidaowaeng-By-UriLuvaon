"use client";

import { useTransactions } from "@/lib/hooks";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

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

export function LogsTable({ limit = 5, showAllLink = true }: { limit?: number; showAllLink?: boolean }) {
  const { transactions, loading } = useTransactions(undefined, limit);
  const [search, setSearch] = useState("");
  const visibleTransactions = useMemo(() => transactions.filter((tx) =>
    `${tx.requestedByName} ${tx.targetLabel} ${tx.note ?? ""}`.toLowerCase().includes(search.toLowerCase().trim())
  ), [transactions, search]);

  return (
    <section className="vault-reveal rounded-lg border border-vault-border bg-vault-surface shadow-panel">
      <div className="border-b border-vault-border px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-vault-text">
          ประวัติล่าสุด
        </h2>
        <p className="text-xs text-vault-muted">ใครทำรายการอะไร เมื่อไหร่</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาประวัติ..." className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass" />
          {showAllLink && <Link href="/history" className="rounded-md border border-vault-border px-3 py-2 text-center text-xs text-vault-brass hover:bg-vault-surface2">ดูทั้งหมด</Link>}
        </div>
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
            {!loading && visibleTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-vault-muted">
                  ยังไม่มีประวัติรายการ
                </td>
              </tr>
            )}
            {visibleTransactions.map((tx) => (
              <tr key={tx.id} className="text-vault-text">
                <td className="px-6 py-3">{tx.requestedByName}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      tx.targetType === "weapon"
                        ? tx.action === "remove_weapon" ? "text-vault-red" : "text-vault-brass"
                        : tx.kind === "deposit" ? "text-vault-green" : "text-vault-red"
                    }
                  >
                    {tx.targetType === "weapon"
                      ? tx.action === "remove_weapon" ? "ลบอาวุธ" : "เพิ่มอาวุธ"
                      : tx.kind === "deposit" ? "ฝาก" : "เบิก"}
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
