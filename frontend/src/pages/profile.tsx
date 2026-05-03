import { useState } from "react";
import { useGetProfile, useChangePassword, useGetVotingHistory, getGetVotingHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, KeyRound, History } from "lucide-react";
import { toast } from "sonner";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfile();
  const changePw = useChangePassword();
  const history = useGetVotingHistory({ query: { enabled: false, queryKey: getGetVotingHistoryQueryKey() } });
  const [pwOpen, setPwOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  if (isLoading) return <div className="container mx-auto p-8"><div className="h-64 animate-pulse rounded-xl bg-muted/40" /></div>;
  if (!profile) return null;

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changePw.mutateAsync({ data: { currentPassword: current, newPassword: next } });
      toast.success("Password changed");
      setCurrent(""); setNext("");
      setPwOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to change password");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your registered voter information</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 capitalize">{profile.status}</Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal</CardTitle>
            <CardDescription>How you appear on the ballot register.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Name" value={profile.name} />
            <Field label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "—"} />
            <Field label="Email" value={profile.email} />
            <Field label="Reg. Number" value={profile.registrationNumber} />
            <Field label="Fee Status" value={<span className="capitalize">{profile.feeStatus}</span>} />
            <Field label="Registration Expires" value={profile.registrationExpiresAt ? new Date(profile.registrationExpiresAt).toLocaleDateString() : "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Academics & Residence</CardTitle>
            <CardDescription>Used to determine which seats you may vote on.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="School" value={profile.schoolName} />
            <Field label="Department" value={profile.departmentName} />
            <Field label="Course" value={<span className="md:col-span-2 inline">{profile.courseName}</span>} />
            <Field label="Hostel" value={profile.hostelName} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Dialog open={pwOpen} onOpenChange={setPwOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><KeyRound className="h-4 w-4" /> Change password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change password</DialogTitle>
                  <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChange} className="space-y-3">
                  <div>
                    <Label htmlFor="cur">Current password</Label>
                    <Input id="cur" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
                  </div>
                  <Button className="w-full" disabled={changePw.isPending}>
                    {changePw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Sheet open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (o) history.refetch(); }}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2"><History className="h-4 w-4" /> Voting history</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-96">
                <SheetHeader>
                  <SheetTitle>Voting history</SheetTitle>
                  <SheetDescription>Polls and seats you have voted on. Your actual choices remain secret.</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  {history.isFetching && <div className="text-sm text-muted-foreground">Loading…</div>}
                  {!history.isFetching && (history.data ?? []).length === 0 && <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No votes recorded yet.</div>}
                  {(history.data ?? []).map((h: any, i: number) => (
                    <div key={i} className="rounded-md border border-border p-3">
                      <div className="text-sm font-medium">{h.pollTitle}</div>
                      <div className="text-xs text-muted-foreground">{h.seatLabel}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{h.votedAt ? new Date(h.votedAt).toLocaleString() : "—"}</div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
