import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  UserCheck,
  Wrench,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  Phone,
  Search,
  Sparkles,
  ShieldAlert,
  Bell,
  Users,
  Info,
  ChevronRight,
  MapPin,
  Cpu,
  User,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TECHNICIAN_MAP,
  timeAgo,
  WorkRequest,
} from "@/lib/mockData";
import { MOCK_TEAM_TECHNICIANS, TeamTechnician } from "@/lib/teamMockData";
import { cn } from "@/lib/utils";

export interface AssignWorkPayload {
  requestId: string;
  technicianId: string;
  technicianName: string;
  coTechnicianId?: string;
  scheduleType: "urgent" | "scheduled";
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedDuration: string;
  instructions: string;
  notifyLine: boolean;
  autoStart: boolean;
}

interface AssignWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: WorkRequest | null;
  onConfirm: (payload: AssignWorkPayload) => void;
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

export default function AssignWorkModal({
  isOpen,
  onClose,
  request,
  onConfirm,
}: AssignWorkModalProps) {
  if (!isOpen || !request) return null;

  // Selected technician
  const [selectedTechId, setSelectedTechId] = useState<string>(
    request.assigned_to || "TECH001"
  );
  const [selectedCoTechId, setSelectedCoTechId] = useState<string>("");

  // Scheduling
  const [scheduleType, setScheduleType] = useState<"urgent" | "scheduled">("urgent");
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [scheduledTime, setScheduledTime] = useState<string>("10:00");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("2 ชั่วโมง");

  // Instructions
  const [instructions, setInstructions] = useState<string>("");

  // Notification & Execution toggles
  const [notifyLine, setNotifyLine] = useState<boolean>(true);
  const [autoStart, setAutoStart] = useState<boolean>(true);

  // Search & Filtering for technicians
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [workloadFilter, setWorkloadFilter] = useState<"all" | "available" | "busy">("all");

  // Reset or initialize when request changes
  useEffect(() => {
    if (request) {
      setSelectedTechId(request.assigned_to || "TECH001");
      setSelectedCoTechId("");
      setScheduleType("urgent");
      setInstructions("");
      setNotifyLine(true);
      setAutoStart(true);
    }
  }, [request]);

  // Combine rich MOCK_TEAM_TECHNICIANS with any fallback in TECHNICIAN_MAP
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

  // Determine skill match with current request
  const requestCategory = request.category || "general";
  const requestSummary = (request.issue_summary || "").toLowerCase();

  const isSkillMatched = (tech: TeamTechnician): boolean => {
    const skillsText = (tech.skills || []).join(" ").toLowerCase() + " " + tech.role.toLowerCase();
    if (requestCategory === "electrical" && (skillsText.includes("ไฟ") || skillsText.includes("mdb") || skillsText.includes("เบรกเกอร์"))) return true;
    if (requestCategory === "mechanical" && (skillsText.includes("กล") || skillsText.includes("มอเตอร์") || skillsText.includes("สายพาน"))) return true;
    if (requestCategory === "air" && (skillsText.includes("แอร์") || skillsText.includes("hvac") || skillsText.includes("ความเย็น"))) return true;
    if (requestCategory === "hydraulic" && (skillsText.includes("ไฮดรอลิก") || skillsText.includes("ปั๊ม") || skillsText.includes("แรงดัน"))) return true;
    if (requestSummary.includes("ไฟ") && skillsText.includes("ไฟ")) return true;
    if (requestSummary.includes("แอร์") && skillsText.includes("แอร์")) return true;
    if (requestSummary.includes("เครื่อง") && skillsText.includes("กล")) return true;
    return false;
  };

  // Filtered technicians
  const filteredTechnicians = useMemo(() => {
    return allTechnicians.filter((tech) => {
      // Search
      const matchSearch =
        searchQuery === "" ||
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      // Dept Filter
      let matchDept = true;
      if (deptFilter === "elec") matchDept = tech.department.includes("ไฟ") || tech.role.includes("ไฟ");
      if (deptFilter === "mech") matchDept = tech.department.includes("กล") || tech.role.includes("กล");
      if (deptFilter === "hvac") matchDept = tech.department.includes("ปรับอากาศ") || tech.role.includes("แอร์") || tech.role.includes("HVAC");
      if (deptFilter === "hyd") matchDept = tech.department.includes("โลหะ") || tech.role.includes("เชื่อม") || tech.role.includes("สุขาภิบาล");

      // Workload
      let matchWorkload = true;
      const activeJobs = tech.jobsStats.inProgress + tech.jobsStats.assigned;
      if (workloadFilter === "available") matchWorkload = activeJobs <= 1;
      if (workloadFilter === "busy") matchWorkload = activeJobs >= 2;

      return matchSearch && matchDept && matchWorkload;
    }).sort((a, b) => {
      // Prioritize skill matches first
      const aMatch = isSkillMatched(a) ? 1 : 0;
      const bMatch = isSkillMatched(b) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      // Then prioritize available technicians
      const aJobs = a.jobsStats.inProgress + a.jobsStats.assigned;
      const bJobs = b.jobsStats.inProgress + b.jobsStats.assigned;
      return aJobs - bJobs;
    });
  }, [allTechnicians, searchQuery, deptFilter, workloadFilter, requestCategory, requestSummary]);

  const selectedTech = allTechnicians.find((t) => t.id === selectedTechId);

  // Add preset to instructions
  const handleAddPreset = (preset: string) => {
    setInstructions((prev) => {
      if (!prev) return preset;
      if (prev.includes(preset)) return prev;
      return `${prev}\n• ${preset}`;
    });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTech) return;

    onConfirm({
      requestId: request.request_id,
      technicianId: selectedTech.id,
      technicianName: selectedTech.name,
      coTechnicianId: selectedCoTechId || undefined,
      scheduleType,
      scheduledDate: scheduleType === "scheduled" ? scheduledDate : undefined,
      scheduledTime: scheduleType === "scheduled" ? scheduledTime : undefined,
      estimatedDuration,
      instructions,
      notifyLine,
      autoStart,
    });
  };

  const priorityColor =
    request.priority === "critical"
      ? "bg-red-500/10 text-red-600 border-red-200"
      : request.priority === "high"
      ? "bg-amber-500/10 text-amber-700 border-amber-200"
      : "bg-blue-500/10 text-blue-700 border-blue-200";

  return typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-200"
          onClick={onClose}
        >
          <Card
            className="w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col bg-background shadow-2xl rounded-xl border border-border overflow-hidden cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Top Header ── */}
            <div className="px-5 py-4 border-b border-border bg-card flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 grid place-items-center shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      มอบหมายงานซ่อมบำรุง (Work Order Dispatch)
                    </h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Draft Preview
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    เลือกระบุช่างผู้รับผิดชอบ กำหนดเวลาการเริ่มงาน และสั่งการข้อกำหนดความปลอดภัย
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* ── Brief Work Order Banner ── */}
            <div className="px-5 py-3.5 bg-muted/30 border-b border-border text-xs shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">
                    {request.request_id}
                  </span>
                  <Badge variant="outline" className={cn("text-[11px] font-medium", priorityColor)}>
                    {request.priority === "critical" && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
                    )}
                    {PRIORITY_LABEL[request.priority] || request.priority}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] bg-background text-muted-foreground">
                    {CATEGORY_LABEL[request.category as keyof typeof CATEGORY_LABEL] || request.category}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] bg-background text-muted-foreground">
                    สถานะ: {STATUS_LABEL[request.status] || request.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    ผู้แจ้ง: <strong className="text-foreground">{request.reported_by}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(request.reported_time)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-border/50">
                <div className="flex items-start gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">อาการแจ้ง: </span>
                    <strong className="text-foreground font-medium">{request.issue_summary}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="text-muted-foreground">ตำแหน่งเครื่องจักร: </span>
                  <strong className="text-foreground font-medium">
                    {request.asset_name} ({request.asset_location})
                  </strong>
                </div>
              </div>
            </div>

            {/* ── Modal Content: 2-Column Split ── */}
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-3.5 sm:p-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 lg:h-full">
                  {/* ── Left Column (5 Cols): Dispatch Schedule & Safety Parameters ── */}
                  <div className="lg:col-span-5 flex flex-col lg:min-h-0 lg:overflow-y-auto pr-0 lg:pr-1.5 space-y-2.5">
                  {/* Schedule Type */}
                  <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      1. แผนการเริ่มปฏิบัติงาน (Schedule Plan)
                    </label>

                    <Select
                      value={scheduleType}
                      onValueChange={(val) => setScheduleType(val as "urgent" | "scheduled")}
                    >
                      <SelectTrigger aria-label="เลือกแผนการเริ่มงาน" className="w-full h-9 text-xs font-medium shadow-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">⚡ แผนด่วนพิเศษ: เริ่มทันที (Urgent ASAP)</SelectItem>
                        <SelectItem value="scheduled">📅 แผนนัดหมาย: กำหนดวันและเวลาเริ่มงาน (Scheduled)</SelectItem>
                      </SelectContent>
                    </Select>

                    {scheduleType === "scheduled" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in">
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1">วันที่เริ่ม</label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="h-8.5 text-xs rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1">เวลา</label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="h-8.5 text-xs rounded-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estimated Duration */}
                  <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        2. ประมาณการระยะเวลา (Duration)
                      </span>
                      <span className="text-[11px] font-semibold text-primary">{estimatedDuration}</span>
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {DURATION_PRESETS.map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setEstimatedDuration(dur)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs border transition-all font-medium",
                            estimatedDuration === dur
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                          )}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Co-technician (Optional) */}
                  <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-purple-600" />
                        3. ช่างผู้ช่วย (Co-technician - ไม่บังคับ)
                      </span>
                      <span className="text-[10px] text-muted-foreground">สำหรับงาน 2 คน</span>
                    </label>

                    <Select
                      value={selectedCoTechId || "none"}
                      onValueChange={(val) => setSelectedCoTechId(val === "none" ? "" : val)}
                    >
                      <SelectTrigger aria-label="เลือกช่างผู้ช่วย" className="w-full h-9 text-xs shadow-xs">
                        <SelectValue placeholder="-- ไม่มีช่างผู้ช่วย (ปฏิบัติงานคนเดียว) --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- ไม่มีช่างผู้ช่วย (ปฏิบัติงานคนเดียว) --</SelectItem>
                        {allTechnicians
                          .filter((t) => t.id !== selectedTechId)
                          .map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} ({t.role} - {t.department})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Safety & Special Instructions */}
                  <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                      4. คำสั่งพิเศษ & ข้อควรระวังความปลอดภัย
                    </label>

                    <div className="flex flex-wrap gap-1">
                      {SAFETY_PRESETS.slice(0, 3).map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddPreset(item)}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors truncate max-w-full text-left"
                          title="คลิกเพื่อเพิ่มข้อความอัตโนมัติ"
                        >
                          + {item.slice(0, 26)}...
                        </button>
                      ))}
                    </div>

                    <Textarea
                      placeholder="ระบุข้อควรระวัง, หมายเลขอุปกรณ์ความปลอดภัย LOTO หรือคำสั่งการเฉพาะเจาะจง..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>

                  {/* Dispatch Controls */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyLine}
                        onChange={(e) => setNotifyLine(e.target.checked)}
                        className="rounded border-input text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span className="text-muted-foreground">
                        ส่งแจ้งเตือนเข้า <strong>LINE Notify & Mobile Push</strong> ช่างทันที
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoStart}
                        onChange={(e) => setAutoStart(e.target.checked)}
                        className="rounded border-input text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span className="text-muted-foreground">
                        ข้ามการรอกดรับงาน (เริ่มสถานะ <strong>Doing / กำลังดำเนินการ</strong> ทันที)
                      </span>
                    </label>
                  </div>
                </div>

                {/* ── Right Column (7 Cols): Smart Technician Recommendation & Selection ── */}
                <div className="lg:col-span-7 flex flex-col min-h-0 space-y-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        5. เลือกช่างผู้รับผิดชอบหลัก (Primary Assignee)
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        ระบบคัดกรองตามทักษะและปริมาณงานคงเหลือแบบเรียลไทม์
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                      ช่างทั้งหมด {filteredTechnicians.length} คน
                    </Badge>
                  </div>

                  {/* Search and Filters */}
                  <div className="space-y-2 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="ค้นหาชื่อช่าง, ทักษะ, หรือรหัสพนักงาน..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-8 text-xs rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select
                        value={deptFilter}
                        onValueChange={setDeptFilter}
                      >
                        <SelectTrigger aria-label="เลือกแผนกช่าง" className="w-full h-9 text-xs font-medium shadow-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">🏢 ทุกแผนกช่าง (All Departments)</SelectItem>
                          <SelectItem value="elec">⚡ แผนกไฟฟ้า (Electrical)</SelectItem>
                          <SelectItem value="mech">⚙️ แผนกเครื่องกล (Mechanical)</SelectItem>
                          <SelectItem value="hvac">❄️ แผนกระบบปรับอากาศ (HVAC)</SelectItem>
                          <SelectItem value="hyd">🔧 ไฮดรอลิก & โครงสร้างเชื่อม</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={workloadFilter}
                        onValueChange={(val) => setWorkloadFilter(val as any)}
                      >
                        <SelectTrigger aria-label="กรองความพร้อมของช่าง" className="w-full h-9 text-xs font-medium shadow-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">👥 ทุกสถานะความพร้อม</SelectItem>
                          <SelectItem value="available">🟢 ช่างว่าง / งานน้อย (≤ 1 งาน)</SelectItem>
                          <SelectItem value="busy">🟡 กำลังมีงาน (≥ 2 งาน)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Technician Cards List - Fills all remaining height on desktop, min-h on mobile/iPad */}
                  <div className="min-h-[280px] lg:min-h-0 lg:flex-1 space-y-2 overflow-y-auto pr-1">
                    {filteredTechnicians.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                        <p className="text-xs">ไม่พบช่างที่ตรงกับเงื่อนไขการค้นหา</p>
                      </div>
                    ) : (
                      filteredTechnicians.map((tech) => {
                        const isSelected = selectedTechId === tech.id;
                        const isMatched = isSkillMatched(tech);
                        const activeJobs = tech.jobsStats.inProgress + tech.jobsStats.assigned;
                        const isAvailable = activeJobs <= 1;

                        return (
                          <div
                            key={tech.id}
                            onClick={() => setSelectedTechId(tech.id)}
                            className={cn(
                              "relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2",
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500 shadow-xs"
                                : "border-border hover:border-border hover:bg-muted/40 bg-card"
                            )}
                          >
                            {/* Card Top: Avatar, Name, Workload */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                {/* Avatar */}
                                <div className="relative">
                                  <div
                                    className={cn(
                                      "h-9 w-9 rounded-full grid place-items-center text-white font-bold text-xs shrink-0 shadow-xs",
                                      tech.avatarColor || "bg-blue-600"
                                    )}
                                  >
                                    {tech.avatarChar || tech.name.charAt(0)}
                                  </div>
                                  <span
                                    className={cn(
                                      "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-background",
                                      isAvailable ? "bg-emerald-500" : "bg-amber-500"
                                    )}
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-foreground leading-tight">
                                      {tech.name}
                                    </p>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      ({tech.id})
                                    </span>
                                    {isMatched && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        ตรงสายงาน
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {tech.role} • {tech.department}
                                  </p>
                                </div>
                              </div>

                              {/* Workload Badge */}
                              <div className="text-right shrink-0">
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block",
                                    activeJobs === 0
                                      ? "bg-emerald-100 text-emerald-800"
                                      : activeJobs === 1
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  )}
                                >
                                  {activeJobs === 0
                                    ? "ว่าง (0 งาน)"
                                    : `กำลังทำ ${activeJobs} งาน`}
                                </span>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  เสร็จแล้ว {tech.jobsStats.done} งาน
                                </div>
                              </div>
                            </div>

                            {/* Skills Tag Cloud */}
                            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40">
                              <span className="text-[10px] text-muted-foreground mr-1">
                                ทักษะ:
                              </span>
                              {tech.skills.slice(0, 3).map((skill) => {
                                const isSkillHighlight =
                                  (requestCategory === "electrical" && skill.includes("ไฟ")) ||
                                  (requestCategory === "mechanical" && skill.includes("กล")) ||
                                  (requestCategory === "hvac" && skill.includes("แอร์"));

                                return (
                                  <span
                                    key={skill}
                                    className={cn(
                                      "text-[9px] px-1.5 py-0.2 rounded font-sans",
                                      isSkillHighlight
                                        ? "bg-blue-100 text-blue-800 font-semibold border border-blue-200"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {skill}
                                  </span>
                                );
                              })}
                              {tech.phone && (
                                <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
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
              </div>
            </div>

            {/* ── Bottom Summary & Actions (Pinned at bottom) ── */}
            <div className="px-4 sm:px-5 py-3 border-t border-border bg-card/95 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <div className="text-xs text-muted-foreground min-w-0">
                {selectedTech ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] grid place-items-center shrink-0">
                      ✓
                    </div>
                    <p className="text-[11px] sm:text-xs truncate">
                      มอบหมายให้:{" "}
                      <strong className="text-foreground">{selectedTech.name}</strong>{" "}
                      ({selectedTech.role}) •{" "}
                      <span className="text-blue-600 font-medium">
                        {scheduleType === "urgent" ? "เริ่มทันที" : `นัดหมาย ${scheduledDate} ${scheduledTime}`}
                      </span>{" "}
                      • คาดการณ์ {estimatedDuration}
                    </p>
                  </div>
                ) : (
                  <span className="text-red-500 text-xs">กรุณาเลือกช่างผู้รับผิดชอบ</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="flex-1 sm:flex-none h-9 px-3.5 text-xs font-medium rounded-md"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedTech}
                  size="sm"
                  className="flex-1 sm:flex-none h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="h-4 w-4" />
                  ยืนยันมอบหมายงาน
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
