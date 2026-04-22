import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { CATEGORY_LABEL, Status, timeAgo, WorkRequest } from "@/lib/mockData";
import { Clock, MapPin, User, Zap, Wrench, Building2, Droplets, Cpu, Paperclip, Gauge, Waves, CircleHelp } from "lucide-react";

const CATEGORY_ICON = {
  "electrical-control": Zap,
  electrical: Zap,
  mechanical: Wrench,
  "pneumatic-hydraulic": Gauge,
  "lubrication-fluid": Waves,
  other: CircleHelp,
  facility: Building2,
  plumbing: Droplets,
  it: Cpu,
};

interface Props {
  request: WorkRequest;
  onAccept?: (id: string) => void;
  onOpen?: (id: string) => void;
  onChangeStatus?: (id: string, status: Status, actionLabel: string) => void;
  showAccept?: boolean;
  showQuickActions?: boolean;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
}

export function JobCard({
  request,
  onAccept,
  onOpen,
  onChangeStatus,
  showAccept = true,
  showQuickActions = true,
  draggable = false,
  onDragStart,
  onDragEnd,
}: Props) {
  const Icon = CATEGORY_ICON[request.category];
  const isCritical = request.priority === "critical";
  const details = request.request_details;
  const thumbnail = request.attachments.find((attachment) =>
    attachment.mime_type ? attachment.mime_type.startsWith("image/") : attachment.url.startsWith("data:image"),
  )?.url;

  const symptomLabel =
    details?.issue_symptom === "not-working"
      ? "ไม่ทำงาน"
      : details?.issue_symptom === "noise"
      ? "เสียงดัง"
      : details?.issue_symptom === "vibration"
      ? "สั่น"
      : details?.issue_symptom === "error"
      ? "แจ้ง Error"
      : details?.issue_symptom === "other"
      ? "อื่น ๆ"
      : "-";

  const frequencyLabel =
    details?.issue_frequency === "first-time"
      ? "ครั้งแรก"
      : details?.issue_frequency === "repeated"
      ? "เกิดซ้ำ"
      : details?.issue_frequency === "always"
      ? "เกิดตลอด"
      : "-";

  const operabilityLabel =
    details?.machine_operability === "running"
      ? "ยังใช้งานได้"
      : details?.machine_operability === "degraded"
      ? "เริ่มเสื่อมสภาพ"
      : details?.machine_operability === "stopped"
      ? "หยุดทำงาน"
      : "-";

  const machineCode = details?.asset_id || request.asset_name || "-";
  const machineNumber = details?.machine_number || "-";
  const machineZone = details?.machine_zone || request.asset_location || "-";
  const reporterName = details?.reporter_name || request.reported_by || "-";
  const reporterDepartment = details?.reporter_department || request.reported_by_department || "-";
  const issueText = details?.issue_message || request.issue_summary || "-";

  return (
    <Card
      onClick={() => onOpen?.(request.request_id)}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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
          {thumbnail && (
            <img
              src={thumbnail}
              alt={`แนบรูป ${request.request_id}`}
              className="h-28 w-full rounded-md object-cover border"
            />
          )}
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{request.asset_location}</span>
          </div>
          <p className="text-foreground/90 line-clamp-2 leading-snug">
            {request.issue_summary}
          </p>
          {request.attachments.length > 0 && (
            <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              แนบไฟล์ {request.attachments.length}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <DetailMiniGroup title="ข้อมูลเครื่อง">
              <DetailLine label="รหัส/เครื่อง" value={`${machineCode} · ${machineNumber}`} />
              <DetailLine label="โซน" value={machineZone} />
            </DetailMiniGroup>

            <DetailMiniGroup title="ข้อมูลผู้แจ้ง">
              <DetailLine label="ผู้แจ้ง" value={reporterName} />
              <DetailLine label="หน่วยงาน" value={reporterDepartment} />
            </DetailMiniGroup>

            <DetailMiniGroup title="รายละเอียดอาการ">
              <DetailLine label="ข้อความ" value={issueText} />
              <DetailLine label="อาการ" value={symptomLabel} />
              <DetailLine label="ความถี่" value={frequencyLabel} />
              <DetailLine label="สภาพ" value={operabilityLabel} />
            </DetailMiniGroup>
          </div>
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
          {showAccept && request.status === "open" ? (
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

        {showQuickActions && request.status !== "open" && request.status !== "complete" && (
          <div className="grid grid-cols-3 gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus?.(request.request_id, "assess", "ประเมินงาน");
              }}
            >
              ประเมินงาน
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus?.(request.request_id, "waiting", "รออะไหล่");
              }}
            >
              รออะไหล่
            </Button>
            <Button
              size="sm"
              variant="industrial"
              className="h-8 px-2 text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus?.(request.request_id, "done", "ปิดงาน");
              }}
            >
              ปิดงาน
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function DetailMiniGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5 text-[11px] leading-snug">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground/90 break-words line-clamp-2">{value}</span>
    </div>
  );
}
