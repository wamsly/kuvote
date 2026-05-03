import { useAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Vote, ShieldCheck, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

function Stat({ label, value, Icon, accent }: { label: string; value: number; Icon: any; accent?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-md ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();
  if (isLoading || !data) {
    return <div className="grid gap-4 md:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />)}</div>;
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Electoral Commission Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live overview of voters, candidates and polls.</p>
      </div>
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {([
          { label: "Total voters", value: data.totalVoters, Icon: Users, accent: "bg-primary/10 text-primary" },
          { label: "Active voters", value: data.activeVoters, Icon: ShieldCheck, accent: "bg-chart-3/10 text-chart-3" },
          { label: "Votes cast", value: data.totalVotesCast, Icon: Vote, accent: "bg-chart-5/10 text-chart-5" },
          { label: "Active polls", value: data.activePolls, Icon: BarChart3, accent: "bg-chart-4/10 text-chart-4" },
        ] as const).map((s) => (
          <motion.div key={s.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
            <Stat {...s} />
          </motion.div>
        ))}
      </motion.div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Activity className="h-4 w-4" /><CardTitle>Recent activity</CardTitle></div>
          <CardDescription>Audit trail of the most recent platform events.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          <div className="space-y-2">
            {data.recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                    <span className="text-xs text-muted-foreground">{a.actorEmail ?? "system"}</span>
                  </div>
                  {a.details && <p className="mt-1 text-xs text-muted-foreground">{a.details}</p>}
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
