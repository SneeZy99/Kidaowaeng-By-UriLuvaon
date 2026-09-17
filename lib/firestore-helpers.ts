import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  displayName,
  type AppUser,
  type TransactionKind,
  type TransactionTargetType,
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
  const { user, kind, targetType, targetKey, targetLabel, amount, note } = params;

  await addDoc(collection(db, "transactions"), {
    kind,
    targetType,
    targetKey,
    targetLabel,
    amount,
    note: note ?? "",
    status: "pending",
    requestedBy: user.uid,
    requestedByName: displayName(user),
    requestedByAvatar: user.avatarUrl ?? "",
    createdAt: serverTimestamp(),
  });
}
