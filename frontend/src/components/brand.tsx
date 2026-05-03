import { Vote } from "lucide-react";
import { Link } from "wouter";

export function Brand({ to = "/", small = false }: { to?: string; small?: boolean }) {
  return (
    <Link href={to} className="flex items-center gap-2 group">
      <div className="relative">
        <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Vote className="h-5 w-5" strokeWidth={2.4} />
        </div>
      </div>
      <div className={small ? "text-sm leading-tight" : "text-base leading-tight"}>
        <div className="font-bold tracking-tight">KUVOTE</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          KUSA E-Voting
        </div>
      </div>
    </Link>
  );
}
