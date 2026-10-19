import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Pencil,
  UserCheck,
  Sparkles,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Users,
  ShieldAlert,
  Wrench,
  MapPin,
  User,
  Check,
  FileText,
  Phone,
  SlidersHorizontal,
  Bell,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TECHNICIAN_MAP,
  Priority,
  Status,
  timeAgo,
  WorkRequest,
} from "@/lib/mockData";
import { MOCK_TEAM_TECHNICIANS, TeamTechnician } from "@/lib/teamMockData";
import { cn } from "@/lib/utils";

export interface EditWorkOrderPayload {
  requestId: string;
  // Status & Priority
  status: Status;
  priority: Priority;
  statusNote: string;
  // Assignment
  technicianId: string;
  technicianName: string;
  coTechnicianId?: string;
  scheduleType: "urgent" | "scheduled";
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedDuration: string;
  instructions: string;
  notifyLine: boolean;
}

interface EditWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: WorkRequest | null;
  onConfirm: (payload: EditWorkOrderPayload) => void;
}

const DURATION_PRESETS = ["30 นาที", "1 ชั่วโมง", "2 ชั่วโมง", "4 ชั่วโมง", "1 วัน"];

const SAFETY_PRESETS = [
  "⚡ LOTO: ตัดกระแสไฟฟ้าและติดป้ายเตือนก่อนเริ่มงาน",
  "🥽 สวมใส่อุปกรณ์ PPE (แว่นตานิรภัย/ถุงมือกันความร้อน) ครบชุด",
  "📦 กรุณาเบิกอะไหล่สำรองที่คลังชั้น B ก่อนเข้าพื้นที่",
  "📞 ประสานงานหัวหน้ากะฝ่ายผลิตก่อนเริ่มปิดเครื่องจักร",
  "🌡️ ระวังพื้นผิวที่มีอุณหภูมิและความร้อนสูงเกิน 80°C",
];

const DEPT_FILTERS = [
  { id: "all", label: "ทุกแผนก" },
  { id: "elec", label: "งานระบบไฟฟ้า" },
  { id: "mech", label: "งานระบบเครื่องกล" },
  { id: "hvac", label: "ระบบปรับอากาศ" },
  { id: "hyd", label: "ไฮดรอลิก & โลหะ" },
];

