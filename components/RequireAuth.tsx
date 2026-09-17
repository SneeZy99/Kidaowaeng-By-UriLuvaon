"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const needsIcName = !!profile && !profile.icName && pathname !== "/onboarding";

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (needsIcName) {
      router.replace("/onboarding");
      return;
    }
    if (adminOnly && profile && profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, profile, adminOnly, needsIcName, router]);

  if (
    loading ||
    !firebaseUser ||
    needsIcName ||
    (adminOnly && profile?.role !== "admin")
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-vault-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vault-brass border-t-transparent" />
      </main>
    );
  }

  return <>{children}</>;
}
