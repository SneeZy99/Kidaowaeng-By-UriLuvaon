"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser || !profile?.guildMember) {
      router.replace(firebaseUser ? "/members" : "/login");
      return;
    }
    if (adminOnly && profile && profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, profile, adminOnly, router]);

  if (loading || !firebaseUser || !profile?.guildMember || (adminOnly && profile?.role !== "admin")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-vault-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vault-brass border-t-transparent" />
      </main>
    );
  }

  return <>{children}</>;
}
