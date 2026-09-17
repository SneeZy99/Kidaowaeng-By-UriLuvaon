"use client";

import { useMemo, useState } from "react";
import { useMembers } from "@/lib/hooks";
import { useAuth } from "@/components/AuthProvider";
import { MemberAdminControls } from "@/components/MemberAdminControls";
import { isStaffRole, roleLabel } from "@/lib/roles";

export function MembersPanel() {
  const { firebaseUser } = useAuth();
  const { members, loading } = useMembers(firebaseUser?.uid);
  const [search, setSearch] = useState("");
  const reload = () => window.location.reload();
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
              <p className="mt-1 text-sm text-vault-muted">{firebaseUser ? "ดูรายชื่อและบทบาทของสมาชิกทุกคนในแก๊ง" : "รายชื่อสมาชิกแก๊ง — เข้าสู่ระบบด้วย Discord เพื่อดูข้อมูลส่วนอื่น"}</p>
            </div>
            <div className="flex items-center gap-2"><span className="rounded-full border border-vault-green/35 bg-vault-green/10 px-3 py-1 font-mono text-[10px] tracking-wider text-vault-green">{members.length.toString().padStart(2, "0")} MEMBERS</span><MemberAdminControls onChanged={reload} /></div>
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
            const isStaff = isStaffRole(member.role);
            const isVp = member.role === "vp";
            if (!firebaseUser) return <article key={member.uid} className="rounded-xl border border-vault-border bg-vault-bg/70 p-4"><div className="flex items-center gap-3">{member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-12 w-12 rounded-full border border-vault-border bg-vault-surface object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-full border border-vault-border bg-vault-surface font-display text-lg text-vault-brass">{initials}</span>}<p className="font-display text-lg font-semibold text-vault-text">{displayName}</p></div>{member.facebookUrl && <a href={member.facebookUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded border border-[#4d78c9]/50 bg-[#1877f2]/10 px-2 py-1 text-[10px] font-semibold text-[#78a7ff]">Facebook ↗</a>}</article>;
            return <article key={member.uid} className="group relative overflow-hidden rounded-xl border border-vault-border bg-vault-bg/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-vault-brass/60 hover:shadow-[0_14px_30px_-20px_rgba(195,154,93,0.8)]">
              <div className={`absolute inset-x-0 top-0 h-px ${isVp ? "bg-white" : isStaff ? "bg-vault-brass" : "bg-vault-green/70"}`} />
              <div className="flex items-center gap-3">
                {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-12 w-12 rounded-full border border-vault-border bg-vault-surface object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-full border border-vault-border bg-vault-surface font-display text-lg text-vault-brass">{initials}</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold text-vault-text">{displayName}</p>
                  <p className="truncate text-xs text-vault-muted">@{member.username}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${isVp ? "border-white/60 bg-white/10 text-white" : isStaff ? "border-vault-brass/40 bg-vault-brass/10 text-vault-brass" : "border-vault-green/35 bg-vault-green/10 text-vault-green"}`}>{roleLabel(member.role)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-vault-border pt-3"><span className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-vault-muted"><span className={`h-1.5 w-1.5 rounded-full ${isVp ? "bg-white" : isStaff ? "bg-vault-brass" : "bg-vault-green"}`} /> VERIFIED MEMBER</span>{member.facebookUrl && <a href={member.facebookUrl} target="_blank" rel="noreferrer" className="rounded border border-[#4d78c9]/50 bg-[#1877f2]/10 px-2 py-1 text-[10px] font-semibold text-[#78a7ff] transition hover:bg-[#1877f2]/20">Facebook ↗</a>}</div>
              <MemberAdminControls member={member} onChanged={reload} />
            </article>;
          })}
        </div>
      </section>
    </main>
  );
}
