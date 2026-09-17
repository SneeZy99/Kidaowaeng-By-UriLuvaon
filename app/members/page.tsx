import { RequireAuth } from "@/components/RequireAuth";
import { Navbar } from "@/components/Navbar";
import { MembersList } from "@/components/MembersList";

export default function MembersPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-vault-bg">
        <Navbar />
        <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <MembersList />
        </main>
      </div>
    </RequireAuth>
  );
}
