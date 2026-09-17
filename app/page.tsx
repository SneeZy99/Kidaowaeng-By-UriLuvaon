import { MembersPanel } from "@/components/MembersPanel";
import { Navbar } from "@/components/Navbar";

/** Public landing page: the roster is intentionally visible without Discord sign-in. */
export default function RootPage() {
  return (
    <div className="min-h-screen bg-vault-bg">
      <Navbar />
      <MembersPanel />
    </div>
  );
}
