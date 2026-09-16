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
