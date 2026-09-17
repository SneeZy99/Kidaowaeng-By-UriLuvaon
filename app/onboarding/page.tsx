"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function OnboardingPage() {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();
  const [icName, setIcName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/login");
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    if (profile?.icName) setIcName(profile.icName);
  }, [profile?.icName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSubmitting(true);
    setError(null);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/users/me/ic-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ icName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !firebaseUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-vault-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vault-brass border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-vault-bg px-6">
      <div className="vault-reveal w-full max-w-sm rounded-lg border border-vault-border bg-vault-surface p-6 shadow-panel">
        <h1 className="font-display text-xl font-semibold text-vault-text">
          ตั้งชื่อ-นามสกุล IC
        </h1>
        <p className="mt-1 text-sm text-vault-muted">
          กรอกชื่อและนามสกุลตัวละครในเกม เพื่อให้สมาชิกคนอื่นรู้ว่าเป็นใครในประวัติรายการ
          ต้องตั้งก่อนถึงจะใช้งานเว็บต่อได้
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-vault-muted">
              ชื่อ-นามสกุล IC
            </label>
            <input
              value={icName}
              onChange={(e) => setIcName(e.target.value)}
              placeholder="เช่น John Doe"
              className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2 text-vault-text outline-none focus:border-vault-brass"
              required
              minLength={3}
              maxLength={60}
            />
          </div>

          {error && <p className="text-sm text-vault-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-vault-brass px-4 py-2.5 text-sm font-medium text-vault-bg transition hover:bg-vault-amber disabled:opacity-50"
          >
            {submitting ? "กำลังบันทึก..." : "บันทึกและเข้าใช้งาน"}
          </button>
        </form>
      </div>
    </main>
  );
}
