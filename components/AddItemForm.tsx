"use client";

import { FormEvent, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORY_LABELS, ItemCategory } from "@/lib/types";

const CATEGORIES: ItemCategory[] = ["weapon", "drug", "equipment"];

export function AddItemForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("weapon");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "inventory"), {
        name: name.trim(),
        category,
        quantity: 0,
        updatedAt: Date.now(),
      });
      setName("");
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <div className="border-t border-vault-border px-6 py-3">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-vault-brass hover:underline"
        >
          + เพิ่มไอเทมใหม่เข้าคลัง
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-vault-border px-6 py-4 sm:flex-row sm:items-center"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อไอเทม"
        className="flex-1 rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass"
        required
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as ItemCategory)}
        className="rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-vault-brass px-3 py-2 text-xs font-medium text-vault-bg hover:bg-vault-amber disabled:opacity-50"
        >
          เพิ่ม
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-muted hover:text-vault-text"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
