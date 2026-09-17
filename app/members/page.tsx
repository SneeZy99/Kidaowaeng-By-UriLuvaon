import { MembersPanel } from "@/components/MembersPanel";
import { Navbar } from "@/components/Navbar";

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-vault-bg">
      <Navbar />
      <MembersPanel />
    </div>
  );
}
