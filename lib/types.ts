export type MoneyKey = "cash" | "redMoney";

export const MONEY_LABELS: Record<MoneyKey, string> = {
  cash: "เงินเขียว",
  redMoney: "เงินแดง",
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
  icName?: string;
  displayName?: string;
}

export type DuesFrequency = "daily" | "weekly";

export interface GangDuesConfig {
  amount: number;
  frequency: DuesFrequency;
  startAt: number;
  enabled: boolean;
}

export interface MemberDuesStatus {
  uid: string;
  name: string;
  avatarUrl: string;
  outstandingAmount: number;
  outstandingPeriods: number;
  oldestDueAt?: number;
  currentPeriodKey?: string;
  currentDueAt?: number;
  paidCurrentPeriod: boolean;
}

export interface Treasury {
  cash: number;
  redMoney: number;

  updatedAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  imageUrl?: string;
  updatedAt: number;
}

export type TransactionKind = "deposit" | "withdraw";
export type TransactionTargetType = "money" | "item" | "weapon";
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
  action?: "add_weapon" | "remove_weapon";
}

export interface WeaponRecord {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
  note?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  createdAt: number;
}
