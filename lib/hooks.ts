"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { InventoryItem, Transaction, Treasury, TransactionStatus } from "@/lib/types";

export function useTreasury() {
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "treasury", "main");
    const unsub = onSnapshot(ref, (snap) => {
      setTreasury(
        snap.exists()
          ? (snap.data() as Treasury)
          : { cash: 0, redMoney: 0, bank: 0, updatedAt: 0 }
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { treasury, loading };
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { items, loading };
}

export function useTransactions(status?: TransactionStatus, take = 50) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = collection(db, "transactions");
    const q = status
      ? query(base, where("status", "==", status), orderBy("createdAt", "desc"))
      : query(base, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs
        .slice(0, take)
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
            reviewedAt: data.reviewedAt?.toMillis?.() ?? undefined,
          } as Transaction;
        });
      setTransactions(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [status, take]);

  return { transactions, loading };
}
