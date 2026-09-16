"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function RootPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(firebaseUser ? "/dashboard" : "/login");
  }, [loading, firebaseUser, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-vault-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-vault-brass border-t-transparent" />
    </main>
  );
}
