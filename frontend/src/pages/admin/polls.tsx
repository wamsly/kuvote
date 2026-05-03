import {
  useAdminListPolls,
  useAdminLockPoll,
  useAdminDeletePoll,
  getAdminListPollsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Lock, Trash2, BarChart3, PlusSquare } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS: Record<string, string> = {
  active: "bg-primary/15 text-primary border-primary/30",
  upcoming: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export default function AdminPollsPage() {
  const { data: polls = [], isLoading } = useAdminListPolls();
  const lock = useAdminLockPoll();
  const del = useAdminDeletePoll();
  const qc = useQueryClient();
  const refetch = () => qc.invalidateQueries({ queryKey: getAdminListPollsQueryKey() });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Polls</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, lock or delete elections.</p>
        </div>
        <Link href="/admin/create-poll"><Button className="gap-2"><PlusSquare className="h-4 w-4" /> New poll</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All polls</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-md bg-muted/40" />
          ) : (polls as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">No polls yet. Click "New poll" to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Locked</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead className="text-right">Seats</TableHead>
                    <TableHead className="text-right">Votes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(polls as any[]).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell><Badge variant="outline" className={STATUS[p.status]}>{p.status}</Badge></TableCell>
                      <TableCell>{p.locked ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Locked</Badge> : <span className="text-xs text-muted-foreground">Open</span>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.seatCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.voteCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!p.locked && (
                            <Button size="sm" variant="ghost" onClick={async () => {
                              try { await lock.mutateAsync({ pollId: p.id }); toast.success("Poll locked"); refetch(); }
                              catch (err: any) { toast.error(err?.message ?? "Failed"); }
                            }}><Lock className="h-3.5 w-3.5" /></Button>
                          )}
                          <Link href={`/results/${p.id}`}><Button size="sm" variant="ghost"><BarChart3 className="h-3.5 w-3.5" /></Button></Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this poll?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove the poll, its seats, candidates and recorded votes. This cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                  try { await del.mutateAsync({ pollId: p.id }); toast.success("Poll deleted"); refetch(); }
                                  catch (err: any) { toast.error(err?.message ?? "Failed"); }
                                }}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
