"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { GangDuesConfig, MemberDuesStatus } from "@/lib/types";
import { SpotlightCard } from "@/components/ReactBitsEffects";

export function MyDuesCard() {
  const [config, setConfig] = useState<GangDuesConfig | null>(null);
  const [status, setStatus] = useState<MemberDuesStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const response = await fetch("/api/dues", { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok || cancelled) return;
        setConfig(result.config as GangDuesConfig);
        setStatus((result.statuses as MemberDuesStatus[]).find((member) => member.uid === auth.currentUser?.uid) ?? null);
      } catch (error) {
        console.error("Failed to load personal dues", error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!config?.enabled || !status) return null;
  const overdue = status.outstandingAmount > 0;
  const dueDate = status.oldestDueAt ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(status.oldestDueAt) : "-";
  return <SpotlightCard className={`vault-reveal overflow-hidden rounded-lg border bg-vault-surface shadow-panel ${overdue ? "border-vault-red/60" : "border-vault-green/45"}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-vault-muted">My Gang Dues</p><h2 className="mt-1 font-display text-lg font-semibold text-vault-text">สถานะค่างวดของฉัน</h2></div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${overdue ? "bg-vault-red/15 text-vault-red" : "bg-vault-green/15 text-vault-green"}`}>{overdue ? "ค้างชำระ" : "ชำระครบ"}</span>
    </div>
    <div className="grid border-t border-vault-border sm:grid-cols-3"><div className="px-6 py-4"><p className="text-xs text-vault-muted">ยอดค้างชำระ</p><p className={`mt-1 font-mono text-2xl font-semibold ${overdue ? "text-vault-red" : "text-vault-green"}`}>{status.outstandingAmount.toLocaleString()} <span className="text-sm">฿</span></p></div><div className="border-t border-vault-border px-6 py-4 sm:border-l sm:border-t-0"><p className="text-xs text-vault-muted">จำนวนรอบที่ค้าง</p><p className="mt-1 font-mono text-2xl font-semibold text-vault-text">{status.outstandingPeriods} <span className="text-sm text-vault-muted">รอบ</span></p></div><div className="border-t border-vault-border px-6 py-4 sm:border-l sm:border-t-0"><p className="text-xs text-vault-muted">รอบแรกที่ค้าง</p><p className="mt-2 text-sm font-medium text-vault-text">{overdue ? dueDate : "ไม่มีรายการค้าง"}</p></div></div>
  </SpotlightCard>;
}
