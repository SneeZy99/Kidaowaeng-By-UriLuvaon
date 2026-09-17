import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Query } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONEY_KEYS = new Set(["cash", "redMoney"]);
const KINDS = new Set(["deposit", "withdraw"]);
const TARGET_TYPES = new Set(["money", "item"]);

export async function GET(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "ไม่พบ token การยืนยันตัวตน" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const status = new URL(req.url).searchParams.get("status") ?? "all";
    if (!["all", "pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }
    if (status === "pending") {
      await verifyAdmin(req);
    }

    let query: Query = adminDb.collection("transactions");
    if (status !== "all") {
      query = query.where("status", "==", status);
    }
    if (status !== "pending" && status !== "all") {
      query = query.where("requestedBy", "==", decoded.uid);
    }
    const snapshot = await query.get();
    const rawTransactions: Transaction[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
          reviewedAt: data.reviewedAt?.toMillis?.() ?? undefined,
        } as Transaction;
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100);

    // Keep the approval list current when a member changes their IC name.
    // Older transaction documents only contain the Discord name, so resolve
    // the profile here and fall back gracefully for incomplete profiles.
    const requesterIds = [...new Set(rawTransactions.map((transaction) => transaction.requestedBy).filter(Boolean))];
    const requesterProfiles = await Promise.all(requesterIds.map(async (uid) => {
      const profile = await adminDb.collection("users").doc(uid).get();
      return [uid, profile.data()?.icName || profile.data()?.displayName || profile.data()?.username] as const;
    }));
    const namesByRequester = new Map(requesterProfiles);
    const transactions = rawTransactions.map((transaction) => ({
      ...transaction,
      requestedByName: namesByRequester.get(transaction.requestedBy) || transaction.requestedByName,
    }));

    return NextResponse.json({ transactions });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Transaction list failed", error);
    return NextResponse.json({ error: "โหลดรายการไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "ไม่พบ token การยืนยันตัวตน" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const { kind, targetType, targetKey, targetLabel, amount, note } = body;

    if (
      !KINDS.has(kind) ||
      !TARGET_TYPES.has(targetType) ||
      typeof targetKey !== "string" ||
      !targetKey ||
      typeof targetLabel !== "string" ||
      !targetLabel ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      (targetType === "money" && !MONEY_KEYS.has(targetKey))
    ) {
      return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
    }

    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const user = userSnap.data();
    if (!userSnap.exists || !user) {
      return NextResponse.json({ error: "ไม่พบโปรไฟล์สมาชิก" }, { status: 404 });
    }

    const transaction = await adminDb.collection("transactions").add({
      kind,
      targetType,
      targetKey,
      targetLabel: targetLabel.slice(0, 100),
      amount,
      note: typeof note === "string" ? note.slice(0, 500) : "",
      status: "pending",
      requestedBy: decoded.uid,
      requestedByName: user.icName ?? user.displayName ?? user.username ?? "สมาชิกแก๊ง",
      requestedByAvatar: user.avatarUrl ?? "",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: transaction.id });
  } catch (error) {
    console.error("Transaction request failed", error);
    return NextResponse.json({ error: "ส่งคำขอไม่สำเร็จ" }, { status: 500 });
  }
}
