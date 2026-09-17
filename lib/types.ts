export type MoneyKey = "cash" | "redMoney" | "bank";

export const MONEY_LABELS: Record<MoneyKey, string> = {
  cash: "เงินสด",
  redMoney: "เงินแดง",
  bank: "เงินธนาคาร",
};

export type ItemCategory = "weapon" | "drug" | "equipment";

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: "อาวุธ",
  drug: "ยา",
  equipment: "อุปกรณ์",
};

export interface AppUser {
  uid: string;
  discordId: string;
  username: string;
  avatarUrl: string;
  role: "member" | "admin";
  createdAt: number;
  /** In-character first + last name, e.g. "John Doe" — required before using the site. */
  icName?: string;
  /** Set by an admin to revoke access; the account is also disabled in Firebase Auth. */
  disabled?: boolean;
}

/** The display name used everywhere in the UI: IC name once set, Discord name until then. */
export function displayName(user: Pick<AppUser, "icName" | "username">): string {
  return user.icName?.trim() || user.username;
}

export interface Treasury {
  cash: number;
  redMoney: number;
  bank: number;
  updatedAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  updatedAt: number;
}

export type TransactionKind = "deposit" | "withdraw";
export type TransactionTargetType = "money" | "item";
export type TransactionStatus = "pending" | "approved" | "rejected";

export interface Transaction {
  id: string;
  kind: TransactionKind;
  targetType: TransactionTargetType;
  // if targetType === "money", targetKey is a MoneyKey; if "item", it's the item id
  targetKey: string;
  targetLabel: string;
  amount: number;
  note?: string;
  status: TransactionStatus;
  requestedBy: string; // uid
  requestedByName: string;
  requestedByAvatar?: string;
  createdAt: number;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: number;
  rejectReason?: string;
}