const STATUS_OPTIONS: { value: Status; label: string; desc: string; color: string; badgeCls: string }[] = [
  { value: "open", label: "เปิดงาน", desc: "รับเรื่องแจ้งซ่อมใหม่", color: "border-sky-500", badgeCls: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "assess", label: "ประเมินงาน", desc: "ช่างเข้าดูหน้างานและประเมิน", color: "border-indigo-500", badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "waiting", label: "รออะไหล่", desc: "รอจัดซื้อหรือเบิกพาร์ท", color: "border-amber-500", badgeCls: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "doing", label: "กำลังซ่อม", desc: "ช่างกำลังเข้าปฏิบัติงาน", color: "border-cyan-500", badgeCls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { value: "done", label: "ปิดงาน", desc: "ช่างทำงานเสร็จ รอตรวจสอบ", color: "border-teal-500", badgeCls: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "qc1", label: "รอตรวจ QC 1", desc: "ตรวจสอบคุณภาพรอบที่ 1", color: "border-purple-500", badgeCls: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "qc2", label: "รอตรวจ QC 2", desc: "ตรวจสอบคุณภาพรอบที่ 2", color: "border-violet-500", badgeCls: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "complete", label: "เสร็จสิ้น", desc: "ผ่าน QC และปิดงานสมบูรณ์", color: "border-emerald-500", badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; dot: string; badgeCls: string }[] = [
  { value: "critical", label: "วิกฤติ (Critical)", dot: "bg-red-500", badgeCls: "bg-red-50 text-red-700 border-red-200" },
  { value: "high", label: "สูง (High)", dot: "bg-orange-500", badgeCls: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "medium", label: "ปานกลาง (Medium)", dot: "bg-blue-500", badgeCls: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "low", label: "ต่ำ (Low)", dot: "bg-gray-400", badgeCls: "bg-gray-50 text-gray-700 border-gray-200" },
];

export function EditWorkOrderModal({
  isOpen,
  onClose,
  request,
  onConfirm,
}: EditWorkOrderModalProps) {
  if (!isOpen || !request) return null;

  // Active tab state in modal: "all-in-one" | "assign" | "status"
  const [activeTab, setActiveTab] = useState<string>("all-in-one");

  // Form states - Status & Priority
  const [selectedStatus, setSelectedStatus] = useState<Status>(request.status);
  const [selectedPriority, setSelectedPriority] = useState<Priority>(request.priority);
  const [statusNote, setStatusNote] = useState<string>("");

  // Form states - Assignment & Dispatch
  const [selectedTechId, setSelectedTechId] = useState<string>(
    request.assigned_to || "TECH001"
  );
  const [selectedCoTechId, setSelectedCoTechId] = useState<string>("");
  const [scheduleType, setScheduleType] = useState<"urgent" | "scheduled">("urgent");
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [scheduledTime, setScheduledTime] = useState<string>("10:00");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("2 ชั่วโมง");
  const [instructions, setInstructions] = useState<string>("");
  const [notifyLine, setNotifyLine] = useState<boolean>(true);

  // Filters for Technician Picker
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [workloadFilter, setWorkloadFilter] = useState<"all" | "available" | "busy">("all");

  // Re-sync on modal open or request change
  useEffect(() => {
    if (request) {
      setSelectedStatus(request.status);
      setSelectedPriority(request.priority);
      setSelectedTechId(request.assigned_to || "TECH001");
      setSelectedCoTechId("");
      setScheduleType("urgent");
      setInstructions("");
      setStatusNote("");
      setNotifyLine(true);
      setActiveTab("all-in-one");
    }
  }, [request]);

  // Combine rich team technicians with fallback map
  const allTechnicians: TeamTechnician[] = useMemo(() => {
    const list = [...MOCK_TEAM_TECHNICIANS];
    const existingIds = new Set(list.map((t) => t.id));

    Object.entries(TECHNICIAN_MAP).forEach(([id, t]) => {
      if (!existingIds.has(id)) {
        list.push({
          id,
          emp_id: id.replace("TECH", "TEC"),
          name: t.name,
          displayName: t.name.split(" ")[0] || t.name,
          role: t.name.includes("ไฟ")
            ? "ช่างไฟฟ้า"
            : t.name.includes("กล")
            ? "ช่างกล"
            : t.name.includes("แอร์")
            ? "ช่างแอร์"
            : "ช่างซ่อมบำรุง",
          department: t.department || "ฝ่ายซ่อมบำรุง",
          phone: "081-999-8877",
          email: `${id.toLowerCase()}@company.com`,
          status: "online",
          startDate: "1 ม.ค. 2565",
          experienceYears: "2 ปี",
          skills: t.skills || ["ซ่อมบำรุงทั่วไป"],
          avatarColor: "bg-slate-600",
          avatarChar: t.name.charAt(0) || "ช",
          jobsStats: { total: 4, assigned: 1, done: 2, inProgress: 1 },
          categoryStats: { generalRepair: 2, hvac: 1, installation: 1, inspection: 0 },
        });
      }
    });
    return list;
  }, []);

  // Skill matching helper
  const requestCategory = request.category || "other";
  const requestSummary = (request.issue_summary || "").toLowerCase();

  const isSkillMatched = (tech: TeamTechnician): boolean => {
    const skillsText = (tech.skills || []).join(" ").toLowerCase() + " " + tech.role.toLowerCase();
    if (requestCategory === "electrical" || requestCategory === "electrical-control") {
      if (skillsText.includes("ไฟ") || skillsText.includes("mdb") || skillsText.includes("เบรกเกอร์")) return true;
    }
    if (requestCategory === "mechanical") {
      if (skillsText.includes("กล") || skillsText.includes("มอเตอร์") || skillsText.includes("สายพาน")) return true;
    }
    if (skillsText.includes("แอร์") && (requestSummary.includes("แอร์") || requestSummary.includes("เย็น"))) return true;
    if (requestSummary.includes("ไฟ") && skillsText.includes("ไฟ")) return true;
    if (requestSummary.includes("เครื่อง") && skillsText.includes("กล")) return true;
    return false;
  };

  // Filtered technicians
  const filteredTechnicians = useMemo(() => {
    return allTechnicians
      .filter((tech) => {
        const matchSearch =
          searchQuery === "" ||
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchDept = true;
        if (deptFilter === "elec") matchDept = tech.department.includes("ไฟ") || tech.role.includes("ไฟ");
        if (deptFilter === "mech") matchDept = tech.department.includes("กล") || tech.role.includes("กล");
        if (deptFilter === "hvac") matchDept = tech.department.includes("ปรับอากาศ") || tech.role.includes("แอร์") || tech.role.includes("HVAC");
        if (deptFilter === "hyd") matchDept = tech.department.includes("โลหะ") || tech.role.includes("เชื่อม") || tech.role.includes("สุขาภิบาล");

        let matchWorkload = true;
        const activeJobs = tech.jobsStats.inProgress + tech.jobsStats.assigned;
        if (workloadFilter === "available") matchWorkload = activeJobs <= 1;
        if (workloadFilter === "busy") matchWorkload = activeJobs >= 2;

        return matchSearch && matchDept && matchWorkload;
      })
      .sort((a, b) => {
        const aMatch = isSkillMatched(a) ? 1 : 0;
        const bMatch = isSkillMatched(b) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        const aJobs = a.jobsStats.inProgress + a.jobsStats.assigned;
        const bJobs = b.jobsStats.inProgress + b.jobsStats.assigned;
        return aJobs - bJobs;
      });
  }, [allTechnicians, searchQuery, deptFilter, workloadFilter, requestCategory, requestSummary]);

  const selectedTech = allTechnicians.find((t) => t.id === selectedTechId);

  const handleAddPreset = (preset: string) => {
    setInstructions((prev) => {
      if (!prev) return preset;
      if (prev.includes(preset)) return prev;
      return `${prev}\n• ${preset}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTech) return;

    onConfirm({
      requestId: request.request_id,
      status: selectedStatus,
      priority: selectedPriority,
      statusNote,
      technicianId: selectedTech.id,
      technicianName: selectedTech.name,
      coTechnicianId: selectedCoTechId || undefined,
      scheduleType,
      scheduledDate: scheduleType === "scheduled" ? scheduledDate : undefined,
      scheduledTime: scheduleType === "scheduled" ? scheduledTime : undefined,
      estimatedDuration,
      instructions,
      notifyLine,
    });
  };

  const hasStatusChanged = selectedStatus !== request.status;
  const hasPriorityChanged = selectedPriority !== request.priority;

  return typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto cursor-pointer animate-in fade-in duration-200"
          onClick={onClose}
        >
          <Card
            className="w-full max-w-5xl h-[92vh] sm:h-[90vh] max-h-none sm:max-h-[850px] flex flex-col bg-background shadow-2xl rounded-2xl border border-border overflow-hidden cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Top Header (Mobile & iPad Responsive) ── */}
            <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-border bg-card flex items-start justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 border border-primary/20">
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-foreground truncate">
                      แก้ไขใบสั่งซ่อม & ปรับสถานะงาน
                    </h2>
                    <span className="hidden sm:inline-flex text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                      มอบหมาย & ปรับสถานะ
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
                    รวมศูนย์การมอบหมายช่างผู้รับผิดชอบ ปรับระดับความสำคัญ และอัปเดตสถานะงานไว้ในที่เดียว
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* ── Work Order Info Bar (Responsive Grid) ── */}
            <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-muted/40 border-b border-border text-xs shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-xs sm:text-sm text-foreground bg-background px-2 py-0.5 rounded border border-border">
                  {request.request_id}
                </span>
                <Badge variant="outline" className="text-[10px] sm:text-[11px] bg-background">
                  {CATEGORY_LABEL[request.category as keyof typeof CATEGORY_LABEL] || request.category}
                </Badge>
                <span className="text-muted-foreground flex items-center gap-1 text-[11px] sm:text-xs">
                  <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                  <strong>{request.asset_name}</strong> ({request.asset_location})
                </span>
                <span className="text-muted-foreground text-[11px] sm:text-xs truncate max-w-[200px] sm:max-w-none">
                  อาการ: <strong className="text-foreground">{request.issue_summary}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] sm:text-[11px]">
                <span>ผู้แจ้ง: <strong className="text-foreground">{request.reported_by}</strong></span>
                <span>• {timeAgo(request.reported_time)}</span>
              </div>
            </div>

            {/* ── Mode Tabs (Touch-friendly & Clean on Mobile/iPad) ── */}
            <div className="px-3.5 sm:px-5 pt-2 pb-1.5 border-b border-border bg-card shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full sm:max-w-md h-9 bg-muted/70 p-0.5 rounded-lg">
                  <TabsTrigger value="all-in-one" className="text-xs font-medium gap-1 sm:gap-1.5 py-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="hidden sm:inline">รวมทั้งหมด (All-in-One)</span>
                    <span className="sm:hidden text-[11px]">แก้ไขรวม</span>
                  </TabsTrigger>
                  <TabsTrigger value="assign" className="text-xs font-medium gap-1 sm:gap-1.5 py-1">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="hidden sm:inline">มอบหมายช่าง</span>
                    <span className="sm:hidden text-[11px]">ช่าง</span>
                  </TabsTrigger>
                  <TabsTrigger value="status" className="text-xs font-medium gap-1 sm:gap-1.5 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="hidden sm:inline">ปรับสถานะ & ความสำคัญ</span>
                    <span className="sm:hidden text-[11px]">สถานะ</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* ── Main Form Body (Smooth Touch Scrolling) ── */}
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
                {/* TAB 1: ALL-IN-ONE (Responsive Split Grid) */}
                {activeTab === "all-in-one" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
                    {/* Left Column (Status, Priority, Schedule) */}
                    <div className="lg:col-span-5 space-y-3 sm:space-y-3.5">
                      {/* 1. Status Section */}
                      <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            1. สถานะงานปัจจุบัน (Status)
                          </label>
                          {hasStatusChanged && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              เปลี่ยนจาก {STATUS_LABEL[request.status]}
                            </span>
                          )}
                        </div>

                        {/* Status Grid Quick Select */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {STATUS_OPTIONS.map((st) => {
                            const isSelected = selectedStatus === st.value;
                            return (
                              <button
                                key={st.value}
                                type="button"
                                onClick={() => setSelectedStatus(st.value)}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg text-left text-xs border transition-all min-h-[38px]",
                                  isSelected
                                    ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs ring-1 ring-primary/30"
                                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                                )}
                              >
                                <span>{st.label}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Priority Section */}
                      <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            2. ระดับความสำคัญ (Priority)
                          </label>
                          {hasPriorityChanged && (
                            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                              เปลี่ยนจาก {PRIORITY_LABEL[request.priority]}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {PRIORITY_OPTIONS.map((pr) => {
                            const isSelected = selectedPriority === pr.value;
                            return (
                              <button
                                key={pr.value}
                                type="button"
                                onClick={() => setSelectedPriority(pr.value)}
                                className={cn(
                                  "flex flex-col items-center justify-center p-2 rounded-lg text-center text-xs border transition-all min-h-[46px]",
                                  isSelected
                                    ? cn(pr.badgeCls, "font-bold shadow-xs ring-2 ring-primary/20")
                                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                                )}
                              >
                                <span className={cn("h-2 w-2 rounded-full mb-1", pr.dot)} />
                                <span className="text-[11px]">{pr.label.split(" ")[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Schedule & Estimated Time */}
                      <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs">
                        <label className="text-xs font-bold text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            3. แผนการเริ่มงาน & ระยะเวลา
                          </span>
                          <span className="text-[11px] font-semibold text-primary">{estimatedDuration}</span>
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setScheduleType("urgent")}
                            className={cn(
                              "p-2.5 rounded-lg text-xs border text-left transition-all",
                              scheduleType === "urgent"
                                ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                                : "bg-muted/30 border-border text-muted-foreground"
                            )}
                          >
                            <span className="font-semibold block">⚡ ด่วนเริ่มทันที</span>
                            <span className="text-[10px] opacity-80">ASAP เมื่อมอบหมาย</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setScheduleType("scheduled")}
                            className={cn(
                              "p-2.5 rounded-lg text-xs border text-left transition-all",
                              scheduleType === "scheduled"
                                ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                                : "bg-muted/30 border-border text-muted-foreground"
                            )}
                          >
                            <span className="font-semibold block">📅 นัดหมายเวลา</span>
                            <span className="text-[10px] opacity-80">ระบุวันและเวลาเริ่ม</span>
                          </button>
                        </div>

                        {scheduleType === "scheduled" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in">
                            <div>
                              <Label className="text-[11px] text-muted-foreground">วันที่</Label>
                              <Input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="h-9 sm:h-8 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-muted-foreground">เวลา</Label>
                              <Input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="h-9 sm:h-8 text-xs mt-1"
                              />
                            </div>
                          </div>
                        )}

                        <div className="pt-1">
                          <Label className="text-[11px] text-muted-foreground mb-1 block">ประมาณเวลาซ่อม</Label>
                          <div className="flex flex-wrap gap-1">
                            {DURATION_PRESETS.map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                onClick={() => setEstimatedDuration(dur)}
                                className={cn(
                                  "px-2.5 py-1 sm:px-2 sm:py-0.5 rounded text-[11px] border transition-all",
                                  estimatedDuration === dur
                                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                                )}
                              >
                                {dur}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 4. Notes & Audit */}
                      <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          4. บันทึกการแก้ไข / หมายเหตุ (Audit Note)
                        </Label>
                        <Input
                          placeholder="เช่น ปรับสถานะตามการอนุมัติ, มอบหมายช่างเร่งด่วน..."
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          className="h-9 sm:h-8.5 text-xs"
                        />
                      </div>
                    </div>

                    {/* Right Column (Technician Picker & Instructions) */}
                    <div className="lg:col-span-7 space-y-3 sm:space-y-3.5">
                      {/* Primary Technician Picker */}
                      <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                              5. เลือกช่างผู้รับผิดชอบหลัก (Primary Assignee)
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              ระบบแนะนำช่างที่ตรงกับทักษะงานซ่อม ({filteredTechnicians.length} คน)
                            </p>
                          </div>
                          {selectedTech && (
                            <Badge className="bg-blue-600 text-white text-[10px] sm:text-[11px] truncate max-w-[120px] sm:max-w-none">
                              {selectedTech.name}
                            </Badge>
                          )}
                        </div>

                        {/* Search & Filters */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="ค้นหาชื่อช่าง, ทักษะ, หรือรหัส..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="h-9 sm:h-8.5 pl-8 text-xs rounded-md"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={deptFilter}
                              onChange={(e) => setDeptFilter(e.target.value)}
                              className="w-full h-9 sm:h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground shadow-2xs cursor-pointer"
                            >
                              <option value="all">🏢 ทุกแผนกช่าง (All Departments)</option>
                              <option value="elec">⚡ แผนกไฟฟ้า (Electrical)</option>
                              <option value="mech">⚙️ แผนกเครื่องกล (Mechanical)</option>
                              <option value="hvac">❄️ แผนกระบบปรับอากาศ (HVAC)</option>
                              <option value="hyd">🔧 ไฮดรอลิก & โลหะเชื่อม</option>
                            </select>

                            <select
                              value={workloadFilter}
                              onChange={(e) => setWorkloadFilter(e.target.value as any)}
                              className="w-full h-9 sm:h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground shadow-2xs cursor-pointer"
                            >
                              <option value="all">📋 คิวงาน: ทั้งหมด (All)</option>
                              <option value="available">🟢 ว่าง / งานน้อย (≤ 1 งาน)</option>
                              <option value="busy">🟠 ติดงานหลายใบ (≥ 2 งาน)</option>
                            </select>
                          </div>
                        </div>

                        {/* Technician Cards List */}
                        <div className="max-h-[220px] sm:max-h-[260px] overflow-y-auto space-y-2 pr-1">
                          {filteredTechnicians.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                              ไม่พบช่างที่ตรงกับเงื่อนไขการค้นหา
                            </div>
                          ) : (
                            filteredTechnicians.map((tech) => {
                              const isSelected = selectedTechId === tech.id;
                              const isMatched = isSkillMatched(tech);
                              const activeJobs = tech.jobsStats.inProgress + tech.jobsStats.assigned;

                              return (
                                <div
                                  key={tech.id}
                                  onClick={() => setSelectedTechId(tech.id)}
                                  className={cn(
                                    "p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex flex-col gap-1.5",
                                    isSelected
                                      ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                      : "bg-muted/20 border-border hover:bg-muted/50 hover:border-muted-foreground/30"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "h-7 w-7 rounded-full text-white font-bold text-xs grid place-items-center shrink-0",
                                          tech.avatarColor || "bg-blue-600"
                                        )}
                                      >
                                        {tech.avatarChar || tech.name.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-foreground text-xs">{tech.name}</span>
                                          <span className="text-[10px] text-muted-foreground font-mono">({tech.id})</span>
                                          {isMatched && (
                                            <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0 border-amber-200">
                                              ✨ ทักษะตรงสาย
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">{tech.role} • {tech.department}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span
                                        className={cn(
                                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                          activeJobs === 0
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : activeJobs <= 2
                                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                                            : "bg-orange-50 text-orange-700 border border-orange-200"
                                        )}
                                      >
                                        งานค้าง {activeJobs}
                                      </span>
                                      <div
                                        className={cn(
                                          "h-5 w-5 rounded-full border grid place-items-center transition-all",
                                          isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-border text-transparent"
                                        )}
                                      >
                                        ✓
                                      </div>
                                    </div>
                                  </div>

                                  {/* Skills snippet */}
                                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                    <span>ทักษะ:</span>
                                    {tech.skills.slice(0, 3).map((skill) => (
                                      <span key={skill} className="bg-muted px-1.5 py-0.2 rounded text-[9px]">
                                        {skill}
                                      </span>
                                    ))}
                                    {tech.phone && (
                                      <span className="ml-auto flex items-center gap-0.5 text-muted-foreground text-[10px]">
                                        <Phone className="h-2.5 w-2.5" />
                                        {tech.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Co-technician & Safety Presets */}
                      <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-card space-y-3 shadow-2xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                          <div>
                            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                              <Users className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                              ช่างผู้ช่วย (Co-technician - ไม่บังคับ)
                            </Label>
                            <select
                              value={selectedCoTechId}
                              onChange={(e) => setSelectedCoTechId(e.target.value)}
                              className="w-full h-9 sm:h-8.5 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-2xs"
                            >
                              <option value="">-- ปฏิบัติงานคนเดียว --</option>
                              {allTechnicians
                                .filter((t) => t.id !== selectedTechId)
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.role})
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md bg-muted/40 border border-border text-xs">
                              <input
                                type="checkbox"
                                checked={notifyLine}
                                onChange={(e) => setNotifyLine(e.target.checked)}
                                className="rounded text-blue-600 h-3.5 w-3.5"
                              />
                              <span className="text-muted-foreground">
                                ส่งการแจ้งเตือนเข้า <strong>LINE Notify</strong> ทันที
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Safety Instructions */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
                            คำสั่งความปลอดภัย & หมายเหตุช่าง
                          </Label>

                          <div className="flex flex-wrap gap-1">
                            {SAFETY_PRESETS.slice(0, 3).map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleAddPreset(item)}
                                className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors truncate max-w-full text-left"
                              >
                                + {item.slice(0, 28)}...
                              </button>
                            ))}
                          </div>

                          <Textarea
                            placeholder="ระบุข้อควรระวัง LOTO, อุปกรณ์ PPE, หรือข้อสั่งการพิเศษ..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={2}
                            className="text-xs resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ASSIGN ONLY FOCUS */}
                {activeTab === "assign" && (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                            มอบหมายช่างผู้รับผิดชอบงาน
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            เลือกช่างหลัก ช่างผู้ช่วย และแผนการนัดหมายเข้าปฏิบัติงาน
                          </p>
                        </div>
                        {selectedTech && (
                          <Badge className="bg-blue-600 text-white">ช่างปัจจุบัน: {selectedTech.name}</Badge>
                        )}
                      </div>

                      {/* Search */}
                      <Input
                        placeholder="พิมพ์ค้นหาชื่อช่าง, ทักษะ หรือรหัส..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 text-xs"
                      />

                      <div className="max-h-[320px] overflow-y-auto space-y-2">
                        {filteredTechnicians.map((tech) => {
                          const isSelected = selectedTechId === tech.id;
                          return (
                            <div
                              key={tech.id}
                              onClick={() => setSelectedTechId(tech.id)}
                              className={cn(
                                "p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all",
                                isSelected ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20" : "bg-card border-border hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("h-8 w-8 rounded-full text-white font-bold grid place-items-center text-xs", tech.avatarColor || "bg-blue-600")}>
                                  {tech.avatarChar}
                                </div>
                                <div>
                                  <p className="font-semibold">{tech.name} ({tech.id})</p>
                                  <p className="text-muted-foreground text-[11px]">{tech.role} • {tech.department}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">คิวงาน: {tech.jobsStats.inProgress + tech.jobsStats.assigned} ใบ</span>
                                {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: STATUS ONLY FOCUS */}
                {activeTab === "status" && (
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <div className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-4">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          ปรับเปลี่ยนสถานะและความสำคัญของงาน
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          บันทึกสถานะใหม่ พร้อมระบบบันทึก Audit Log โดยอัตโนมัติ
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">สถานะงาน (Status)</Label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value as Status)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label} — {st.desc}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">ระดับความสำคัญ (Priority)</Label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                        >
                          <option value="critical">🔴 วิกฤติ (Critical - เครื่องจักรหยุดฉุกเฉิน)</option>
                          <option value="high">🟠 สูง (High - ส่งผลกระทบต่อไลน์ผลิต)</option>
                          <option value="medium">🔵 ปานกลาง (Medium - สามารถรอรอบซ่อมได้)</option>
                          <option value="low">⚪ ต่ำ (Low - ตรวจสอบทั่วไป)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">เหตุผลในการเปลี่ยนสถานะ / บันทึกประวัติ</Label>
                        <Textarea
                          placeholder="ระบุเหตุผล เช่น ได้รับอะไหล่ครบถ้วนแล้ว, เลื่อนเวลาตามคำขอ..."
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Modal Footer (Pinned Actions with Full Touch Targets on Mobile) ── */}
              <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-border bg-card/95 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 shrink-0">
                <div className="text-xs text-muted-foreground min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-semibold text-foreground text-[11px] sm:text-xs">สรุปการแก้ไข:</span>
                    <Badge variant="outline" className="bg-background text-[10px] sm:text-xs">
                      ช่าง: {selectedTech ? selectedTech.name : "ยังไม่เลือก"}
                    </Badge>
                    <Badge variant="outline" className="bg-background text-[10px] sm:text-xs">
                      สถานะ: {STATUS_LABEL[selectedStatus]}
                    </Badge>
                    <Badge variant="outline" className="bg-background text-[10px] sm:text-xs">
                      ระดับ: {PRIORITY_LABEL[selectedPriority]}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="flex-1 sm:flex-none h-10 sm:h-9 px-3.5 text-xs font-medium rounded-lg"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedTech}
                    size="sm"
                    className="flex-1 sm:flex-none h-10 sm:h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    บันทึกการแก้ไขทั้งหมด
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>,
        document.body
      )
    : null;
}
