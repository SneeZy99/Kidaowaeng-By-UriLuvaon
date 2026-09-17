"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ProfileModal } from "@/components/ProfileModal";
import { useState } from "react";

const LINKS = [
  { href: "/dashboard", label: "ภาพรวมคลัง" },
  { href: "/members", label: "สมาชิก" },
  { href: "/weapons", label: "คลังอาวุธ" },
  { href: "/dues", label: "ค่างวดแก๊ง" },
  { href: "/admin", label: "อนุมัติรายการ", adminOnly: true },
];

export function Navbar() {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const userDisplayName = profile?.icName || profile?.username || "ผู้ใช้งาน";

  return (
    <header className="sticky top-0 z-20 border-b border-vault-border/80 bg-vault-bg/75 shadow-[0_1px_0_rgba(195,154,93,0.18),0_10px_30px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="K2A home" className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md transition hover:scale-105" title="K2A">
            <Image src="/k2a-logo.png" alt="K2A" width={160} height={160} priority className="h-24 w-24 max-w-none object-cover object-center invert contrast-125" />
          </Link>
          {profile?.guildMember && <nav className="hidden gap-1 rounded-full border border-vault-border/70 bg-vault-bg/40 p-1 sm:flex">
            {LINKS.filter((l) => !l.adminOnly || profile?.role === "admin").map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${active
                      ? "bg-vault-brass text-vault-bg shadow-[0_0_18px_-7px_rgba(195,154,93,1)]"
                      : "text-vault-muted hover:bg-vault-surface2/70 hover:text-vault-text"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>}
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <button onClick={() => setProfileOpen(true)} className="hidden text-right sm:block" aria-label="แก้ไขโปรไฟล์">
              <p className="text-sm text-vault-text">{userDisplayName}</p>
              <p className="text-xs text-vault-muted">
                {profile.role === "admin" ? "หัวหน้าแก๊ง" : "สมาชิก"}
              </p>
            </button>
            <button onClick={() => setProfileOpen(true)} aria-label="แก้ไขโปรไฟล์"><Image src={profile.avatarUrl} alt={userDisplayName} width={36} height={36} className="rounded-full border border-vault-border transition hover:border-vault-brass" /></button>
            <button
              onClick={handleLogout}
              className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-muted transition hover:border-vault-red/50 hover:text-vault-red"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
        {!profile && <Link href="/login" className="rounded-full border border-vault-brass/50 px-3 py-1.5 text-xs font-semibold text-vault-brass transition hover:bg-vault-brass hover:text-vault-bg">เข้าสู่ระบบ Discord</Link>}
      </div>
      {profile && profileOpen && <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} onSaved={() => setProfileOpen(false)} />}
    </header>
  );
}
