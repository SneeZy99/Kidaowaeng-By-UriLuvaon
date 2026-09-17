import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";
import type { MoneyKey } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(req);
    const txRef = adminDb.collection("transactions").doc(params.id);

    await adminDb.runTransaction(async (t) => {
      const txSnap = await t.get(txRef);
      if (!txSnap.exists) throw new Error("ไม่พบรายการนี้");
      const tx = txSnap.data()!;
      if (tx.status !== "pending") throw new Error("รายการนี้ถูกดำเนินการไปแล้ว");

      const delta = tx.kind === "deposit" ? tx.amount : -tx.amount;

      if (tx.targetType === "dues") {
        const period = typeof tx.duesPeriod === "string" ? tx.duesPeriod : "";
        if (!period || !/^period-\d+$/.test(period)) throw new Error("ข้อมูลรอบค่างวดไม่ถูกต้อง");
        const paymentRef = adminDb.collection("duesPayments").doc(`${tx.targetKey}_${period}`);
        const paymentSnap = await t.get(paymentRef);
        if (paymentSnap.exists) throw new Error("รอบค่างวดนี้ถูกชำระแล้ว");
        t.set(paymentRef, {
          memberId: tx.targetKey,
          memberName: tx.targetLabel,
          periodKey: period,
          paidAt: Date.now(),
          paidBy: tx.requestedBy,
          paidByName: tx.requestedByName,
          amount: tx.amount,
          frequency: tx.duesFrequency ?? "weekly",
          dueAt: tx.duesDueAt ?? 0,
          detail: tx.duesDetail ?? tx.note ?? "",
          approvedBy: admin.uid,
        });
      } else if (tx.targetType === "money") {
        const treasuryRef = adminDb.collection("treasury").doc("main");
        const treasurySnap = await t.get(treasuryRef);
        const current = treasurySnap.exists ? treasurySnap.data()! : {};
        const key = tx.targetKey as MoneyKey;
        const currentValue = Number(current[key] ?? 0);
        const nextValue = currentValue + delta;

        if (nextValue < 0) {
          throw new Error("ยอดเงินคงเหลือไม่พอสำหรับการเบิกนี้");
        }

        t.set(
          treasuryRef,
          { [key]: nextValue, updatedAt: Date.now() },
          { merge: true }
        );
      } else {
        const itemRef = adminDb.collection("inventory").doc(tx.targetKey);
        const itemSnap = await t.get(itemRef);
        if (!itemSnap.exists) throw new Error("ไม่พบไอเทมนี้ในคลัง");
        const currentQty = Number(itemSnap.data()!.quantity ?? 0);
        const nextQty = currentQty + delta;

        if (nextQty < 0) {
          throw new Error("จำนวนไอเทมคงเหลือไม่พอสำหรับการเบิกนี้");
        }

        t.update(itemRef, { quantity: nextQty, updatedAt: Date.now() });
      }

      t.update(txRef, {
        status: "approved",
        reviewedBy: admin.uid,
        reviewedByName: admin.username,
        reviewedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
