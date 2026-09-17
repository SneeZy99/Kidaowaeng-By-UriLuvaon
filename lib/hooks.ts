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
import { auth } from "@/lib/firebase";
import type { AppUser, InventoryItem, Transaction, Treasury, TransactionStatus, WeaponRecord } from "@/lib/types";

export function useMembers(authUid?: string) {
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch("/api/members", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!cancelled) setMembers(result.members as AppUser[]);
      } catch (error) {
        console.error("Failed to load members", error);
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authUid]);

  return { members, loading };
}

export function useTreasury() {
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("missing auth token");
        const response = await fetch("/api/treasury", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!cancelled) setTreasury(result.treasury as Treasury);
      } catch (error) {
        console.error("Failed to load treasury", error);
        if (!cancelled) setTreasury({ cash: 0, redMoney: 0, updatedAt: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { treasury, loading };
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("missing auth token");
        const response = await fetch("/api/inventory", { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!cancelled) setItems(result.items as InventoryItem[]);
      } catch (error) {
        console.error("Failed to load inventory", error);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}

export function useWeapons() {
  const [weapons, setWeapons] = useState<WeaponRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("missing auth token");
        const response = await fetch("/api/weapons", { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!cancelled) setWeapons(result.weapons as WeaponRecord[]);
      } catch (error) {
        console.error("Failed to load weapons", error);
        if (!cancelled) setWeapons([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { weapons, loading };
}

export function useTransactions(status?: TransactionStatus, take = 50) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("missing auth token");
        const url = status ? `/api/transactions?status=${status}` : "/api/transactions?status=all";
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!cancelled) setTransactions((result.transactions as Transaction[]).slice(0, take));
      } catch (error) {
        console.error("Failed to load transactions", error);
        if (!cancelled) setTransactions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, take]);

  return { transactions, loading };
}
