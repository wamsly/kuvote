import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Brand } from "../brand";
import { Footer } from "../footer";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  ListChecks,
  PlusSquare,
  Users,
  ShieldCheck,
  BarChart3,
  ScrollText,
  LogOut,
  Menu,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/polls", label: "Polls", icon: ListChecks },
  { href: "/admin/create-poll", label: "Create Poll", icon: PlusSquare },
  { href: "/admin/users", label: "Voters", icon: Users },
  { href: "/admin/candidates", label: "Candidates", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

function SidebarContent({ onClick }: { onClick?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = location === n.href || location.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onClick}
            className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border p-4">
          <Brand small />
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Admin Console
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <div className="px-2 pb-2 text-xs">
            <div className="text-muted-foreground">Signed in as</div>
            <div className="truncate font-medium">{user?.email}</div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="border-b border-border p-4">
                <Brand small />
              </div>
              <SidebarContent onClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-sm font-semibold tracking-wide text-muted-foreground">
            KUSA Electoral Commission Console
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="container mx-auto p-4 md:p-6"
          >
            {children}
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
