import { MembersPanel } from "@/components/MembersPanel";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";

export default function MembersPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-vault-bg">
        <Navbar />
        <MembersPanel />
      </div>
    </RequireAuth>
  );
}
