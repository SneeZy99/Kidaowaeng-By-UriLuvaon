import { DuesPanel } from "@/components/DuesPanel";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";

export default function DuesPage() { return <RequireAuth><div className="min-h-screen bg-vault-bg"><Navbar /><DuesPanel /></div></RequireAuth>; }
