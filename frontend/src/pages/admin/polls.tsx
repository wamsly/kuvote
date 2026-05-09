import { useState } from "react";
import {
  useAdminListPolls,
  useAdminLockPoll,
  useAdminUnlockPoll,
  useAdminDeletePoll,
  useAdminUpdatePoll,
  useAdminOpenApplicationWindow,
  useAdminCloseApplicationWindow,
  getAdminListPollsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Lock, Unlock, Trash2, BarChart3, PlusSquare, Pencil, PlayCircle, StopCircle, Loader2 } from "lucide-react";
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
  const unlock = useAdminUnlockPoll();
  const del = useAdminDeletePoll();
  const update = useAdminUpdatePoll();
  const openApp = useAdminOpenApplicationWindow();
  const closeApp = useAdminCloseApplicationWindow();
  const qc = useQueryClient();
  const refetch = () => qc.invalidateQueries({ queryKey: getAdminListPollsQueryKey() });

  const [editPoll, setEditPoll] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [appPollId, setAppPollId] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState("");

  const openEdit = (p: any) => {
    setEditPoll(p);
    setEditTitle(p.title);
    setEditDescription(p.description ?? "");
    setEditStart(p.startDate ? new Date(p.startDate).toISOString().slice(0, 16) : "");
    setEditEnd(p.endDate ? new Date(p.endDate).toISOString().slice(0, 16) : "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPoll) return;
    try {
      await update.mutateAsync({ pollId: editPoll.id, data: { title: editTitle, description: editDescription, startDate: new Date(editStart).toISOString(), endDate: new Date(editEnd).toISOString() } });
      toast.success("Poll updated");
      setEditPoll(null);
      refetch();
    } catch (err: any) { toast.error(err?.message ?? "Failed"); }
  };

  const handleOpenApp = async () => {
    if (!appPollId) return;
    try {
      await openApp.mutateAsync({ pollId: appPollId, data: timerMinutes ? { timerDurationMinutes: Number(timerMinutes) } : {} });
      toast.success("Application window opened");
      setAppPollId(null);
      setTimerMinutes("");
      refetch();
    } catch (err: any) { toast.error(err?.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SGC Polls</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, manage, lock or delete SGC elections.</p>
        </div>
        <Link href="/admin/create-poll"><Button className="gap-2"><PlusSquare className="h-4 w-4" /> New poll</Button></Link>
      </div>
      <Card>
        <CardHeader><CardTitle>All polls</CardTitle></CardHeader>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Locked</TableHead>
                    <TableHead>Applications</TableHead>
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
                      <TableCell><Badge variant="outline" className="uppercase text-[10px]">{p.pollType === "sgc" ? "SGC" : p.pollType ?? "General"}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={STATUS[p.status]}>{p.status}</Badge></TableCell>
                      <TableCell>
                        {p.locked
                          ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Locked</Badge>
                          : <span className="text-xs text-muted-foreground">Open</span>}
                      </TableCell>
                      <TableCell>
                        {p.applicationOpen
                          ? <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">Open</Badge>
                          : <span className="text-xs text-muted-foreground">Closed</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.seatCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.voteCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                          {p.locked ? (
                            <Button size="sm" variant="ghost" title="Unlock" onClick={async () => {
                              try { await unlock.mutateAsync({ pollId: p.id }); toast.success("Poll unlocked"); refetch(); }
                              catch (err: any) { toast.error(err?.message ?? "Failed"); }
                            }}><Unlock className="h-3.5 w-3.5" /></Button>
                          ) : (
                            <Button size="sm" variant="ghost" title="Lock" onClick={async () => {
                              try { await lock.mutateAsync({ pollId: p.id }); toast.success("Poll locked"); refetch(); }
                              catch (err: any) { toast.error(err?.message ?? "Failed"); }
                            }}><Lock className="h-3.5 w-3.5" /></Button>
                          )}
                          {p.applicationOpen ? (
                            <Button size="sm" variant="ghost" title="Close applications" className="text-destructive" onClick={async () => {
                              try { await closeApp.mutateAsync({ pollId: p.id }); toast.success("Application window closed"); refetch(); }
                              catch (err: any) { toast.error(err?.message ?? "Failed"); }
                            }}><StopCircle className="h-3.5 w-3.5" /></Button>
                          ) : (
                            <Button size="sm" variant="ghost" title="Open applications" className="text-green-600" onClick={() => setAppPollId(p.id)}><PlayCircle className="h-3.5 w-3.5" /></Button>
                          )}
                          <Link href={`/results/${p.id}`}><Button size="sm" variant="ghost" title="Results"><BarChart3 className="h-3.5 w-3.5" /></Button></Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this poll?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove the poll, its seats, candidates and votes. This cannot be undone.</AlertDialogDescription>
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

      <Dialog open={Boolean(editPoll)} onOpenChange={(o) => !o && setEditPoll(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit poll</DialogTitle>
            <DialogDescription>Update the poll details. Seats are managed separately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Voting opens</Label>
                <Input type="datetime-local" required value={editStart} onChange={(e) => setEditStart(e.target.value)} />
              </div>
              <div>
                <Label>Voting closes</Label>
                <Input type="datetime-local" required value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditPoll(null)}>Cancel</Button>
              <Button type="submit" disabled={update.isPending} className="gap-2">
                {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(appPollId)} onOpenChange={(o) => !o && setAppPollId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open application window</DialogTitle>
            <DialogDescription>Set an optional timer (in minutes) for how long the application window stays open. Leave blank for no timer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Timer duration (minutes) — optional</Label>
            <Input type="number" min={1} placeholder="e.g. 60 for 1 hour" value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppPollId(null)}>Cancel</Button>
            <Button onClick={handleOpenApp} disabled={openApp.isPending} className="gap-2">
              {openApp.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Open window
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
