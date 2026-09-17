import { RequireAuth } from "@/components/RequireAuth";
import { Navbar } from "@/components/Navbar";
import { LogsTable } from "@/components/LogsTable";

export default function HistoryPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-vault-bg">
        <Navbar />
        <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-vault-brass">Activity</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-vault-text">ประวัติทั้งหมด</h1>
            <p className="text-sm text-vault-muted">ค้นหาและตรวจสอบรายการย้อนหลังทั้งหมด</p>
          </div>
          <LogsTable limit={100} showAllLink={false} pageSize={20} />
        </main>
      </div>
    </RequireAuth>
  );
}
