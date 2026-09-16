import { RequireAuth } from "@/components/RequireAuth";
import { Navbar } from "@/components/Navbar";
import { AdminApprovalList } from "@/components/AdminApprovalList";
import { LogsTable } from "@/components/LogsTable";

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <div className="min-h-screen bg-vault-bg">
        <Navbar />
        <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-vault-text">
              แผงควบคุมหัวหน้าแก๊ง
            </h1>
            <p className="text-sm text-vault-muted">
              อนุมัติหรือปฏิเสธคำขอฝาก/เบิกของสมาชิก
            </p>
          </div>
          <AdminApprovalList />
          <LogsTable />
        </main>
      </div>
    </RequireAuth>
  );
}
