import { useEffect, useMemo, useState } from "react";
import {
  useListPolls,
  useGetPollDetails,
  useApplyCandidate,
  useListMyApplications,
  getGetPollDetailsQueryKey,
  getListMyApplicationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Megaphone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  endorsed: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function ApplyCandidatePage() {
  const { data: polls = [] } = useListPolls();
  const { data: applications = [] } = useListMyApplications();
  const apply = useApplyCandidate();
  const qc = useQueryClient();
  const [pollId, setPollId] = useState("");
  const [seatId, setSeatId] = useState("");
  const [manifesto, setManifesto] = useState("");
  const eligible = useMemo(() => (polls as any[]).filter((p) => p.status === "active" || p.status === "upcoming"), [polls]);
  const { data: pollDetails } = useGetPollDetails(pollId, {
    query: { enabled: Boolean(pollId), queryKey: getGetPollDetailsQueryKey(pollId) },
  });
  useEffect(() => { setSeatId(""); }, [pollId]);
  const seats = useMemo(() => (pollDetails?.seats ?? []).filter((s: any) => s.eligible), [pollDetails]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollId || !seatId || !manifesto.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    try {
      await apply.mutateAsync({ data: { pollId, seatId, manifesto } });
      toast.success("Application submitted — awaiting endorsement & approval");
      setManifesto("");
      qc.invalidateQueries({ queryKey: getListMyApplicationsQueryKey() });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not apply");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Stand for Election</h1>
        <p className="mt-1 text-sm text-muted-foreground">Submit your manifesto and gather endorsements before the admin approves you for the ballot.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle>New application</CardTitle>
            </div>
            <CardDescription>You can only apply for seats you are eligible to vote on.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Poll</Label>
                <Select value={pollId} onValueChange={setPollId}>
                  <SelectTrigger><SelectValue placeholder="Choose a poll" /></SelectTrigger>
                  <SelectContent>
                    {eligible.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title} — <span className="text-xs text-muted-foreground capitalize">{p.status}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seat</Label>
                <Select value={seatId} onValueChange={setSeatId} disabled={!pollId}>
                  <SelectTrigger><SelectValue placeholder={pollId ? "Choose a seat" : "Pick a poll first"} /></SelectTrigger>
                  <SelectContent>
                    {seats.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Manifesto</Label>
                <Textarea
                  rows={6}
                  required
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  placeholder="Outline your priorities, what you'll fight for, and how voters can hold you accountable…"
                />
              </div>
              <Button type="submit" className="w-full" disabled={apply.isPending}>
                {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your applications</CardTitle>
            <CardDescription>Status of submissions you've made.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(applications as any[]).length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
            {(applications as any[]).map((a) => (
              <div key={a.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{a.pollTitle}</div>
                  <Badge variant="outline" className={STATUS_BADGE[a.status] ?? ""}>{a.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{a.seatLabel}</div>
                <p className="mt-2 line-clamp-3 text-xs">{a.manifesto}</p>
                {a.rejectionReason && (
                  <p className="mt-2 text-xs text-destructive">Reason: {a.rejectionReason}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
