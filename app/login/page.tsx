"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "เซสชันล็อกอินหมดอายุ กรุณาลองใหม่อีกครั้ง",
  oauth_failed: "เชื่อมต่อกับ Discord ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  oauth_config: "ระบบล็อกอิน Discord ยังตั้งค่าไม่ครบ กรุณาแจ้งผู้ดูแลระบบ",
  token_exchange: "Discord ปฏิเสธการเข้าสู่ระบบ กรุณาลองใหม่ หรือตรวจสอบ Redirect URI",
  discord_profile: "ไม่สามารถอ่านบัญชี Discord ได้ กรุณาลองใหม่อีกครั้ง",
  guild_check: "ไม่สามารถตรวจสอบการเป็นสมาชิก Discord server ได้ กรุณาลองใหม่อีกครั้ง",
  firebase_setup: "ระบบเข้าสู่ระบบฝั่งเซิร์ฟเวอร์ยังตั้งค่าไม่ครบ กรุณาแจ้งผู้ดูแลระบบ",
  not_in_guild: "บัญชี Discord นี้ยังไม่ได้อยู่ในเซิร์ฟเวอร์แก๊ง จึงเข้าดูได้เฉพาะรายชื่อสมาชิก",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { firebaseUser, loading } = useAuth();
  const error = params.get("error");

  useEffect(() => {
    if (!loading && firebaseUser) router.replace("/dashboard");
  }, [loading, firebaseUser, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-vault-bg px-6">
      <div className="vault-reveal w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-vault-brass/40 bg-vault-surface">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-vault-brass" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="10" width="18" height="10" rx="1" />
              <path d="M7 10V7a5 5 0 0 1 10 0v3" />
              <circle cx="12" cy="15" r="1.6" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-vault-text">
            THE VAULT
          </h1>
          <p className="mt-2 text-sm text-vault-muted">
            ระบบคลังเงินและไอเทมของแก๊ง — เข้าสู่ระบบเพื่อดำเนินการต่อ
          </p>
        </div>

        <div className="rounded-lg border border-vault-border bg-vault-surface p-6 shadow-panel">
          {error && (
            <div className="mb-4 rounded border border-vault-red/40 bg-vault-red/10 px-3 py-2 text-sm text-vault-red">
              {ERROR_MESSAGES[error] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"}
            </div>
          )}

          {/*  แก้ไขโครงสร้างแท็ก <a> ให้ถูกต้องสมบูรณ์ตรงนี้ */}
          <a
            href="/api/auth/discord"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#5865F2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#4a55d6] focus-visible:outline-2"
          >
            <svg viewBox="0 0 127.14 96.36" className="h-5 w-5" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            เข้าสู่ระบบด้วย Discord
          </a>

          <p className="mt-4 text-center text-xs text-vault-muted">
            เฉพาะสมาชิกแก๊งที่ได้รับอนุญาตเท่านั้น
          </p>
        </div>
      </div>
    </main>
  );
}
