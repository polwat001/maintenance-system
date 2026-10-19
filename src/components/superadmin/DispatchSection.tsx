import React, { useState, useMemo } from "react";
import {
  UserCheck,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Phone,
  Sparkles,
  Zap,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TECHNICIAN_MAP,
  timeAgo,
  WorkRequest,
  MOCK_REQUESTS,
} from "@/lib/mockData";
import { MOCK_TEAM_TECHNICIANS, TeamTechnician } from "@/lib/teamMockData";
import { cn } from "@/lib/utils";
import AssignWorkModal, { AssignWorkPayload } from "./AssignWorkModal";

interface DispatchSectionProps {
  onNavigateToWorkOrders?: () => void;
  onSwitchToTableView?: () => void;
  totalRequestsCount?: number;
}

export default function DispatchSection({
  onNavigateToWorkOrders,
  onSwitchToTableView,
  totalRequestsCount,
}: DispatchSectionProps) {
  const [requests, setRequests] = useState<WorkRequest[]>(() => [...MOCK_REQUESTS]);
  const [activeModalReq, setActiveModalReq] = useState<WorkRequest | null>(null);

  // Search & Filters for Queue
  const [queueSearch, setQueueSearch] = useState("");
  const [queueCategory, setQueueCategory] = useState("all");
  const [queuePriority, setQueuePriority] = useState("all");

  // Search & Filters for Technicians
  const [techSearch, setTechSearch] = useState("");
  const [techDept, setTechDept] = useState("all");
  const [techStatus, setTechStatus] = useState<"all" | "available" | "busy">("all");

  // Active unassigned or open requests
  const pendingQueue = useMemo(() => {
    return requests.filter((r) => {
      const isPending = !r.assigned_to || r.status === "open" || r.status === "assess";
      const matchSearch =
        queueSearch === "" ||
        r.request_id.toLowerCase().includes(queueSearch.toLowerCase()) ||
        r.issue_summary.toLowerCase().includes(queueSearch.toLowerCase()) ||
        r.asset_name.toLowerCase().includes(queueSearch.toLowerCase()) ||
        r.asset_location.toLowerCase().includes(queueSearch.toLowerCase());

      const matchCat = queueCategory === "all" || r.category === queueCategory;
      const matchPri = queuePriority === "all" || r.priority === queuePriority;

      return isPending && matchSearch && matchCat && matchPri;
    }).sort((a, b) => {
      // Critical first, then High, etc.
      const pMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    });
  }, [requests, queueSearch, queueCategory, queuePriority]);

  // Active / Doing requests
  const activeDispatched = useMemo(() => {
    return requests.filter((r) => r.status === "doing" || r.status === "waiting");
  }, [requests]);

  // Combine technicians
  const technicians: TeamTechnician[] = useMemo(() => {
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

  // Filtered technicians
  const filteredTechnicians = useMemo(() => {
    return technicians.filter((t) => {
      const matchSearch =
        techSearch === "" ||
        t.name.toLowerCase().includes(techSearch.toLowerCase()) ||
        t.role.toLowerCase().includes(techSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(techSearch.toLowerCase());

      let matchDept = true;
      if (techDept === "elec") matchDept = t.department.includes("ไฟ") || t.role.includes("ไฟ");
      if (techDept === "mech") matchDept = t.department.includes("กล") || t.role.includes("กล");
      if (techDept === "hvac") matchDept = t.department.includes("ปรับอากาศ") || t.role.includes("แอร์");

      const activeJobs = t.jobsStats.inProgress + t.jobsStats.assigned;
      let matchStatus = true;
      if (techStatus === "available") matchStatus = activeJobs <= 1;
      if (techStatus === "busy") matchStatus = activeJobs >= 2;

      return matchSearch && matchDept && matchStatus;
    });
  }, [technicians, techSearch, techDept, techStatus]);

  // Overall KPIs
  const stats = useMemo(() => {
    const pendingCount = requests.filter((r) => !r.assigned_to || r.status === "open").length;
    const doingCount = requests.filter((r) => r.status === "doing").length;
    const availableTechs = technicians.filter(
      (t) => t.jobsStats.inProgress + t.jobsStats.assigned <= 1
    ).length;
    const criticalPending = requests.filter(
      (r) => (!r.assigned_to || r.status === "open") && r.priority === "critical"
    ).length;

    return { pendingCount, doingCount, availableTechs, criticalPending };
  }, [requests, technicians]);

  // Handle assignment completion
  const handleConfirmAssignment = (payload: AssignWorkPayload) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === payload.requestId
          ? {
              ...r,
              assigned_to: payload.technicianId,
              status: payload.autoStart ? "doing" : "open",
            }
          : r
      )
    );

    toast.success(
      `มอบหมายงาน ${payload.requestId} ให้ช่าง ${payload.technicianName} สำเร็จ (${
        payload.scheduleType === "urgent" ? "เริ่มทันที" : `นัดหมาย ${payload.scheduledDate}`
      })`
    );

    setActiveModalReq(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Top Header & KPI Summary ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left Side: Back Button + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onNavigateToWorkOrders && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToWorkOrders}
              className="h-9 px-2.5 sm:px-3 text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0 shadow-xs"
              title="ย้อนกลับไปหน้ารายการงานซ่อม"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">ย้อนกลับ</span>
            </Button>
          )}

          <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-600 grid place-items-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold flex items-center gap-2 text-foreground truncate">
              ศูนย์จ่ายงานและมอบหมายช่าง (Job Dispatch Center)
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              จัดสรรงานตามความเชี่ยวชาญ บริหารจัดการคิวงานซ่อม และติดตามภาระงานทีมช่าง
            </p>
          </div>
        </div>

        {/* Right Side: Toggle Buttons (ตำแหน่งเดิม) + Reset Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          {onSwitchToTableView && (
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border">
              <button
                type="button"
                onClick={onSwitchToTableView}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ตารางงานซ่อมทั้งหมด</span>
                <span className="sm:hidden">ตารางงาน</span> {totalRequestsCount !== undefined ? `(${totalRequestsCount})` : ""}
              </button>
              <button
                type="button"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 bg-blue-600 text-white shadow-xs"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">หน้ากระดานมอบหมายงาน</span>
                <span className="sm:hidden">กระดานจ่ายงาน</span>
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRequests([...MOCK_REQUESTS])}
            className="text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">รีเซ็ตข้อมูล</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-3.5 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
              คิวงานรอมอบหมาย
            </p>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">
              {stats.pendingCount}
            </p>
            <p className="text-[10px] text-muted-foreground">ยังไม่มีช่างรับผิดชอบ</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
            <Clock className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
              งานวิกฤติรอด่วน
            </p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">
              {stats.criticalPending}
            </p>
            <p className="text-[10px] text-muted-foreground">ต้องจ่ายงานทันที</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-100 text-red-600 grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
              กำลังดำเนินการ (Doing)
            </p>
            <p className="text-2xl font-bold text-blue-600 tabular-nums">
              {stats.doingCount}
            </p>
            <p className="text-[10px] text-muted-foreground">ช่างกำลังปฏิบัติงาน</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 grid place-items-center">
            <Wrench className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
              ช่างพร้อมรับงาน
            </p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">
              {stats.availableTechs} / {technicians.length}
            </p>
            <p className="text-[10px] text-muted-foreground">มีงานว่าง หรือ &le; 1 งาน</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
            <Users className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* ── Main Dispatch Workspace: 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column (7 Cols): Pending Work Order Dispatch Queue ── */}
        <div className="lg:col-span-7 space-y-3.5">
          <Card className="p-4 border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-bold text-sm text-foreground">
                  คิวงานที่รอมอบหมาย (Dispatch Queue)
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {pendingQueue.length} รายการ
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                เรียงตาม: <strong className="text-foreground">ความสำคัญ & ความเร่งด่วน</strong>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3">
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาตามรหัสงาน, อาการแจ้ง, เครื่องจักร..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="h-9 pl-8 text-xs rounded-md"
                />
              </div>

              <div className="sm:col-span-3">
                <Select
                  value={queueCategory}
                  onValueChange={setQueueCategory}
                >
                  <SelectTrigger aria-label="กรองตามหมวดหมู่" className="w-full h-9 text-xs font-medium shadow-xs">
                    <SelectValue placeholder="📁 ทุกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📁 ทุกหมวดหมู่</SelectItem>
                    {Object.entries(CATEGORY_LABEL).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-3">
                <Select
                  value={queuePriority}
                  onValueChange={setQueuePriority}
                >
                  <SelectTrigger aria-label="กรองตามความสำคัญ" className="w-full h-9 text-xs font-medium shadow-xs">
                    <SelectValue placeholder="⚡ ทุกความสำคัญ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">⚡ ทุกความสำคัญ</SelectItem>
                    {Object.entries(PRIORITY_LABEL).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cards Queue List */}
            <div className="space-y-3 mt-4 max-h-[580px] overflow-y-auto pr-1">
              {pendingQueue.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-semibold text-foreground">
                    ไม่มีงานค้างที่รอมอบหมาย
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    งานทั้งหมดได้รับการจ่ายให้ช่างผู้รับผิดชอบเรียบร้อยแล้ว
                  </p>
                </div>
              ) : (
                pendingQueue.map((req) => {
                  const isCritical = req.priority === "critical";
                  const isHigh = req.priority === "high";

                  return (
                    <div
                      key={req.request_id}
                      className={cn(
                        "p-4 rounded-xl border bg-card transition-all hover:shadow-sm space-y-3",
                        isCritical
                          ? "border-red-300 dark:border-red-900 bg-red-50/20"
                          : isHigh
                          ? "border-amber-300 dark:border-amber-900 bg-amber-50/20"
                          : "border-border"
                      )}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded">
                            {req.request_id}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold",
                              isCritical
                                ? "bg-red-500/10 text-red-600 border-red-200"
                                : isHigh
                                ? "bg-amber-500/10 text-amber-700 border-amber-200"
                                : "bg-blue-500/10 text-blue-700 border-blue-200"
                            )}
                          >
                            {isCritical && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-ping" />
                            )}
                            {PRIORITY_LABEL[req.priority] || req.priority}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-background text-muted-foreground"
                          >
                            {CATEGORY_LABEL[req.category as keyof typeof CATEGORY_LABEL] || req.category}
                          </Badge>
                        </div>

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          แจ้งเมื่อ {timeAgo(req.reported_time)}
                        </span>
                      </div>

                      {/* Issue summary & location */}
                      <div>
                        <h4 className="font-bold text-sm text-foreground leading-snug">
                          {req.issue_summary}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-amber-600" />
                            {req.asset_name} ({req.asset_location})
                          </span>
                          <span>•</span>
                          <span>ผู้แจ้ง: {req.reported_by}</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          {req.assigned_to ? (
                            <span className="text-muted-foreground">
                              ช่างเดิม:{" "}
                              <strong className="text-foreground">
                                {TECHNICIAN_MAP[req.assigned_to]?.name || req.assigned_to}
                              </strong>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <Sparkles className="h-3 w-3" />
                              รอมอบหมายช่างผู้รับผิดชอบ
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => setActiveModalReq(req)}
                          className="h-8.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 self-end sm:self-auto rounded-lg"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{req.assigned_to ? "เปลี่ยนช่างที่รับผิดชอบ" : "มอบหมายงานนี้"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* ── Right Column (5 Cols): Technician Availability & Workload Matrix ── */}
        <div className="lg:col-span-5 space-y-3.5">
          <Card className="p-4 border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  สถานะความพร้อมทีมช่าง (Technicians)
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {filteredTechnicians.length} คน
              </Badge>
            </div>

            {/* Filter Bar */}
            <div className="space-y-2 pt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อช่าง หรือ รหัส..."
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  className="h-9 pl-8 text-xs rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={techDept}
                  onValueChange={setTechDept}
                >
                  <SelectTrigger aria-label="เลือกแผนกช่าง" className="w-full h-9 text-xs font-medium shadow-xs">
                    <SelectValue placeholder="🏢 ทุกแผนกช่าง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏢 ทุกแผนกช่าง</SelectItem>
                    <SelectItem value="elec">⚡ แผนกไฟฟ้า</SelectItem>
                    <SelectItem value="mech">⚙️ แผนกเครื่องกล</SelectItem>
                    <SelectItem value="hvac">❄️ แผนกระบบปรับอากาศ</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={techStatus}
                  onValueChange={(val) => setTechStatus(val as any)}
                >
                  <SelectTrigger aria-label="เลือกสถานะความพร้อมช่าง" className="w-full h-9 text-xs font-medium shadow-xs">
                    <SelectValue placeholder="👥 ทุกสถานะงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">👥 ทุกสถานะงาน</SelectItem>
                    <SelectItem value="available">🟢 ช่างว่าง (≤ 1 งาน)</SelectItem>
                    <SelectItem value="busy">🟡 กำลังมีงาน (≥ 2 งาน)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Technician Cards List */}
            <div className="space-y-2.5 mt-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredTechnicians.map((t) => {
                const activeJobs = t.jobsStats.inProgress + t.jobsStats.assigned;
                const isAvailable = activeJobs <= 1;

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-border bg-card space-y-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-full grid place-items-center text-white font-bold text-xs shrink-0",
                              t.avatarColor || "bg-blue-600"
                            )}
                          >
                            {t.avatarChar || t.name.charAt(0)}
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
                            <span className="text-xs font-bold text-foreground">{t.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              ({t.id})
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {t.role} • {t.department}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                          activeJobs === 0
                            ? "bg-emerald-100 text-emerald-800"
                            : activeJobs === 1
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {activeJobs === 0 ? "ว่าง (0 งาน)" : `กำลังทำ ${activeJobs} งาน`}
                      </span>
                    </div>

                    {/* Progress bar of workload */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>ภาระงาน (Active Workload)</span>
                        <span>{activeJobs} / 3 งานสูงสุด</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            activeJobs === 0
                              ? "bg-emerald-500 w-0"
                              : activeJobs === 1
                              ? "bg-blue-500 w-1/3"
                              : activeJobs === 2
                              ? "bg-amber-500 w-2/3"
                              : "bg-red-500 w-full"
                          )}
                        />
                      </div>
                    </div>

                    {/* Skills & Phone */}
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <div className="flex flex-wrap gap-1">
                        {t.skills.slice(0, 2).map((s) => (
                          <span key={s} className="px-1.5 py-0.2 bg-muted rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                      {t.phone && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Phone className="h-2.5 w-2.5" />
                          {t.phone}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Assign Work Modal ── */}
      <AssignWorkModal
        isOpen={Boolean(activeModalReq)}
        onClose={() => setActiveModalReq(null)}
        request={activeModalReq}
        onConfirm={handleConfirmAssignment}
      />
    </div>
  );
}
