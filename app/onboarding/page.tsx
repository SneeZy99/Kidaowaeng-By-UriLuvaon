import { OnboardingPanel } from "@/components/OnboardingPanel";
import { RequireAuth } from "@/components/RequireAuth";

export default function OnboardingPage() {
  return <RequireAuth><main className="min-h-screen bg-vault-bg"><OnboardingPanel /></main></RequireAuth>;
}
