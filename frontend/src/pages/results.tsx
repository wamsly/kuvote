import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useGetPollResults, getGetPollResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ReTooltip, Cell } from "recharts";
import { Crown, Download } from "lucide-react";
import { motion } from "framer-motion";

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 800;
    const from = 0;
    const tick = (t: number) => {
      const e = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - e, 3);
      setN(Math.round(from + (value - from) * eased));
      if (e < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className="tabular-nums">{n}</span>;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPage() {
  const [, params] = useRoute<{ pollId: string }>("/results/:pollId");
  const pollId = params?.pollId ?? "";
  const { data, isLoading } = useGetPollResults(pollId, {
    query: { enabled: Boolean(pollId), queryKey: getGetPollResultsQueryKey(pollId) },
  });

  if (isLoading) return <div className="container mx-auto p-8"><div className="h-64 animate-pulse rounded-xl bg-muted/40" /></div>;
  if (!data) return <div className="container mx-auto p-8 text-center text-muted-foreground">Results unavailable</div>;
  const results = data as any;
  const poll = results.poll ?? results;
  const seats = (results.seats ?? []) as any[];

  const handleDownload = () => {
    const rows: string[][] = [["Seat", "Candidate", "Votes"]];
    for (const s of seats) {
      for (const c of s.candidates) rows.push([s.label ?? s.seatLabel, c.name, String(c.votes)]);
    }
    downloadCsv(`${poll.title.replace(/\s+/g, "-")}-results.csv`, rows);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{poll.status}</Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{poll.title} — Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(poll.startDate).toLocaleString()} → {new Date(poll.endDate).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>
      <div className="grid gap-6">
        {seats.map((seat: any, idx: number) => {
          const sorted = [...seat.candidates].sort((a, b) => b.votes - a.votes);
          const max = Math.max(1, ...sorted.map((c) => c.votes));
          return (
            <motion.div key={seat.seatId ?? seat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx * 0.05 }}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <CardTitle>{seat.label ?? seat.seatLabel}</CardTitle>
                      <CardDescription>
                        {seat.totalVotes} vote{seat.totalVotes === 1 ? "" : "s"} cast
                      </CardDescription>
                    </div>
                    {seat.winnerId && (
                      <Badge className="bg-primary/15 text-primary border-primary/30" variant="outline">
                        <Crown className="mr-1 h-3 w-3" /> Winner: {sorted[0]?.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sorted}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <ReTooltip
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                        <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                          {sorted.map((c) => (
                            <Cell key={c.id} fill={c.id === seat.winnerId ? "hsl(var(--primary))" : "hsl(var(--chart-2))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {sorted.map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <div className="w-44 truncate text-sm font-medium">
                          {c.id === seat.winnerId && <Crown className="mr-1 inline h-3.5 w-3.5 text-primary" />}
                          {c.name}
                        </div>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.votes / max) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 ${c.id === seat.winnerId ? "bg-primary" : "bg-chart-2"}`}
                          />
                        </div>
                        <div className="w-16 text-right text-sm font-semibold tabular-nums">
                          <CountUp value={c.votes} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
