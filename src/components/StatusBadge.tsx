import { Status, STATUS_LABEL } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const STYLES: Record<Status, string> = {
  open: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  assess: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  waiting: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  doing: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30",
  done: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  qc1: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  qc2: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/30",
  complete: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
};

const DOT_STYLES: Record<Status, string> = {
  open: "bg-sky-500",
  assess: "bg-amber-500",
  waiting: "bg-rose-500",
  doing: "bg-cyan-500",
  done: "bg-orange-500",
  qc1: "bg-violet-500",
  qc2: "bg-fuchsia-500",
  complete: "bg-emerald-500",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border",
        STYLES[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
