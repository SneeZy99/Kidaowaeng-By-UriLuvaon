"use client";

import { useMemo, useState } from "react";
import { useMembers } from "@/lib/hooks";

export function MembersPanel() {
  const { members, loading } = useMembers();
  const [search, setSearch] = useState("");
  const visibleMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter((member) => `${member.icName} ${member.displayName} ${member.username}`.toLowerCase().includes(term));
  }, [members, search]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="vault-reveal overflow-hidden rounded-xl border border-vault-border bg-vault-surface shadow-panel">
        <div className="border-b border-vault-border px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-vault-brass">Gang Roster // Online Registry</p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-vault-text">รายชื่อสมาชิก</h1>
              <p className="mt-1 text-sm text-vault-muted">ดูรายชื่อและบทบาทของสมาชิกทุกคนในแก๊ง</p>
            </div>
            <span className="rounded-full border border-vault-green/35 bg-vault-green/10 px-3 py-1 font-mono text-[10px] tracking-wider text-vault-green">{members.length.toString().padStart(2, "0")} MEMBERS</span>
          </div>
          <label className="mt-5 block max-w-md">
            <span className="sr-only">ค้นหาสมาชิก</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อสมาชิก..." className="w-full rounded-lg border border-vault-border bg-vault-bg/70 px-3 py-2 text-sm text-vault-text outline-none transition placeholder:text-vault-muted focus:border-vault-brass focus:shadow-[0_0_18px_-8px_rgba(195,154,93,0.9)]" />
          </label>
        </div>

        {loading && <p className="py-12 text-center text-sm text-vault-muted">กำลังโหลดรายชื่อสมาชิก...</p>}
        {!loading && visibleMembers.length === 0 && <p className="py-12 text-center text-sm text-vault-muted">ไม่พบสมาชิกที่ค้นหา</p>}
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {visibleMembers.map((member) => {
            const displayName = member.icName || member.displayName || member.username;
            const initials = displayName.slice(0, 1).toUpperCase();
            const isAdmin = member.role === "admin";
            return <article key={member.uid} className="group relative overflow-hidden rounded-xl border border-vault-border bg-vault-bg/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-vault-brass/60 hover:shadow-[0_14px_30px_-20px_rgba(195,154,93,0.8)]">
              <div className={`absolute inset-x-0 top-0 h-px ${isAdmin ? "bg-vault-brass" : "bg-vault-green/70"}`} />
              <div className="flex items-center gap-3">
                {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-12 w-12 rounded-full border border-vault-border bg-vault-surface object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-full border border-vault-border bg-vault-surface font-display text-lg text-vault-brass">{initials}</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold text-vault-text">{displayName}</p>
                  <p className="truncate text-xs text-vault-muted">@{member.username}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${isAdmin ? "border-vault-brass/40 bg-vault-brass/10 text-vault-brass" : "border-vault-green/35 bg-vault-green/10 text-vault-green"}`}>{isAdmin ? "หัวหน้าแก๊ง" : "สมาชิก"}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-vault-border pt-3 font-mono text-[10px] tracking-wider text-vault-muted"><span className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-vault-brass" : "bg-vault-green"}`} /> VERIFIED MEMBER</div>
            </article>;
          })}
        </div>
      </section>
    </main>
  );
}
