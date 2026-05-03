import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function RequireStudent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isStudent } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    else if (!isStudent) navigate("/admin/dashboard");
  }, [isAuthenticated, isStudent, navigate]);
  if (!isAuthenticated || !isStudent) return null;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) navigate("/admin/login");
    else if (!isAdmin) navigate("/dashboard");
  }, [isAuthenticated, isAdmin, navigate]);
  if (!isAuthenticated || !isAdmin) return null;
  return <>{children}</>;
}
