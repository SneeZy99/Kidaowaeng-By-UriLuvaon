import { RequireAuth } from "@/components/RequireAuth";
import { Navbar } from "@/components/Navbar";
import { WeaponPanel } from "@/components/WeaponPanel";

export default function WeaponsPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-vault-bg">
        <Navbar />
        <WeaponPanel />
      </div>
    </RequireAuth>
  );
}
