import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { CATEGORY_LABEL, timeAgo, WorkRequest } from "@/lib/mockData";
import { Clock, MapPin, User, Zap, Wrench, Building2, Droplets, Cpu } from "lucide-react";

const CATEGORY_ICON = {
  electrical: Zap,
  mechanical: Wrench,
  facility: Building2,
  plumbing: Droplets,
  it: Cpu,
};

interface Props {
  request: WorkRequest;
  onAccept?: (id: string) => void;
  onOpen?: (id: string) => void;
  showAccept?: boolean;
}

export function JobCard({ request, onAccept, onOpen, showAccept = true }: Props) {
  const Icon = CATEGORY_ICON[request.category];
  const isCritical = request.priority === "critical";

  return (
    <Card
      onClick={() => onOpen?.(request.request_id)}
      className={`group relative overflow-hidden bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer animate-slide-up border-l-4 ${
        isCritical
          ? "border-l-priority-critical"
          : request.priority === "high"
          ? "border-l-priority-high"
          : request.priority === "medium"
          ? "border-l-priority-medium"
          : "border-l-priority-low"
      }`}
    >
      {isCritical && <div className="absolute inset-x-0 top-0 h-1 industrial-stripe" />}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">{request.request_id}</span>
            </div>
            <h3 className="font-semibold text-foreground mt-1 truncate">
              {request.asset_name}
            </h3>
          </div>
          <PriorityBadge priority={request.priority} pulse />
        </div>

        {/* Body */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{request.asset_location}</span>
          </div>
          <p className="text-foreground/90 line-clamp-2 leading-snug">
            {request.issue_summary}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(request.reported_time)}</span>
          </div>
          <div className="flex items-center gap-1 truncate">
            <User className="h-3 w-3" />
            <span className="truncate">{request.reported_by}</span>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {CATEGORY_LABEL[request.category]}
          </span>
          {showAccept && request.status === "new" ? (
            <Button
              size="sm"
              variant="industrial"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.(request.request_id);
              }}
            >
              รับงานนี้
            </Button>
          ) : (
            <StatusBadge status={request.status} />
          )}
        </div>
      </div>
    </Card>
  );
}
