"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { useUsers } from "@/lib/hooks";
import { displayName } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function MembersList() {
  const { profile, firebaseUser } = useAuth();
  const { users, loading } = useUsers();
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [errorUid, setErrorUid] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";

  async function callApi(uid: string, path: string, body?: object) {
    if (!firebaseUser) return;
    setBusyUid(uid);
    setErrorUid(null);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch(path, {
        method: body ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ทำรายการไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      setErrorUid(uid);
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <section className="vault-reveal rounded-lg border border-vault-border bg-vault-surface shadow-panel">
      <div className="border-b border-vault-border px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-vault-text">
          สมาชิกแก๊ง
        </h2>
        <p className="text-xs text-vault-muted">
          {loading ? "กำลังโหลด..." : `ทั้งหมด ${users.length} คน`}
        </p>
      </div>

      <div className="divide-y divide-vault-border">
        {users.map((u) => {
          const isSelf = u.uid === profile?.uid;
          return (
            <div
              key={u.uid}
              className={`flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                u.disabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={u.avatarUrl}
                  alt={displayName(u)}
                  width={40}
                  height={40}
                  className="rounded-full border border-vault-border"
                />
                <div>
                  <p className="text-sm text-vault-text">
                    {displayName(u)}{" "}
                    {isSelf && (
                      <span className="text-xs text-vault-muted">(คุณ)</span>
                    )}
                    {u.disabled && (
                      <span className="ml-2 rounded-full border border-vault-red/40 bg-vault-red/10 px-2 py-0.5 text-xs text-vault-red">
                        ถูกลบออก
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-vault-muted">
                    Discord: {u.username} · เข้าร่วมเมื่อ {formatDateTime(u.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {errorUid === u.uid && (
                  <span className="text-xs text-vault-red">ทำรายการไม่สำเร็จ</span>
                )}

                {!isAdmin && (
                  <span className="rounded-full border border-vault-border px-3 py-1 text-xs text-vault-muted">
                    {u.role === "admin" ? "หัวหน้าแก๊ง" : "สมาชิก"}
                  </span>
                )}

                {isAdmin && isSelf && (
                  <span className="rounded-full border border-vault-border px-3 py-1 text-xs text-vault-muted">
                    หัวหน้าแก๊ง
                  </span>
                )}

                {isAdmin && !isSelf && (
                  <>
                    <select
                      value={u.role}
                      disabled={busyUid === u.uid || u.disabled}
                      onChange={(e) =>
                        callApi(u.uid, `/api/users/${u.uid}/role`, {
                          role: e.target.value,
                        })
                      }
                      className="rounded-md border border-vault-border bg-vault-bg px-2 py-1.5 text-xs text-vault-text outline-none focus:border-vault-brass disabled:opacity-50"
                    >
                      <option value="member">สมาชิก</option>
                      <option value="admin">หัวหน้าแก๊ง</option>
                    </select>

                    {u.disabled ? (
                      <button
                        onClick={() => callApi(u.uid, `/api/users/${u.uid}/restore`)}
                        disabled={busyUid === u.uid}
                        className="rounded-md border border-vault-green/40 bg-vault-green/10 px-3 py-1.5 text-xs font-medium text-vault-green transition hover:bg-vault-green/20 disabled:opacity-50"
                      >
                        กู้คืน
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`ลบ ${displayName(u)} ออกจากเว็บ?`)) {
                            callApi(u.uid, `/api/users/${u.uid}/remove`);
                          }
                        }}
                        disabled={busyUid === u.uid}
                        className="rounded-md border border-vault-red/40 bg-vault-red/10 px-3 py-1.5 text-xs font-medium text-vault-red transition hover:bg-vault-red/20 disabled:opacity-50"
                      >
                        ลบออก
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
