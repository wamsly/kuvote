import { useMemo, useState } from "react";
import {
  useAdminElectionResultsReport,
  useAdminVoterTurnoutReport,
  useAdminCandidateReport,
  useAdminVoterParticipationReport,
  useAdminRejectedCandidatesReport,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { Download, Printer, Search, Trophy, Users, UserCheck, Activity, XCircle } from "lucide-react";

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<html><head><title>KUVOTE Report</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.print();
}

function DateRangeFilter({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>From</span>
      <Input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="w-36" />
      <span>To</span>
      <Input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="w-36" />
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  disqualified: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Official reports with export and print options.</p>
      </div>
      <Tabs defaultValue="election-results">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="election-results" className="gap-1"><Trophy className="h-3.5 w-3.5" /> Election Results</TabsTrigger>
          <TabsTrigger value="voter-turnout" className="gap-1"><Users className="h-3.5 w-3.5" /> Voter Turnout</TabsTrigger>
          <TabsTrigger value="candidates" className="gap-1"><UserCheck className="h-3.5 w-3.5" /> Candidates</TabsTrigger>
          <TabsTrigger value="participation" className="gap-1"><Activity className="h-3.5 w-3.5" /> Voter Participation</TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1"><XCircle className="h-3.5 w-3.5" /> Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="election-results" className="mt-4"><ElectionResultsReport /></TabsContent>
        <TabsContent value="voter-turnout" className="mt-4"><VoterTurnoutReport /></TabsContent>
        <TabsContent value="candidates" className="mt-4"><CandidateReport /></TabsContent>
        <TabsContent value="participation" className="mt-4"><VoterParticipationReport /></TabsContent>
        <TabsContent value="rejected" className="mt-4"><RejectedCandidatesReport /></TabsContent>
      </Tabs>
    </div>
  );
}

