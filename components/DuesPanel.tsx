"use client";

import { FormEvent, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { GangDuesConfig, MemberDuesStatus } from "@/lib/types";

const defaultConfig: GangDuesConfig = { amount: 0, frequency: "weekly", startAt: Date.now(), enabled: false };
const dateInput = (value: number) => new Date(value).toISOString().slice(0, 10);
const thaiDate = (value?: number) => value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(value) : "-";

export function DuesPanel() {
  const [config, setConfig] = useState<GangDuesConfig>(defaultConfig);
  const [statuses, setStatuses] = useState<MemberDuesStatus[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const response = await fetch("/api/dues", { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setConfig(result.config); setStatuses(result.statuses); setIsAdmin(result.isAdmin); setLoading(false);
  };
  useEffect(() => { void load().catch((err) => { setError(err.message); setLoading(false); }); }, []);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try { const token = await auth.currentUser?.getIdToken(); const response = await fetch("/api/dues", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...config, startAt: new Date(dateInput(config.startAt)).getTime() }) }); if (!response.ok) throw new Error((await response.json()).error); await load(); } catch (err) { setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ"); } finally { setSaving(false); }
  };
  const markPaid = async (member: MemberDuesStatus) => {
    if (!member.currentPeriodKey) return; setError("");
    try { const token = await auth.currentUser?.getIdToken(); const response = await fetch("/api/dues", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ memberId: member.uid, periodKey: member.currentPeriodKey }) }); if (!response.ok) throw new Error((await response.json()).error); await load(); } catch (err) { setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ"); }
  };
  const arrears = statuses.filter((status) => status.outstandingAmount > 0);
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
    <section className="vault-reveal rounded-xl border border-vault-border bg-vault-surface p-6 shadow-panel"><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-vault-brass">Gang Dues // Ledger</p><h1 className="mt-1 font-display text-2xl font-semibold text-vault-text">ค่างวดแก๊ง</h1><p className="mt-1 text-sm text-vault-muted">ติดตามยอดชำระรายวันหรือรายสัปดาห์ และตรวจสอบสมาชิกที่ค้างชำระ</p>{isAdmin && <form onSubmit={save} className="mt-5 grid gap-3 rounded-lg border border-vault-border bg-vault-bg/60 p-4 sm:grid-cols-4"><label className="text-xs text-vault-muted">ยอดต่อรอบ<input type="number" min="0" value={config.amount} onChange={(e) => setConfig({ ...config, amount: Number(e.target.value) })} className="mt-1 w-full rounded border border-vault-border bg-vault-surface px-3 py-2 text-vault-text" /></label><label className="text-xs text-vault-muted">รอบ<select value={config.frequency} onChange={(e) => setConfig({ ...config, frequency: e.target.value as GangDuesConfig["frequency"] })} className="mt-1 w-full rounded border border-vault-border bg-vault-surface px-3 py-2 text-vault-text"><option value="daily">รายวัน</option><option value="weekly">รายสัปดาห์</option></select></label><label className="text-xs text-vault-muted">เริ่มนับรอบ<input type="date" value={dateInput(config.startAt)} onChange={(e) => setConfig({ ...config, startAt: new Date(e.target.value).getTime() })} className="mt-1 w-full rounded border border-vault-border bg-vault-surface px-3 py-2 text-vault-text" /></label><div className="flex items-end gap-3"><label className="flex items-center gap-2 pb-2 text-xs text-vault-muted"><input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} /> เปิดใช้</label><button disabled={saving} className="rounded bg-vault-brass px-4 py-2 text-sm font-semibold text-vault-bg">{saving ? "กำลังบันทึก" : "บันทึก"}</button></div></form>}{error && <p className="mt-3 text-sm text-vault-red">{error}</p>}</section>
    <section className="overflow-hidden rounded-xl border border-vault-border bg-vault-surface shadow-panel"><div className="flex items-center justify-between border-b border-vault-border px-6 py-4"><h2 className="font-display text-lg text-vault-text">รายการค้างชำระ</h2><span className="font-mono text-xs text-vault-red">{arrears.length} OVERDUE</span></div>{loading ? <p className="p-8 text-center text-vault-muted">กำลังโหลด...</p> : !config.enabled ? <p className="p-8 text-center text-vault-muted">ยังไม่ได้เปิดใช้ค่างวดแก๊ง</p> : <div className="divide-y divide-vault-border">{statuses.map((member) => <div key={member.uid} className="flex flex-wrap items-center gap-3 px-6 py-4"><div className="min-w-0 flex-1"><p className="font-medium text-vault-text">{member.name}</p><p className="text-xs text-vault-muted">{member.outstandingPeriods ? `ค้าง ${member.outstandingPeriods} รอบ · รอบแรก ${thaiDate(member.oldestDueAt)}` : `ชำระครบ · รอบปัจจุบัน ${thaiDate(member.currentDueAt)}`}</p></div><p className={member.outstandingAmount ? "font-mono text-lg text-vault-red" : "font-mono text-lg text-vault-green"}>{member.outstandingAmount.toLocaleString()} ฿</p>{isAdmin && !member.paidCurrentPeriod && <button onClick={() => void markPaid(member)} className="rounded border border-vault-green/50 px-3 py-2 text-xs text-vault-green hover:bg-vault-green/10">รับชำระรอบนี้</button>}</div>)}</div>}</section>
  </main>;
}
