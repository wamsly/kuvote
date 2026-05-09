import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useListPolls,
  useGetPollDetails,
  useApplyCandidate,
  useUploadCandidateDocument,
  useListMyApplications,
  useGetApplicationSettings,
  getGetPollDetailsQueryKey,
  getListMyApplicationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Megaphone, Upload, X, Clock, AlertCircle, FileText, Image } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  endorsed: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

function useCountdown(closeAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!closeAt) { setRemaining(null); return; }
    const calc = () => {
      const diff = new Date(closeAt).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [closeAt]);
  return remaining;
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

type UploadedFile = { name: string; type: "document" | "photo"; file: File; dataUrl: string };

export default function ApplyCandidatePage() {
  const { data: polls = [] } = useListPolls();
  const { data: applications = [] } = useListMyApplications();
  const apply = useApplyCandidate();
  const uploadDoc = useUploadCandidateDocument();
  const qc = useQueryClient();
  const [pollId, setPollId] = useState("");
  const [seatId, setSeatId] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [slogan, setSlogan] = useState("");
  const [bio, setBio] = useState("");
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const eligible = useMemo(() => (polls as any[]).filter((p) => p.status === "active" || p.status === "upcoming"), [polls]);

  const { data: pollDetails } = useGetPollDetails(pollId, {
    query: { enabled: Boolean(pollId), queryKey: getGetPollDetailsQueryKey(pollId) },
  });

  const { data: appSettings } = useGetApplicationSettings(pollId, {
    query: { enabled: Boolean(pollId) },
  });

  useEffect(() => { setSeatId(""); }, [pollId]);
  const seats = useMemo(() => (pollDetails?.seats ?? []).filter((s: any) => s.eligible), [pollDetails]);
  const settings = appSettings as any;
  const isOpen = settings?.isOpen === true;
  const closeAt = settings?.closeAt ?? null;
  const remaining = useCountdown(closeAt);
  const isExpired = remaining !== null && remaining === 0;
  const canApply = isOpen && !isExpired;

  const addFile = useCallback((file: File, type: "document" | "photo") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploads((prev) => [...prev, { name: file.name, type, file, dataUrl: e.target?.result as string }]);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeUpload = (i: number) => setUploads((prev) => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollId || !seatId || !manifesto.trim()) { toast.error("Fill in all required fields"); return; }
    if (!canApply) { toast.error("The application window is closed or not yet open."); return; }
    try {
      const r = (await apply.mutateAsync({ data: { pollId, seatId, manifesto, slogan: slogan || undefined, bio: bio || undefined } })) as any;
      const candidateId = r?.id;
      if (candidateId && uploads.length > 0) {
        for (const u of uploads) {
          await uploadDoc.mutateAsync({ candidateId, data: { documentName: u.name, documentType: u.type, fileData: u.dataUrl, fileName: u.name } });
        }
      }
      toast.success("Application submitted — awaiting approval");
      setManifesto(""); setSlogan(""); setBio(""); setUploads([]);
      qc.invalidateQueries({ queryKey: getListMyApplicationsQueryKey() });
    } catch (err: any) { toast.error(err?.message ?? "Could not apply"); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Stand for Election</h1>
        <p className="mt-1 text-sm text-muted-foreground">Submit your manifesto and supporting documents to stand as a candidate.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle>New application</CardTitle>
            </div>
            <CardDescription>You can only apply for seats you are eligible to vote on, and only while the application window is open.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Poll</Label>
                <Select value={pollId} onValueChange={setPollId}>
                  <SelectTrigger><SelectValue placeholder="Choose a poll" /></SelectTrigger>
                  <SelectContent>
                    {eligible.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {pollId && (
                <div className={`rounded-lg border px-4 py-3 text-sm flex items-start gap-3 ${canApply ? "border-green-500/40 bg-green-500/10" : "border-destructive/40 bg-destructive/10"}`}>
                  {canApply ? <Clock className="mt-0.5 h-4 w-4 text-green-600 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />}
                  <div>
                    {!settings ? <p className="text-muted-foreground">Checking application window…</p>
                      : canApply ? (
                        <div>
                          <p className="font-semibold text-green-700 dark:text-green-300">Application window is open</p>
                          {remaining !== null && <p className="text-muted-foreground">Closes in: <span className="font-mono font-bold">{formatCountdown(remaining)}</span></p>}
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-destructive">Application window is {isExpired ? "expired" : "closed"}</p>
                          <p className="text-muted-foreground">Please wait for the admin to open the application window.</p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Seat</Label>
                <Select value={seatId} onValueChange={setSeatId} disabled={!pollId || !canApply}>
                  <SelectTrigger><SelectValue placeholder={pollId ? "Choose a seat" : "Pick a poll first"} /></SelectTrigger>
                  <SelectContent>{seats.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Slogan <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Your campaign slogan" disabled={!canApply} maxLength={255} />
              </div>

              <div className="space-y-2">
                <Label>Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief personal background and experience" disabled={!canApply} />
              </div>

              <div className="space-y-2">
                <Label>Manifesto <span className="text-destructive">*</span></Label>
                <Textarea rows={6} required value={manifesto} onChange={(e) => setManifesto(e.target.value)} placeholder="Outline your priorities, what you'll fight for, and how voters can hold you accountable…" disabled={!canApply} />
              </div>

              <div className="space-y-2">
                <Label>Supporting documents & photos</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!canApply} onClick={() => fileInputRef.current?.click()}>
                    <FileText className="h-4 w-4" /> Add document
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!canApply} onClick={() => photoInputRef.current?.click()}>
                    <Image className="h-4 w-4" /> Add photo
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0], "document")} />
                <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0], "photo")} />
                {uploads.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {uploads.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                        {u.type === "photo" ? <Image className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1 truncate">{u.name}</span>
                        <Badge variant="outline" className="text-[10px]">{u.type}</Badge>
                        <button type="button" onClick={() => removeUpload(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={apply.isPending || uploadDoc.isPending || !canApply}>
                {(apply.isPending || uploadDoc.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Submit application
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
                {a.slogan && <p className="mt-1 text-xs italic text-muted-foreground">"{a.slogan}"</p>}
                <p className="mt-2 line-clamp-3 text-xs">{a.manifesto}</p>
                {a.documents?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {a.documents.map((d: any) => (
                      <a key={d.id} href={d.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                        {d.documentType === "photo" ? <Image className="h-3 w-3" /> : <FileText className="h-3 w-3" />} {d.documentName}
                      </a>
                    ))}
                  </div>
                )}
                {a.rejectionReason && (<p className="mt-2 text-xs text-destructive">Reason: {a.rejectionReason}</p>)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
