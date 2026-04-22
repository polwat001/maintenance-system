import { Status, STATUS_LABEL } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const STYLES: Record<Status, string> = {
  new: "bg-status-new/10 text-status-new border-status-new/30",
  doing: "bg-status-doing/15 text-status-doing border-status-doing/40",
  waiting: "bg-status-waiting/10 text-status-waiting border-status-waiting/30",
  done: "bg-status-done/10 text-status-done border-status-done/30",
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
      <span className={cn("h-1.5 w-1.5 rounded-full", `bg-status-${status}`)} />
      {STATUS_LABEL[status]}
    </span>
  );
}
