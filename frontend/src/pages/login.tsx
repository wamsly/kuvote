import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { useStudentLogin } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const mut = useStudentLogin();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = (await mut.mutateAsync({ data: { identifier, password } })) as any;
      if (r?.token && r?.user) {
        login(r.token, r.user);
        toast.success(`Welcome back, ${r.user.name}`);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not sign in");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-secondary via-background to-background flex flex-col">
      <header className="container mx-auto flex items-center justify-between p-4">
        <Brand />
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/70 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in with your KU student email or registration number.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Registration Number</Label>
                  <Input
                    id="identifier"
                    placeholder="12345.1234@students.ku.ac.ke"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={mut.isPending}>
                  {mut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  Sign in
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link href="/register" className="font-medium text-primary hover:underline">
                    Create an account
                  </Link>
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  Not a student?{" "}
                  <Link href="/admin/login" className="font-medium hover:underline">
                    Admin sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