function ElectionResultsReport() {
  const { data, isLoading } = useAdminElectionResultsReport();
  const [pollFilter, setPollFilter] = useState("all");
  const [search, setSearch] = useState("");
  const d = (data as any) ?? {};
  const results = (d.results ?? []) as any[];
  const polls = results.map((r: any) => ({ id: r.pollId, title: r.pollTitle }));

  const filtered = useMemo(() => results.filter((r: any) => {
    if (pollFilter !== "all" && r.pollId !== pollFilter) return false;
    if (search) return r.pollTitle.toLowerCase().includes(search.toLowerCase()) || r.seats.some((s: any) => s.seatLabel.toLowerCase().includes(search.toLowerCase()) || s.candidates.some((c: any) => c.name.toLowerCase().includes(search.toLowerCase())));
    return true;
  }), [results, pollFilter, search]);

  const csvRows = [["Poll", "Seat", "Candidate", "Votes", "Percentage", "Rank", "Winner"]];
  filtered.forEach((r: any) => r.seats.forEach((s: any) => s.candidates.forEach((c: any) => csvRows.push([r.pollTitle, s.seatLabel, c.name, String(c.votes), `${c.percentage}%`, String(c.rank), s.winner?.id === c.id ? "Yes" : "No"]))));

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Election Results Report</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("election-results.csv", csvRows)}><Download className="h-4 w-4" /> CSV</Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => printSection("election-results-content")}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="relative flex-1 min-w-[12rem]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={pollFilter} onValueChange={setPollFilter}><SelectTrigger className="w-48"><SelectValue placeholder="All polls" /></SelectTrigger><SelectContent><SelectItem value="all">All polls</SelectItem>{polls.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground">Generated: {d.generatedAt ? new Date(d.generatedAt).toLocaleString("en-KE", { timeZoneName: "short" }) : "—"}</p>
      </CardHeader>
      <CardContent id="election-results-content">
        {filtered.map((r: any) => (
          <div key={r.pollId} className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-lg font-semibold">{r.pollTitle}</h3>
              <Badge variant="outline" className="uppercase text-[10px]">{r.pollType}</Badge>
              <Badge variant="outline">{r.status}</Badge>
            </div>
            {r.seats.map((s: any) => (
              <div key={s.seatId} className="mb-4 rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{s.seatLabel}</span>
                  <span className="text-xs text-muted-foreground">{s.totalVotes} total votes</span>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead className="text-right">Votes</TableHead><TableHead className="text-right">%</TableHead><TableHead className="text-right">Rank</TableHead><TableHead>Winner</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {s.candidates.sort((a: any, b: any) => b.votes - a.votes).map((c: any) => (
                      <TableRow key={c.id} className={s.winner?.id === c.id ? "bg-primary/5" : ""}>
                        <TableCell className="font-medium">{c.name} {s.winner?.id === c.id && <Trophy className="inline h-3.5 w-3.5 text-primary ml-1" />}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.votes}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.percentage}%</TableCell>
                        <TableCell className="text-right tabular-nums">#{c.rank}</TableCell>
                        <TableCell>{s.winner?.id === c.id ? <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">Winner</Badge> : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No results found.</p>}
      </CardContent>
    </Card>
  );
}

function VoterTurnoutReport() {
  const { data, isLoading } = useAdminVoterTurnoutReport();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const d = (data as any) ?? {};
  const turnout = (d.turnout ?? []) as any[];

  const filtered = useMemo(() => turnout.filter((r: any) => {
    if (search && !r.pollTitle.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(r.startDate) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.endDate) > new Date(dateTo + "T23:59:59Z")) return false;
    return true;
  }), [turnout, search, dateFrom, dateTo]);

  const csvRows = [["Poll", "Status", "Total Registered", "Total Voted", "Turnout %", "Start", "End"], ...filtered.map((r: any) => [r.pollTitle, r.status, String(r.totalRegistered), String(r.totalVoted), `${r.turnoutPercent}%`, r.startDate, r.endDate])];

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Voter Turnout Report</CardTitle>
          <div className="flex gap-2"><Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("voter-turnout.csv", csvRows)}><Download className="h-4 w-4" /> CSV</Button><Button size="sm" variant="outline" className="gap-2" onClick={() => printSection("voter-turnout-content")}><Printer className="h-4 w-4" /> Print</Button></div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="relative flex-1 min-w-[12rem]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search poll…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <DateRangeFilter from={dateFrom} to={dateTo} onFrom={setDateFrom} onTo={setDateTo} />
        </div>
        <p className="text-xs text-muted-foreground">Generated: {d.generatedAt ? new Date(d.generatedAt).toLocaleString("en-KE", { timeZoneName: "short" }) : "—"}</p>
      </CardHeader>
      <CardContent id="voter-turnout-content">
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filtered}>
              <XAxis dataKey="pollTitle" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
              <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="turnoutPercent" name="Turnout %" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Poll</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Registered</TableHead><TableHead className="text-right">Voted</TableHead><TableHead className="text-right">Turnout</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((r: any) => (
              <TableRow key={r.pollId}>
                <TableCell className="font-medium">{r.pollTitle}</TableCell>
                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{r.totalRegistered}</TableCell>
                <TableCell className="text-right tabular-nums">{r.totalVoted}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{r.turnoutPercent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.map((r: any) => r.bySchool?.length > 0 && (
          <div key={r.pollId} className="mt-6">
            <h4 className="mb-2 text-sm font-semibold">{r.pollTitle} — Breakdown by School</h4>
            <Table>
              <TableHeader><TableRow><TableHead>School</TableHead><TableHead className="text-right">Eligible</TableHead><TableHead className="text-right">Voted</TableHead><TableHead className="text-right">Turnout</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.bySchool.map((s: any) => (
                  <TableRow key={s.schoolId}><TableCell>{s.schoolName}</TableCell><TableCell className="text-right tabular-nums">{s.eligible}</TableCell><TableCell className="text-right tabular-nums">{s.voted}</TableCell><TableCell className="text-right tabular-nums">{s.turnoutPercent}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CandidateReport() {
  const { data, isLoading } = useAdminCandidateReport();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pollFilter, setPollFilter] = useState("all");
  const d = (data as any) ?? {};
  const candidates = (d.candidates ?? []) as any[];
  const polls = useMemo(() => [...new Map(candidates.map((c: any) => [c.pollId, { id: c.pollId, title: c.pollTitle }])).values()], [candidates]);

  const filtered = useMemo(() => candidates.filter((c: any) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (pollFilter !== "all" && c.pollId !== pollFilter) return false;
    if (search) { const n = search.toLowerCase(); return c.name.toLowerCase().includes(n) || c.email.toLowerCase().includes(n) || c.seatLabel.toLowerCase().includes(n); }
    return true;
  }), [candidates, statusFilter, pollFilter, search]);

  const csvRows = [["Name", "Email", "Reg No", "Gender", "Course", "Poll", "Seat", "Status", "Slogan", "Submitted", "Reviewed"],...filtered.map((c: any) => [c.name, c.email, c.registrationNumber ?? "", c.gender ?? "", c.courseName ?? "", c.pollTitle, c.seatLabel, c.status, c.slogan ?? "", c.submittedAt, c.reviewedAt ?? ""])];

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Candidate Report</CardTitle>
          <div className="flex gap-2"><Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("candidates.csv", csvRows)}><Download className="h-4 w-4" /> CSV</Button><Button size="sm" variant="outline" className="gap-2" onClick={() => printSection("candidates-content")}><Printer className="h-4 w-4" /> Print</Button></div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="relative flex-1 min-w-[12rem]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search by name, email…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
          <Select value={pollFilter} onValueChange={setPollFilter}><SelectTrigger className="w-48"><SelectValue placeholder="All polls" /></SelectTrigger><SelectContent><SelectItem value="all">All polls</SelectItem>{polls.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground">Generated: {d.generatedAt ? new Date(d.generatedAt).toLocaleString("en-KE", { timeZoneName: "short" }) : "—"} | {filtered.length} records</p>
      </CardHeader>
      <CardContent id="candidates-content">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Reg No</TableHead><TableHead>Gender</TableHead><TableHead>Poll / Seat</TableHead><TableHead>Status</TableHead><TableHead>Slogan</TableHead><TableHead>Documents</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.email}</div></TableCell>
                  <TableCell className="text-xs">{c.registrationNumber ?? "—"}</TableCell>
                  <TableCell className="text-xs capitalize">{c.gender ?? "—"}</TableCell>
                  <TableCell><div className="text-sm">{c.pollTitle}</div><div className="text-xs text-muted-foreground">{c.seatLabel}</div></TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_BADGE[c.status] ?? ""}>{c.status}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[12rem] truncate">{c.slogan ?? "—"}</TableCell>
                  <TableCell className="text-xs">{(c.documents ?? []).length} file(s){(c.documents ?? []).map((d: any) => (<div key={d.id}><a href={d.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{d.documentName}</a></div>))}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(c.submittedAt).toLocaleDateString("en-KE")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function VoterParticipationReport() {
  const { data, isLoading } = useAdminVoterParticipationReport();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const d = (data as any) ?? {};
  const voters = (d.voters ?? []) as any[];

  const filtered = useMemo(() => voters.filter((v: any) => {
    if (genderFilter !== "all" && v.gender !== genderFilter) return false;
    if (search) { const n = search.toLowerCase(); return v.name.toLowerCase().includes(n) || v.email.toLowerCase().includes(n) || (v.registrationNumber ?? "").toLowerCase().includes(n); }
    return true;
  }), [voters, search, genderFilter]);

  const csvRows = [["Name", "Email", "Reg No", "Gender", "Status", "Fee Status", "Polls Voted", "Total Polls", "Participation %", "Registered"], ...filtered.map((v: any) => [v.name, v.email, v.registrationNumber ?? "", v.gender ?? "", v.status, v.feeStatus ?? "", String(v.totalPollsVoted), String(v.totalPolls), `${v.participationRate}%`, v.registeredAt])];

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Voter Participation Report</CardTitle>
          <div className="flex gap-2"><Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("voter-participation.csv", csvRows)}><Download className="h-4 w-4" /> CSV</Button><Button size="sm" variant="outline" className="gap-2" onClick={() => printSection("participation-content")}><Printer className="h-4 w-4" /> Print</Button></div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="relative flex-1 min-w-[12rem]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search voter…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={genderFilter} onValueChange={setGenderFilter}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All genders</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground">Generated: {d.generatedAt ? new Date(d.generatedAt).toLocaleString("en-KE", { timeZoneName: "short" }) : "—"} | {filtered.length} voters | Note: Vote choices are never revealed.</p>
      </CardHeader>
      <CardContent id="participation-content">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Reg No</TableHead><TableHead>Gender</TableHead><TableHead>Status</TableHead><TableHead>Fee</TableHead><TableHead className="text-right">Polls Voted</TableHead><TableHead className="text-right">Participation</TableHead><TableHead>Registered</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell><div className="font-medium">{v.name}</div><div className="text-xs text-muted-foreground">{v.email}</div></TableCell>
                  <TableCell className="text-xs">{v.registrationNumber ?? "—"}</TableCell>
                  <TableCell className="text-xs capitalize">{v.gender ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={v.status === "active" ? "bg-primary/15 text-primary border-primary/30" : ""}>{v.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={v.feeStatus === "cleared" ? "bg-green-500/10 text-green-700 border-green-500/30" : "bg-destructive/10 text-destructive border-destructive/30"}>{v.feeStatus ?? "—"}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{v.totalPollsVoted}/{v.totalPolls}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{v.participationRate}%</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(v.registeredAt).toLocaleDateString("en-KE")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RejectedCandidatesReport() {
  const { data, isLoading } = useAdminRejectedCandidatesReport();
  const [search, setSearch] = useState("");
  const [pollFilter, setPollFilter] = useState("all");
  const d = (data as any) ?? {};
  const rejected = (d.rejected ?? []) as any[];
  const polls = useMemo(() => [...new Map(rejected.map((r: any) => [r.pollId, { id: r.pollId, title: r.pollTitle }])).values()], [rejected]);

  const filtered = useMemo(() => rejected.filter((r: any) => {
    if (pollFilter !== "all" && r.pollId !== pollFilter) return false;
    if (search) { const n = search.toLowerCase(); return r.name.toLowerCase().includes(n) || r.email.toLowerCase().includes(n) || r.positionAppliedFor.toLowerCase().includes(n); }
    return true;
  }), [rejected, search, pollFilter]);

  const csvRows = [["Name", "Email", "Reg No", "Poll", "Position", "Rejection Reason", "Submitted", "Reviewed"], ...filtered.map((r: any) => [r.name, r.email, r.registrationNumber ?? "", r.pollTitle, r.positionAppliedFor, r.rejectionReason, r.submittedAt, r.reviewedAt ?? ""])];

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Rejected Candidates Report</CardTitle>
          <div className="flex gap-2"><Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("rejected-candidates.csv", csvRows)}><Download className="h-4 w-4" /> CSV</Button><Button size="sm" variant="outline" className="gap-2" onClick={() => printSection("rejected-content")}><Printer className="h-4 w-4" /> Print</Button></div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="relative flex-1 min-w-[12rem]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={pollFilter} onValueChange={setPollFilter}><SelectTrigger className="w-48"><SelectValue placeholder="All polls" /></SelectTrigger><SelectContent><SelectItem value="all">All polls</SelectItem>{polls.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground">Generated: {d.generatedAt ? new Date(d.generatedAt).toLocaleString("en-KE", { timeZoneName: "short" }) : "—"} | {filtered.length} records</p>
      </CardHeader>
      <CardContent id="rejected-content">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Poll / Position</TableHead><TableHead>Rejection Reason</TableHead><TableHead>Documents</TableHead><TableHead>Submitted</TableHead><TableHead>Reviewed</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div><div className="text-xs text-muted-foreground">{r.registrationNumber ?? ""}</div></TableCell>
                  <TableCell><div className="text-sm">{r.pollTitle}</div><div className="text-xs text-muted-foreground">{r.positionAppliedFor}</div></TableCell>
                  <TableCell className="text-xs text-destructive max-w-[16rem]">{r.rejectionReason}</TableCell>
                  <TableCell className="text-xs">{(r.documents ?? []).length} file(s)</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.submittedAt).toLocaleDateString("en-KE")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString("en-KE") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
