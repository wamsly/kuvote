import { useMemo, useState } from "react";
import {
  useAdminListUsers,
  useAdminApproveUser,
  useAdminDisableUser,
  useAdminPromoteUser,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminListUsers();
  const approve = useAdminApproveUser();
  const disable = useAdminDisableUser();
  const promote = useAdminPromoteUser();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const refetch = () => qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });

  const filtered = useMemo(() => {
    return (users as any[]).filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      const needle = q.toLowerCase();
      return (
        u.name?.toLowerCase().includes(needle) ||
        u.email?.toLowerCase().includes(needle) ||
        u.registrationNumber?.toLowerCase().includes(needle)
      );
    });
  }, [users, q, statusFilter]);

  const handle = async (fn: any, args: any, msg: string) => {
    try { await fn.mutateAsync(args); toast.success(msg); refetch(); }
    catch (err: any) { toast.error(err?.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voters</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and manage registered students and admins.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[14rem]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or reg. no." className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_otp">Pending OTP</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <CardTitle className="ml-auto text-sm font-medium text-muted-foreground">{filtered.length} of {(users as any[]).length}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-md bg-muted/40" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Reg. No.</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell className="text-xs">{u.registrationNumber ?? "—"}</TableCell>
                      <TableCell className="max-w-[14rem] truncate text-xs">{u.courseName ?? "—"}</TableCell>
                      <TableCell className="text-xs">{u.hostelName ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={u.role === "admin" ? "bg-primary/15 text-primary border-primary/30" : ""}>{u.role}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={u.status === "active" ? "bg-primary/15 text-primary border-primary/30" : u.status === "disabled" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-chart-3/10 text-chart-3 border-chart-3/30"}>{u.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {u.status !== "active" && <Button size="sm" variant="ghost" onClick={() => handle(approve, { userId: u.id }, "User approved")}><Check className="h-3.5 w-3.5" /></Button>}
                          {u.status !== "disabled" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handle(disable, { userId: u.id }, "User disabled")}><Ban className="h-3.5 w-3.5" /></Button>}
                          {u.role !== "admin" && <Button size="sm" variant="ghost" className="text-primary" onClick={() => handle(promote, { userId: u.id }, "Promoted to admin")}><ShieldCheck className="h-3.5 w-3.5" /></Button>}
                        </div>
                      </TableCell>
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
