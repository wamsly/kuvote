import { useMemo, useState } from "react";
import {
  useAdminListCandidates,
  useAdminApproveCandidate,
  useAdminRejectCandidate,
  useAdminAddCandidate,
  useAdminListPolls,
  useAdminListUsers,
  useGetPollDetails,
  getAdminListCandidatesQueryKey,
  getGetPollDetailsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Plus, Loader2, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS: Record<string, string> = {
  pending: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  endorsed: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function AdminCandidatesPage() {
  const { data: candidates = [], isLoading } = useAdminListCandidates();
  const approve = useAdminApproveCandidate();
  const reject = useAdminRejectCandidate();
  const add = useAdminAddCandidate();
  const polls = useAdminListPolls();
  const users = useAdminListUsers();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [viewDocs, setViewDocs] = useState<any | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [pollId, setPollId] = useState("");
  const [seatId, setSeatId] = useState("");
  const [userId, setUserId] = useState("");
  const [manifesto, setManifesto] = useState("");
  const pollDetails = useGetPollDetails(pollId, { query: { enabled: Boolean(pollId), queryKey: getGetPollDetailsQueryKey(pollId) } });

  const refetch = () => qc.invalidateQueries({ queryKey: getAdminListCandidatesQueryKey() });

  const filtered = useMemo(() => (candidates as any[]).filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const n = search.toLowerCase();
      return c.name?.toLowerCase().includes(n) || c.email?.toLowerCase().includes(n) || c.pollTitle?.toLowerCase().includes(n) || c.seatLabel?.toLowerCase().includes(n);
    }
    return true;
  }), [candidates, statusFilter, search]);

  const handleApprove = async (id: string) => {
    try { await approve.mutateAsync({ candidateId: id }); toast.success("Approved"); refetch(); }
    catch (err: any) { toast.error(err?.message ?? "Failed"); }
  };
  const handleReject = async () => {
    if (!rejectFor) return;
    try { await reject.mutateAsync({ candidateId: rejectFor, data: { reason } }); toast.success("Rejected"); setRejectFor(null); setReason(""); refetch(); }
    catch (err: any) { toast.error(err?.message ?? "Failed"); }
  };
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollId || !seatId || !userId || !manifesto) { toast.error("Fill in all fields"); return; }
    try {
      await add.mutateAsync({ data: { pollId, seatId, userId, manifesto } });
      toast.success("Candidate added");
      setOpenAdd(false); setPollId(""); setSeatId(""); setUserId(""); setManifesto("");
      refetch();
    } catch (err: any) { toast.error(err?.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Approve, reject or add candidates manually.</p>
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add candidate</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add candidate</DialogTitle>
              <DialogDescription>Manually add a candidate to a seat. They will be marked as approved.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <Label>Poll</Label>
                <Select value={pollId} onValueChange={(v) => { setPollId(v); setSeatId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select poll" /></SelectTrigger>
                  <SelectContent>{((polls.data ?? []) as any[]).map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Seat</Label>
                <Select value={seatId} onValueChange={setSeatId} disabled={!pollId}>
                  <SelectTrigger><SelectValue placeholder="Select seat" /></SelectTrigger>
                  <SelectContent>{(pollDetails.data?.seats ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Student</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="Pick a registered student" /></SelectTrigger>
                  <SelectContent>{((users.data ?? []) as any[]).filter((u) => u.role === "student" && u.status === "active").map((u) => (<SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Manifesto</Label>
                <Textarea rows={4} value={manifesto} onChange={(e) => setManifesto(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={add.isPending} className="gap-2">{add.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate, poll or seat…" className="flex-1 min-w-[14rem]" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="endorsed">Endorsed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <CardTitle className="text-sm font-medium text-muted-foreground">{filtered.length} of {(candidates as any[]).length}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="h-32 animate-pulse rounded-md bg-muted/40" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Poll / Seat</TableHead>
                    <TableHead>Slogan / Manifesto</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                        {c.photoUrl && <img src={c.photoUrl} alt="photo" className="mt-1 h-8 w-8 rounded-full object-cover" />}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{c.pollTitle}</div>
                        <div className="text-xs text-muted-foreground">{c.seatLabel}</div>
                      </TableCell>
                      <TableCell className="max-w-[14rem]">
                        {c.slogan && <p className="text-xs italic text-muted-foreground mb-1">"{c.slogan}"</p>}
                        <p className="text-xs line-clamp-2">{c.manifesto}</p>
                      </TableCell>
                      <TableCell>
                        {(c.documents ?? []).length > 0 ? (
                          <Button size="sm" variant="ghost" onClick={() => setViewDocs(c)} className="gap-1 text-primary">
                            <FileText className="h-3.5 w-3.5" /> {c.documents.length}
                          </Button>
                        ) : <span className="text-xs text-muted-foreground">None</span>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className={STATUS[c.status]}>{c.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("en-KE")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {c.status !== "approved" && <Button size="sm" variant="ghost" className="text-primary" title="Approve" onClick={() => handleApprove(c.id)}><Check className="h-3.5 w-3.5" /></Button>}
                          {c.status !== "rejected" && <Button size="sm" variant="ghost" className="text-destructive" title="Reject" onClick={() => setRejectFor(c.id)}><X className="h-3.5 w-3.5" /></Button>}
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

      <Dialog open={Boolean(rejectFor)} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject candidate</DialogTitle>
            <DialogDescription>Provide a reason. The candidate will see this on their dashboard.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewDocs)} onOpenChange={(o) => !o && setViewDocs(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documents — {viewDocs?.name}</DialogTitle>
            <DialogDescription>Files uploaded by the candidate during their application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(viewDocs?.documents ?? []).map((d: any) => (
              <a key={d.id} href={d.documentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-muted/40 transition-colors">
                {d.documentType === "photo" ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.documentName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{d.documentType} · {new Date(d.uploadedAt).toLocaleDateString("en-KE")}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
            {(viewDocs?.documents ?? []).length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
