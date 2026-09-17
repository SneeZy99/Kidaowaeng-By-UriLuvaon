"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ProfileModal } from "@/components/ProfileModal";

const LINKS = [
  { href: "/dashboard", label: "ภาพรวมคลัง" },
  { href: "/weapons", label: "คลังอาวุธ" },
  { href: "/history", label: "ประวัติทั้งหมด" },
  { href: "/admin", label: "อนุมัติรายการ", adminOnly: true },
];

export function Navbar() {
  const { profile, logout, updateProfile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-vault-border bg-vault-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <span className="font-display text-lg font-semibold tracking-tight text-vault-text">
            THE VAULT
          </span>
          <nav className="hidden gap-1 sm:flex">
            {LINKS.filter((l) => !l.adminOnly || profile?.role === "admin").map(
              (link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? "bg-vault-surface2 text-vault-brass"
                        : "text-vault-muted hover:text-vault-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
            )}
          </nav>
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileOpen(true)}
              className="group flex items-center gap-2 text-right"
              title="แก้ไขโปรไฟล์"
            >
              <div className="hidden sm:block">
                <p className="text-sm text-vault-text group-hover:text-vault-brass">
                  {profile.username}
                </p>
                <p className="text-xs text-vault-muted">
                  Discord member · {profile.role === "admin" ? "หัวหน้าแก๊ง" : "สมาชิกแก๊ง"}
                </p>
              </div>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="h-9 w-9 rounded-full border border-vault-brass/50 object-cover transition group-hover:border-vault-brass"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-vault-brass/50 text-vault-brass">
                  ✦
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-muted transition hover:border-vault-red/50 hover:text-vault-red"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
      {profile && profileOpen && (
        <ProfileModal
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={updateProfile}
        />
      )}
    </header>
  );
}
