import { useMemo, useState } from "react";
import { useAdminAuditLog } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search } from "lucide-react";

function downloadCsv(rows: any[]) {
  const header = ["Timestamp (UTC)", "Action", "Actor", "Role", "Target", "Details", "IP"];
  const data = rows.map((r) => [
    r.createdAt,
    r.action,
    r.actorEmail ?? "",
    r.actorRole ?? "",
    r.target ?? "",
    r.details ?? "",
    r.ipAddress ?? "",
  ]);
  const csv = [header, ...data].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "audit-log.csv"; a.click();
  URL.revokeObjectURL(url);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
}

const ACTION_COLORS: Record<string, string> = {
  "vote.cast": "bg-primary/15 text-primary border-primary/30",
  "admin.lock_poll": "bg-destructive/15 text-destructive border-destructive/30",
  "admin.unlock_poll": "bg-green-500/15 text-green-700 border-green-500/30",
  "admin.delete_poll": "bg-destructive/15 text-destructive border-destructive/30",
  "admin.approve_candidate": "bg-primary/15 text-primary border-primary/30",
  "admin.reject_candidate": "bg-destructive/15 text-destructive border-destructive/30",
  "user.login": "bg-chart-3/15 text-chart-3 border-chart-3/30",
  "admin.login": "bg-chart-5/15 text-chart-5 border-chart-5/30",
};

export default function AdminAuditPage() {
  const { data: rows = [], isLoading } = useAdminAuditLog();
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return (rows as any[]).filter((r) => {
      if (q) {
        const needle = q.toLowerCase();
        const match = [r.action, r.actorEmail, r.actorRole, r.target, r.details].some(
          (v) => v?.toLowerCase().includes(needle)
        );
        if (!match) return false;
      }
      if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.createdAt) > new Date(dateTo + "T23:59:59Z")) return false;
      return true;
    });
  }, [rows, q, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Append-only record of all platform activity with accurate timestamps.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[14rem]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, actor, target…" className="pl-8" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>From</span>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
              <span>To</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">{filtered.length} events</CardTitle>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv(filtered as any[])}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="h-32 animate-pulse rounded-md bg-muted/40" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(r.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${ACTION_COLORS[r.action] ?? ""}`}>{r.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.actorEmail ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.actorRole ?? "—"}</TableCell>
                      <TableCell className="text-xs max-w-[14rem] truncate">{r.target ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.details ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
