import { useState } from "react";
import { useGetProfile, useChangePassword, useGetVotingHistory, getGetVotingHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, KeyRound, History, User, GraduationCap, Home, Banknote, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function Field({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}{label}
      </span>
      <span className="text-sm font-medium">{value ?? <span className="italic text-muted-foreground">Not provided</span>}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-700 border-green-500/30",
    pending_otp: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    disabled: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={styles[status] ?? ""}>{status.replace("_", " ")}</Badge>;
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfile();
  const changePw = useChangePassword();
  const history = useGetVotingHistory({ query: { enabled: false, queryKey: getGetVotingHistoryQueryKey() } });
  const [pwOpen, setPwOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");

  if (isLoading) return <div className="container mx-auto p-8"><div className="h-64 animate-pulse rounded-xl bg-muted/40" /></div>;
  if (!profile) return null;

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirmNext) { toast.error("New passwords do not match"); return; }
    if (next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    try {
      await changePw.mutateAsync({ data: { currentPassword: current, newPassword: next } });
      toast.success("Password changed successfully");
      setCurrent(""); setNext(""); setConfirmNext("");
      setPwOpen(false);
    } catch (err: any) { toast.error(err?.message ?? "Failed to change password"); }
  };

  const isHostelResident = Boolean((profile as any).hostelId);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your registered voter information</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={(profile as any).status} />
          <Badge variant="outline" className="capitalize">{(profile as any).role}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Personal Information</CardTitle>
            </div>
            <CardDescription>Your identity on the ballot register</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Full Name" value={(profile as any).name} />
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gender" value={<span className="capitalize">{(profile as any).gender ?? "Not set"}</span>} />
              <Field label="Reg. Number" value={(profile as any).registrationNumber ?? "Not set"} />
            </div>
            <Separator />
            <Field label="Email Address" value={(profile as any).email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Academic Details</CardTitle>
            </div>
            <CardDescription>Used to determine eligible seats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="School / Faculty" value={(profile as any).schoolName ?? "Not assigned"} />
            <Separator />
            <Field label="Department" value={(profile as any).departmentName ?? "Not assigned"} />
            <Separator />
            <Field label="Course" value={(profile as any).courseName ?? "Not assigned"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Residence</CardTitle>
            </div>
            <CardDescription>Campus accommodation status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Residence Type"
              value={isHostelResident
                ? <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Hostel Resident</Badge>
                : <Badge variant="outline">Off-Campus</Badge>}
            />
            {isHostelResident && (
              <>
                <Separator />
                <Field label="Hostel Name" value={(profile as any).hostelName ?? "—"} />
              </>
            )}
            {!isHostelResident && (
              <p className="text-xs text-muted-foreground">You are registered as a non-hostel / off-campus student. You are eligible to vote in university-wide seats.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Financial Status</CardTitle>
            </div>
            <CardDescription>Fee clearance determines voting eligibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Fee Status"
              value={
                (profile as any).feeStatus === "cleared"
                  ? <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">Cleared</Badge>
                  : <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">{(profile as any).feeStatus ?? "Unknown"}</Badge>
              }
            />
            <Separator />
            <Field
              label="Registration Expires"
              value={(profile as any).registrationExpiresAt
                ? new Date((profile as any).registrationExpiresAt).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })
                : "Not set"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Account & Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Account Status</p>
                <StatusBadge status={(profile as any).status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Role</p>
                <Badge variant="outline" className="capitalize">{(profile as any).role}</Badge>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <Dialog open={pwOpen} onOpenChange={setPwOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 justify-start"><KeyRound className="h-4 w-4" /> Change password</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription>Enter your current password and choose a new one (min 8 characters).</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChange} className="space-y-3">
                    <div><Label htmlFor="cur">Current password</Label><Input id="cur" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
                    <div><Label htmlFor="new">New password</Label><Input id="new" type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} /></div>
                    <div><Label htmlFor="cnf">Confirm new password</Label><Input id="cnf" type="password" required minLength={8} value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} /></div>
                    <Button className="w-full" disabled={changePw.isPending}>
                      {changePw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Sheet open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (o) history.refetch(); }}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 justify-start"><History className="h-4 w-4" /> Voting history</Button>
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
                        <div className="mt-1 text-[11px] text-muted-foreground">{h.votedAt ? new Date(h.votedAt).toLocaleString("en-KE", { timeZoneName: "short" }) : "—"}</div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
