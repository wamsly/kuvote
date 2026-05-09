import { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useListSchools,
  useListHostels,
  useRegister,
  useVerifyOtp,
  useResendOtp,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2, ArrowRight, MailCheck, RotateCcw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const EMAIL_REGEX = /^\d{1,6}\.{1,2}\d{4}@students\.ku\.ac\.ke$/;

type PrefillData = {
  exists: boolean;
  feeCleared: boolean;
  feeStatus?: string;
  name?: string;
  gender?: string;
  courseId?: string;
  hostelId?: string;
  alreadyActive?: boolean;
};

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [schoolId, setSchoolId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [hostelId, setHostelId] = useState<string>("");
  const [isResident, setIsResident] = useState<"yes" | "no" | "">("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const schoolsQ = useListSchools();
  const hostelsQ = useListHostels();
  const register = useRegister();
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const schools = (schoolsQ.data ?? []) as Array<any>;
  const hostels = (hostelsQ.data ?? []) as Array<any>;
  const departments = useMemo(
    () => schools.find((s) => s.id === schoolId)?.departments ?? [],
    [schools, schoolId],
  );
  const courses = useMemo(
    () => departments.find((d: any) => d.id === departmentId)?.courses ?? [],
    [departments, departmentId],
  );
  const hostelOptions = useMemo(
    () => (gender ? hostels.filter((h) => h.gender === gender) : hostels),
    [hostels, gender],
  );

  const feeBlocked = prefillData?.exists === true && prefillData.feeCleared === false;

  const handleEmailBlur = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setPrefillData(null);
      return;
    }
    setPrefillLoading(true);
    try {
      const res = await fetch(`/api/auth/prefill?email=${encodeURIComponent(trimmed)}`);
      const data: PrefillData = await res.json();
      setPrefillData(data);
      if (data.exists && !data.alreadyActive) {
        if (data.name) setName(data.name);
        if (data.gender) setGender(data.gender as "male" | "female");
        if (data.courseId) setCourseId(data.courseId);
        if (data.hostelId) {
          setHostelId(data.hostelId);
          setIsResident("yes");
        }
      }
    } catch {
      setPrefillData(null);
    } finally {
      setPrefillLoading(false);
    }
  }, [email]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      toast.error("Email must look like 12345.1234@students.ku.ac.ke");
      return;
    }
    if (feeBlocked) {
      toast.error("Your fee balance is not cleared. Please visit the Finance Office.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!gender || !courseId) {
      toast.error("Please complete all required fields");
      return;
    }
    if (isResident === "yes" && !hostelId) {
      toast.error("Please select your hostel");
      return;
    }
    if (isResident === "") {
      toast.error("Please indicate whether you are a hostel resident");
      return;
    }
    try {
      const r = (await register.mutateAsync({
        data: {
          name,
          email,
          password,
          gender,
          courseId,
          hostelId: isResident === "yes" ? hostelId : undefined,
        } as any,
      })) as any;
      setDevOtpHint(r?.devOtp ?? null);
      toast.success("We sent you a 6-digit verification code");
      setStep("otp");
    } catch (err: any) {
      const code = err?.response?.data?.code ?? err?.code;
      if (code === "FEE_NOT_CLEARED") {
        toast.error("Your fee balance is not cleared. Please visit the Finance Office.");
      } else {
        toast.error(err?.response?.data?.message ?? err?.message ?? "Could not register");
      }
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    try {
      const r = (await verify.mutateAsync({ data: { email, otp: otpCode } })) as any;
      if (r?.token && r?.user) {
        login(r.token, r.user);
        toast.success(`Welcome to KUVOTE, ${r.user.name}`);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Code is invalid or expired");
    }
  };

  const handleResend = async () => {
    try {
      const r = (await resend.mutateAsync({ data: { email } })) as any;
      setDevOtpHint(r?.devOtp ?? null);
      toast.success("New code sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not resend code");
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-background via-background to-secondary/30 flex flex-col">
      <header className="container mx-auto flex items-center justify-between p-4">
        <Brand />
        <ThemeToggle />
      </header>
      <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          {step === "form" ? (
            <Card className="border-border/70 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Create your KUVOTE account</CardTitle>
                <CardDescription>
                  Use your KU students email. You will get a 6-digit verification code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitForm} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">University email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="12345.1234@students.ku.ac.ke"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setPrefillData(null); }}
                          onBlur={handleEmailBlur}
                          className="pr-9"
                        />
                        {prefillLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must follow the official KU students email format.
                      </p>
                    </div>

                    <AnimatePresence>
                      {prefillData?.exists && (
                        <motion.div
                          key="fee-banner"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="md:col-span-2 overflow-hidden"
                        >
                          {feeBlocked ? (
                            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                              <div>
                                <p className="font-semibold text-destructive">Fee balance not cleared</p>
                                <p className="text-muted-foreground mt-0.5">
                                  Your fee status is <span className="font-medium capitalize">{prefillData.feeStatus}</span>. Please visit the Finance Office to clear your balance before registering.
                                </p>
                              </div>
                            </div>
                          ) : prefillData.alreadyActive ? (
                            <div className="flex items-start gap-3 rounded-lg border border-chart-3/40 bg-chart-3/10 px-4 py-3 text-sm">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-chart-3" />
                              <div>
                                <p className="font-semibold">Account already exists</p>
                                <p className="text-muted-foreground mt-0.5">
                                  An account with this email is already registered.{" "}
                                  <Link href="/login" className="font-medium text-primary hover:underline">Sign in instead.</Link>
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                              <div>
                                <p className="font-semibold text-green-700 dark:text-green-300">Fee cleared — eligible to register</p>
                                <p className="text-muted-foreground mt-0.5">
                                  Your details have been pre-filled from our records.
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={feeBlocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={feeBlocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm password</Label>
                      <Input
                        id="confirm"
                        type="password"
                        required
                        minLength={8}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={feeBlocked}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Gender</Label>
                      <RadioGroup
                        value={gender}
                        onValueChange={(v) => {
                          setGender(v as any);
                          setHostelId("");
                        }}
                        className="flex gap-4"
                        disabled={feeBlocked}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="male" id="g-male" />
                          <Label htmlFor="g-male" className="font-normal">Male</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="female" id="g-female" />
                          <Label htmlFor="g-female" className="font-normal">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>School</Label>
                      <Select
                        value={schoolId}
                        onValueChange={(v) => { setSchoolId(v); setDepartmentId(""); setCourseId(""); }}
                        disabled={feeBlocked}
                      >
                        <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                        <SelectContent>
                          {schools.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={departmentId}
                        onValueChange={(v) => { setDepartmentId(v); setCourseId(""); }}
                        disabled={!schoolId || feeBlocked}
                      >
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Course</Label>
                      <Select
                        value={courseId}
                        onValueChange={setCourseId}
                        disabled={!departmentId || feeBlocked}
                      >
                        <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                        <SelectContent>
                          {courses.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.level})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Do you live in a university hostel?</Label>
                      <RadioGroup
                        value={isResident}
                        onValueChange={(v) => {
                          setIsResident(v as any);
                          if (v === "no") setHostelId("");
                        }}
                        className="flex gap-4"
                        disabled={feeBlocked}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="r-yes" />
                          <Label htmlFor="r-yes" className="font-normal">Yes, I live in a hostel</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="r-no" />
                          <Label htmlFor="r-no" className="font-normal">No, I live off-campus</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <AnimatePresence>
                      {isResident === "yes" && (
                        <motion.div
                          key="hostel-select"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 md:col-span-2 overflow-hidden"
                        >
                          <Label>Hostel</Label>
                          <Select value={hostelId} onValueChange={setHostelId} disabled={!gender || feeBlocked}>
                            <SelectTrigger>
                              <SelectValue placeholder={gender ? "Select hostel" : "Pick gender first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {hostelOptions.map((h: any) => (
                                <SelectItem key={h.id} value={h.id}>
                                  {h.name} — {h.zone} zone
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={register.isPending || feeBlocked || prefillData?.alreadyActive}
                  >
                    {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Continue
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Have an account?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/70 shadow-lg">
              <CardHeader>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
                  <MailCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-2xl">Verify your email</CardTitle>
                <CardDescription>
                  Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitOtp} className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {devOtpHint && (
                    <div className="rounded-md border border-dashed border-chart-3/40 bg-chart-3/10 p-3 text-center text-xs text-muted-foreground">
                      Email service not configured. Dev OTP: <span className="font-mono font-bold text-foreground">{devOtpHint}</span>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={verify.isPending}>
                    {verify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and sign in"}
                  </Button>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <button type="button" onClick={() => setStep("form")} className="hover:underline">
                      Edit details
                    </button>
                    <button type="button" onClick={handleResend} className="flex items-center gap-1 hover:underline">
                      <RotateCcw className="h-3 w-3" /> Resend code
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
