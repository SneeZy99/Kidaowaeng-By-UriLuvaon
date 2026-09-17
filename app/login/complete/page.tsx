"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

export default function LoginCompletePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = readCookie("pending_token");
    clearCookie("pending_token");

    if (!token) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    signInWithCustomToken(auth, token)
      .then(() => router.replace("/dashboard"))
      .catch((err) => {
        console.error(err);
        setError("เข้าสู่ระบบไม่สำเร็จ");
        const code = err?.code === "auth/user-disabled" ? "banned" : "oauth_failed";
        setTimeout(() => router.replace(`/login?error=${code}`), 1500);
      });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-vault-bg">
      <div className="flex flex-col items-center gap-3 text-vault-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vault-brass border-t-transparent" />
        <p className="font-mono text-sm">
          {error ?? "กำลังปลดล็อกห้องนิรภัย..."}
        </p>
      </div>
    </main>
  );
}
