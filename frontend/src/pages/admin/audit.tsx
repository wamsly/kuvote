import { useAdminAuditLog } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

function downloadCsv(rows: any[]) {
  const header = ["Timestamp", "Action", "Actor", "Role", "Target", "Details"];
  const data = rows.map((r) => [r.createdAt, r.action, r.actorEmail ?? "", r.actorRole ?? "", r.target ?? "", r.details ?? ""]);
  const csv = [header, ...data].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "audit-log.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditPage() {
  const { data: rows = [], isLoading } = useAdminAuditLog();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Append-only record of all platform activity.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Events</CardTitle>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv(rows as any[])}>
              <Download className="h-4 w-4" /> Download CSV
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
                  {(rows as any[]).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{r.action}</Badge></TableCell>
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
