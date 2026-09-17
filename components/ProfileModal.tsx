"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { auth } from "@/lib/firebase";
import type { AppUser } from "@/lib/types";

export function ProfileModal({
  profile,
  onClose,
  onSaved,
  mandatory = false,
}: {
  profile: AppUser;
  onClose: () => void;
  onSaved: (changes: Pick<AppUser, "icName">) => void;
  mandatory?: boolean;
}) {
  const [icName, setIcName] = useState(profile.icName ?? "");
  const [facebookUrl, setFacebookUrl] = useState(profile.facebookUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("ไม่พบ session");

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ icName, facebookUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
      onSaved({ icName: result.icName });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-4 sm:items-center">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-vault-border bg-vault-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-vault-border px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-vault-brass">Profile</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-vault-text">แก้ไขโปรไฟล์</h2>
          </div>
          {!mandatory && <button onClick={onClose} className="text-xl text-vault-muted hover:text-vault-text" aria-label="ปิด">×</button>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-3 rounded-lg border border-vault-border bg-vault-bg/60 p-3">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="รูปโปรไฟล์ Discord" className="h-12 w-12 rounded-full border border-vault-brass/50 object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-vault-border text-vault-brass">✦</div>
            )}
            <div>
              <p className="text-sm text-vault-text">@{profile.username}</p>
              <p className="text-xs text-vault-muted">Discord account</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-vault-muted">ชื่อ-นามสกุล IC</span>
            <input
              value={icName}
              onChange={(event) => setIcName(event.target.value)}
              minLength={3}
              maxLength={60}
              required
              placeholder="เช่น Naruto Uzumaki"
              className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-vault-muted">ลิงก์ Facebook (ไม่บังคับ)</span>
            <input
              type="url"
              value={facebookUrl}
              onChange={(event) => setFacebookUrl(event.target.value)}
              placeholder="https://www.facebook.com/your.profile"
              className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-sm text-vault-text outline-none focus:border-vault-brass"
            />
          </label>

          <p className="text-xs text-vault-muted">กรอกชื่อและนามสกุลที่ใช้ในเกม รูปโปรไฟล์จะอิงจาก Discord โดยอัตโนมัติ</p>

          {error && <p className="text-sm text-vault-red">{error}</p>}

          <div className="flex gap-2 pt-1">
            {!mandatory && <button type="button" onClick={onClose} className="flex-1 rounded-md border border-vault-border px-4 py-2.5 text-sm text-vault-muted hover:text-vault-text">ยกเลิก</button>}
            <button type="submit" disabled={saving} className="flex-1 rounded-md bg-vault-brass px-4 py-2.5 text-sm font-medium text-vault-bg hover:bg-vault-amber disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
