"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const LINKS = [
  { href: "/dashboard", label: "ภาพรวมคลัง" },
  { href: "/weapons", label: "คลังอาวุธ" },
  { href: "/admin", label: "อนุมัติรายการ", adminOnly: true },
];

export function Navbar() {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const userDisplayName = profile?.icName || profile?.username || "ผู้ใช้งาน";

  return (
    <header className="sticky top-0 z-20 border-b border-vault-border bg-vault-bg/90 shadow-[0_1px_0_rgba(195,154,93,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="group flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-vault-text">
            <span className="grid h-7 w-7 place-items-center rounded border border-vault-brass/50 bg-vault-brass/10 text-xs text-vault-brass shadow-[0_0_18px_-6px_rgba(195,154,93,0.9)] transition group-hover:border-vault-brass">V</span>
            <span>THE VAULT</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {LINKS.filter((l) => !l.adminOnly || profile?.role === "admin").map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm transition ${active
                      ? "bg-vault-brass/10 text-vault-brass shadow-[inset_0_0_0_1px_rgba(195,154,93,0.18)]"
                      : "text-vault-muted hover:bg-vault-surface2/70 hover:text-vault-text"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-vault-text">{userDisplayName}</p>
              <p className="text-xs text-vault-muted">
                {profile.role === "admin" ? "หัวหน้าแก๊ง" : "สมาชิก"}
              </p>
            </div>
            <Image
              src={profile.avatarUrl}
              alt={userDisplayName}
              width={36}
              height={36}
              className="rounded-full border border-vault-border"
            />
            <button
              onClick={handleLogout}
              className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-muted transition hover:border-vault-red/50 hover:text-vault-red"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
