import { RequireAuth } from "@/components/RequireAuth";
import { Navbar } from "@/components/Navbar";
import { TreasuryPanel } from "@/components/TreasuryPanel";
import { InventoryPanel } from "@/components/InventoryPanel";
import { LogsTable } from "@/components/LogsTable";
import { MyDuesCard } from "@/components/MyDuesCard";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-vault-bg">
        <Navbar />
        <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <TreasuryPanel />
          <MyDuesCard />
          <InventoryPanel />
          <LogsTable />
        </main>
      </div>
    </RequireAuth>
  );
}
