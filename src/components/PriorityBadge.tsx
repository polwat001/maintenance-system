import { Priority, PRIORITY_LABEL } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUp, Minus, ChevronDown } from "lucide-react";

const ICONS: Record<Priority, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: ArrowUp,
  medium: Minus,
  low: ChevronDown,
};

const STYLES: Record<Priority, string> = {
  critical: "bg-priority-critical text-white border-priority-critical",
  high: "bg-priority-high text-white border-priority-high",
  medium: "bg-priority-medium text-white border-priority-medium",
  low: "bg-priority-low text-white border-priority-low",
};

interface Props {
  priority: Priority;
  className?: string;
  pulse?: boolean;
}

export function PriorityBadge({ priority, className, pulse }: Props) {
  const Icon = ICONS[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border",
        STYLES[priority],
        pulse && priority === "critical" && "priority-pulse",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
