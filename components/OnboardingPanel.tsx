"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ProfileModal } from "@/components/ProfileModal";

export function OnboardingPanel() {
  const { profile } = useAuth();
  const router = useRouter();
  if (!profile) return null;
  return <ProfileModal profile={profile} mandatory onClose={() => {}} onSaved={() => router.replace("/dashboard")} />;
}
