import { useAdminReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { Download } from "lucide-react";

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const { data, isLoading } = useAdminReports();
  if (isLoading || !data) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  }
  const d = data as any;
  const vr = (d.voterRegistration ?? []) as any[];
  const cr = (d.candidateRegistration ?? []) as any[];
  const pp = (d.participation ?? []) as any[];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Insights into voter registration, candidate counts and participation.</p>
      </div>
      <Tabs defaultValue="voter">
        <TabsList>
          <TabsTrigger value="voter">Voter Registration</TabsTrigger>
          <TabsTrigger value="candidate">Candidates</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
        </TabsList>
        <TabsContent value="voter" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Voters by school</CardTitle>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("voter-registration.csv", [["School", "Registered Voters"], ...vr.map((r) => [r.schoolName, String(r.registeredVoters)])])}>
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vr}>
                    <XAxis dataKey="schoolName" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="registeredVoters" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>School</TableHead><TableHead className="text-right">Registered Voters</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vr.map((r, i) => <TableRow key={i}><TableCell>{r.schoolName}</TableCell><TableCell className="text-right tabular-nums">{r.registeredVoters}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="candidate" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Candidates per poll</CardTitle>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("candidate-registration.csv", [["Poll", "Candidates"], ...cr.map((r) => [r.pollTitle, String(r.candidates)])])}>
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Poll</TableHead><TableHead className="text-right">Candidates</TableHead></TableRow></TableHeader>
                <TableBody>
                  {cr.map((r, i) => <TableRow key={i}><TableCell>{r.pollTitle}</TableCell><TableCell className="text-right tabular-nums">{r.candidates}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="participation" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Voter participation</CardTitle>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadCsv("participation.csv", [["Poll", "Eligible", "Voted", "Turnout %"], ...pp.map((r) => [r.pollTitle, String(r.eligibleVoters), String(r.votersWhoVoted), String(r.turnoutPercent)])])}>
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pp}>
                    <XAxis dataKey="pollTitle" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
                    <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="turnoutPercent" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Poll</TableHead><TableHead className="text-right">Eligible</TableHead><TableHead className="text-right">Voted</TableHead><TableHead className="text-right">Turnout</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pp.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.pollTitle}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.eligibleVoters}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.votersWhoVoted}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.turnoutPercent}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
