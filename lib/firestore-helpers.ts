import { auth } from "@/lib/firebase";
import type {
  AppUser,
  TransactionKind,
  TransactionTargetType,
} from "@/lib/types";

/**
 * Members can only ever *request* a deposit/withdraw — this write is allowed
 * by the Firestore rules, but it never touches `treasury` or `inventory`
 * directly. Only the admin API routes (using the Admin SDK) update balances,
 * after an admin approves the request.
 */
export async function requestTransaction(params: {
  user: AppUser;
  kind: TransactionKind;
  targetType: TransactionTargetType;
  targetKey: string;
  targetLabel: string;
  amount: number;
  note?: string;
}) {
  const { kind, targetType, targetKey, targetLabel, amount, note } = params;

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("ไม่พบ session การเข้าสู่ระบบ");

  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind,
      targetType,
      targetKey,
      targetLabel,
      amount,
      note: note ?? "",
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "ส่งคำขอไม่สำเร็จ");
}
