"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function AdminApprovalList() {
  const { firebaseUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const visibleTransactions = useMemo(() => transactions.filter((tx) =>
    `${tx.requestedByName} ${tx.targetLabel} ${tx.note ?? ""}`.toLowerCase().includes(search.toLowerCase().trim())
  ), [transactions, search]);

  const loadTransactions = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/transactions?status=pending", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดรายการไม่สำเร็จ");
      setTransactions((data.transactions as Transaction[]).slice(0, 10));
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, [firebaseUser]);

  async function callApi(tx: Transaction, action: "approve" | "reject") {
    if (!firebaseUser) return;
    setBusyId(tx.id);
    setErrorId(null);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch(`/api/transactions/${tx.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ดำเนินการไม่สำเร็จ");
      }
      setTransactions((current) => current.filter((item) => item.id !== tx.id));
    } catch (err) {
      console.error(err);
      setErrorId(tx.id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="vault-reveal rounded-lg border border-vault-border bg-vault-surface shadow-panel">
      <div className="border-b border-vault-border px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-vault-text">
          รายการรออนุมัติ
        </h2>
        <p className="text-xs text-vault-muted">
          ยอดคงคลังจะเปลี่ยนก็ต่อเมื่อกดอนุมัติเท่านั้น
        </p>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาสมาชิกหรือรายการ..." className="mt-3 w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass" />
      </div>

      <div className="divide-y divide-vault-border">
        {loading && (
          <p className="px-6 py-6 text-sm text-vault-muted">กำลังโหลด...</p>
        )}
        {!loading && visibleTransactions.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-vault-muted">
            ไม่มีรายการรออนุมัติในขณะนี้
          </p>
        )}

        {visibleTransactions.map((tx) => (
          <div
            key={tx.id}
            className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              {tx.requestedByAvatar && (
                <Image
                  src={tx.requestedByAvatar}
                  alt={tx.requestedByName}
                  width={36}
                  height={36}
                  className="rounded-full border border-vault-border"
                />
              )}
              <div>
                <p className="text-sm text-vault-text">
                  <span className="font-medium">{tx.requestedByName}</span>{" "}
                  ขอ
                  <span
                    className={
                      tx.kind === "deposit"
                        ? "text-vault-green"
                        : "text-vault-red"
                    }
                  >
                    {" "}
                    {tx.kind === "deposit" ? "ฝาก" : "เบิก"}{" "}
                  </span>
                  {tx.targetLabel}
                </p>
                <p className="ledger-figure font-mono text-xs text-vault-muted">
                  {tx.targetType === "money"
                    ? `${formatMoney(tx.amount)} ฿`
                    : `${tx.amount} ชิ้น`}{" "}
                  · {formatDateTime(tx.createdAt)}
                  {tx.note ? ` · "${tx.note}"` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {errorId === tx.id && (
                <span className="text-xs text-vault-red">ทำรายการไม่สำเร็จ</span>
              )}
              <button
                onClick={() => callApi(tx, "reject")}
                disabled={busyId === tx.id}
                className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-muted transition hover:border-vault-red/50 hover:text-vault-red disabled:opacity-50"
              >
                ปฏิเสธ
              </button>
              <button
                onClick={() => callApi(tx, "approve")}
                disabled={busyId === tx.id}
                className="rounded-md bg-vault-brass px-3 py-2 text-xs font-medium text-vault-bg transition hover:bg-vault-amber disabled:opacity-50"
              >
                {busyId === tx.id ? "กำลังทำรายการ..." : "อนุมัติ"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
