import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Search,
  Filter,
  Pencil,
  Eye,
  XCircle,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  List,
  Calendar,
  Zap,
  Building2,
  Phone,
  RefreshCw,
  ExternalLink,
  MapPin,
  ChevronDown,
  User,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRequests, requestStore } from "@/lib/requestStore";
import {
  WorkRequest,
  TECHNICIAN_MAP,
  STATUS_LABEL,
  PRIORITY_LABEL,
  CATEGORY_LABEL,
  timeAgo,
} from "@/lib/mockData";
import { EditWorkOrderModal, EditWorkOrderPayload } from "@/components/superadmin/EditWorkOrderModal";
import DispatchSection from "@/components/superadmin/DispatchSection";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  open:     { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  assess:   { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  waiting:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  doing:    { bg: "bg-cyan-50",   text: "text-cyan-700",   border: "border-cyan-200" },
  done:     { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  qc1:      { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  qc2:      { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  complete: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", text: "วิกฤติ" },
  high:     { bg: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", text: "สูง" },
  medium:   { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "ปานกลาง" },
  normal:   { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "ปกติ" },
  low:      { bg: "bg-gray-50 text-gray-700 border-gray-200", dot: "bg-gray-400", text: "ต่ำ" },
};

interface WorkOrderManagementUnifiedProps {
  embedded?: boolean;
}

export default function WorkOrderManagementUnified({ embedded = false }: WorkOrderManagementUnifiedProps) {
  const navigate = useNavigate();
  const requests = useRequests();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "dispatch">("table");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Modals state
  const [editingRequest, setEditingRequest] = useState<WorkRequest | null>(null);
  const [detailModalReq, setDetailModalReq] = useState<WorkRequest | null>(null);
  const [cancelModalReq, setCancelModalReq] = useState<WorkRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.issue_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.asset_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reported_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.assigned_to && TECHNICIAN_MAP[r.assigned_to]?.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
      const matchCategory = categoryFilter === "all" || r.category === categoryFilter;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [requests, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const critical = requests.filter((r) => r.priority === "critical").length;
    const active = requests.filter((r) => ["doing", "waiting", "open"].includes(r.status)).length;
    const unassigned = requests.filter((r) => !r.assigned_to).length;
    const completed = requests.filter((r) => r.status === "complete").length;
    return { total, critical, active, unassigned, completed };
  }, [requests]);

  // Handle Save from Unified Edit Modal
  const handleEditConfirm = (payload: EditWorkOrderPayload) => {
    // 1. Update in request store
    requestStore.setStatus(payload.requestId, payload.status, payload.technicianId, {
      actorName: "Superadmin (SA001)",
      actorRole: "system",
      note: payload.statusNote || `แก้ไขใบงาน: ช่าง ${payload.technicianName}, สถานะ ${STATUS_LABEL[payload.status]}`,
    });

    requestStore.update(payload.requestId, {
      priority: payload.priority,
      assigned_to: payload.technicianId,
    });

    toast.success(
      `แก้ไขใบงาน ${payload.requestId} สำเร็จ! (มอบหมาย: ${payload.technicianName} • สถานะ: ${STATUS_LABEL[payload.status]} • ระดับ: ${PRIORITY_LABEL[payload.priority]})`,
      { duration: 4000 }
    );

    setEditingRequest(null);
  };

  // Cancel Request
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalReq) return;

    requestStore.setStatus(cancelModalReq.request_id, "done", undefined, {
      actorName: "Superadmin",
      actorRole: "system",
      note: `ยกเลิกงาน: ${cancelReason || "ยกเลิกโดย Superadmin"}`,
    });

    toast.error(`ยกเลิกใบแจ้งซ่อม ${cancelModalReq.request_id} เรียบร้อยแล้ว`);
    setCancelModalReq(null);
    setCancelReason("");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all";

  // Dispatch view mode
  if (viewMode === "dispatch") {
    return (
      <div className={cn(embedded ? "space-y-4" : "min-h-screen bg-muted/20 flex flex-col p-4 sm:p-6")}>
        <DispatchSection
          onNavigateToWorkOrders={() => setViewMode("table")}
          onSwitchToTableView={() => setViewMode("table")}
          totalRequestsCount={requests.length}
        />
      </div>
    );
  }

  const viewToggle = (
    <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40 shrink-0">
      <button
        type="button"
        onClick={() => setViewMode("table")}
        className={cn(
          "px-2 sm:px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all",
          viewMode === "table" ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
        title="มุมมองตาราง"
      >
        <List className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">ตาราง</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode("grid")}
        className={cn(
          "px-2 sm:px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all",
          viewMode === "grid" ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
        title="มุมมองการ์ด"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">การ์ด</span>
      </button>
    </div>
  );

  return (
    <div className={cn(
      embedded ? "space-y-4 sm:space-y-5" : "min-h-screen bg-muted/20 flex flex-col"
    )}>
      {/* ── Standalone Top Header ── */}
      {!embedded && (
        <header className="bg-background border-b border-border sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/superadmin/dashboard")}
                  className="h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">แดชบอร์ดหลัก</span>
                  <span className="sm:hidden">แดชบอร์ด</span>
                </Button>
              </div>

              {viewToggle}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground flex items-center gap-1.5 sm:gap-2">
                    <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    <span>จัดการงานซ่อมบำรุงแบบรวมศูนย์</span>
                  </h1>
                  <Badge className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5 whitespace-nowrap">
                    มอบหมาย & ปรับสถานะ
                  </Badge>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  แตะที่ไอคอนดินสอ (<Pencil className="inline h-3 w-3 text-primary -mt-0.5 ml-1 mr-0.5" />แก้ไข) ในแต่ละรายการเพื่อจัดการงานทันที
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ── Embedded Action Bar (Inside Superadmin Dashboard) ── */}
      {embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 sm:p-4 rounded-xl border border-border/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary shrink-0" />
                <span>จัดการงานซ่อมบำรุงแบบรวมศูนย์</span>
              </h1>
              <Badge className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5 whitespace-nowrap">
                มอบหมาย & ปรับสถานะ
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              คลิกที่ไอคอนดินสอ (<Pencil className="inline h-3 w-3 text-primary -mt-0.5 ml-1 mr-0.5" />แก้ไข) ในตารางเพื่อมอบหมายช่าง กำหนดวันนัดหมาย และปรับสถานะงาน
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {viewToggle}
          </div>
        </div>
      )}

      {/* ── Main Body ── */}
      <main className={cn(
        embedded
          ? "space-y-4 sm:space-y-6 w-full"
          : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-6 w-full"
      )}>

        {/* ── KPI Metric Cards (Grid layout - Displays all cards simultaneously without horizontal scrolling) ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3.5">
          <Card className="col-span-2 md:col-span-1 p-3 sm:p-3.5 border-l-4 border-l-blue-500 shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">งานทั้งหมด</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500/40 shrink-0" />
            </div>
          </Card>

          <Card className="col-span-1 p-3 sm:p-3.5 border-l-4 border-l-cyan-500 shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">กำลังซ่อม</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5 text-cyan-600">{stats.active}</p>
              </div>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-500/40 shrink-0" />
            </div>
          </Card>

          <Card className="col-span-1 p-3 sm:p-3.5 border-l-4 border-l-amber-500 shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">ยังไม่มีช่าง</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5 text-amber-600">{stats.unassigned}</p>
              </div>
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500/40 shrink-0" />
            </div>
          </Card>

          <Card className="col-span-1 p-3 sm:p-3.5 border-l-4 border-l-red-500 shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">วิกฤติ/เร่งด่วน</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5 text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500/40 shrink-0" />
            </div>
          </Card>

          <Card className="col-span-1 p-3 sm:p-3.5 border-l-4 border-l-emerald-500 shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">เสร็จสมบูรณ์</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5 text-emerald-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500/40 shrink-0" />
            </div>
          </Card>
        </div>

        {/* ── Filter & Search Bar (Touch-friendly for Phone & iPad) ── */}
        <Card className="p-3 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหารหัสใบงาน, เครื่องจักร, สถานที่, อาการ หรือชื่อช่าง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 sm:h-9 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="flex items-center justify-between md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="h-9 text-xs flex items-center gap-1.5 w-full justify-between transition-all duration-200 hover:bg-muted/70 active:scale-[0.99] border-border/80"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Filter className={cn(
                    "h-3.5 w-3.5 text-primary transition-transform duration-300",
                    showMobileFilter && "rotate-12"
                  )} />
                  ตัวกรองเพิ่มเติม {hasActiveFilters && "(กำลังใช้งาน)"}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-300 ease-in-out",
                  showMobileFilter && "rotate-180"
                )} />
              </Button>
            </div>

            {/* Filter Dropdowns (Smooth animated open & close on mobile, flex row on desktop) */}
            <div
              className={cn(
                "md:!max-h-none md:!opacity-100 md:!overflow-visible md:!transform-none md:!pointer-events-auto md:!block",
                showMobileFilter ? "collapsible-drawer-open" : "collapsible-drawer-closed"
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-2 pt-2.5 md:pt-0">
                  {/* 1. Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 sm:h-9 w-full md:w-[160px] text-xs font-medium bg-background border-border/80 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 shadow-2xs cursor-pointer">
                      <SelectValue placeholder="สถานะ: ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl shadow-lg border border-border/80 bg-popover/98 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 duration-200">
                      <SelectItem value="all" className="text-xs font-semibold cursor-pointer">
                        สถานะ: ทั้งหมด
                      </SelectItem>
                      {Object.entries(STATUS_LABEL).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="text-xs cursor-pointer">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* 2. Priority Filter */}
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-10 sm:h-9 w-full md:w-[150px] text-xs font-medium bg-background border-border/80 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 shadow-2xs cursor-pointer">
                      <SelectValue placeholder="ความสำคัญ: ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl shadow-lg border border-border/80 bg-popover/98 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 duration-200">
                      <SelectItem value="all" className="text-xs font-semibold cursor-pointer">
                        ความสำคัญ: ทั้งหมด
                      </SelectItem>
                      <SelectItem value="critical" className="text-xs cursor-pointer text-red-600 font-medium">
                        🔴 วิกฤติ
                      </SelectItem>
                      <SelectItem value="high" className="text-xs cursor-pointer text-orange-600 font-medium">
                        🟠 สูง
                      </SelectItem>
                      <SelectItem value="medium" className="text-xs cursor-pointer text-blue-600 font-medium">
                        🔵 ปานกลาง
                      </SelectItem>
                      <SelectItem value="low" className="text-xs cursor-pointer text-muted-foreground font-medium">
                        ⚪ ต่ำ
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 3. Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 sm:h-9 w-full md:w-[175px] text-xs font-medium bg-background border-border/80 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 shadow-2xs cursor-pointer">
                      <SelectValue placeholder="แผนก: ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl shadow-lg border border-border/80 bg-popover/98 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 duration-200">
                      <SelectItem value="all" className="text-xs font-semibold cursor-pointer">
                        แผนก: ทั้งหมด
                      </SelectItem>
                      <SelectItem value="electrical-control" className="text-xs cursor-pointer">
                        ⚡ ไฟฟ้า & คอนโทรล
                      </SelectItem>
                      <SelectItem value="mechanical" className="text-xs cursor-pointer">
                        ⚙️ เครื่องกล
                      </SelectItem>
                      <SelectItem value="pneumatic-hydraulic" className="text-xs cursor-pointer">
                        🔧 ไฮดรอลิก & นิวแมติก
                      </SelectItem>
                      <SelectItem value="facility" className="text-xs cursor-pointer">
                        🏢 อาคาร & สถานที่
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                        setCategoryFilter("all");
                      }}
                      className="h-10 sm:h-9 text-xs text-muted-foreground hover:text-foreground w-full md:w-auto transition-colors cursor-pointer"
                    >
                      ล้างตัวกรอง
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

        {/* ── Content View ── */}
        {/* On Phone screens (< 768px): Always show touch-friendly Card List for comfortable thumb interactions */}
        <div className="block md:hidden space-y-3">
          {filteredRequests.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
              ไม่พบข้อมูลงานซ่อมที่ตรงกับเงื่อนไข
            </Card>
          ) : (
            filteredRequests.map((req) => {
              const techInfo = req.assigned_to ? TECHNICIAN_MAP[req.assigned_to] : null;
              const statusStyle = STATUS_BADGE[req.status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
              const priorityStyle = PRIORITY_BADGE[req.priority] || PRIORITY_BADGE.medium;

              return (
                <Card
                  key={req.request_id}
                  className="p-3.5 shadow-2xs border-l-4 border-l-primary space-y-3 bg-card"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs bg-muted/60 px-2 py-0.5 rounded text-foreground">
                        {req.request_id}
                      </span>
                      <h4 className="font-bold text-foreground text-sm mt-1">{req.asset_name}</h4>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", priorityStyle.bg)}>
                        <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1", priorityStyle.dot)} />
                        {priorityStyle.text}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", statusStyle.bg, statusStyle.text, statusStyle.border)}>
                        {STATUS_LABEL[req.status]}
                      </span>
                    </div>
                  </div>

                  {/* Location & Issue */}
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                      {req.asset_location}
                    </p>
                    <p className="text-foreground/90 font-medium line-clamp-2 bg-muted/30 p-2 rounded-md border border-border/40">
                      {req.issue_summary}
                    </p>
                  </div>

                  {/* Technician & Reporter info */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>ช่างที่รับผิดชอบงาน: </span>
                      <strong className="text-foreground">
                        {techInfo ? techInfo.name : "ยังไม่มีช่าง"}
                      </strong>
                    </div>
                    <span>{timeAgo(req.reported_time)}</span>
                  </div>

                  {/* Mobile Actions: Touch-friendly buttons */}
                  <div className="pt-2 border-t border-border flex items-center gap-2">
                    {/* ── Prominent Pencil Edit Button (Touch Target 40px) ── */}
                    <Button
                      size="sm"
                      onClick={() => setEditingRequest(req)}
                      className="flex-1 h-10 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 rounded-lg shadow-2xs active:scale-[0.98]"
                    >
                      <Pencil className="h-4 w-4" />
                      แก้ไขงาน
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailModalReq(req)}
                      className="h-10 px-3 text-xs rounded-lg"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelModalReq(req)}
                      className="h-10 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                      title="ยกเลิกงาน"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* On iPad and Desktop (>= 768px): Table view or Cards Grid */}
        <div className="hidden md:block">
          {viewMode === "table" ? (
            <Card className="shadow-2xs overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold text-left">
                      <th className="py-3 px-3 lg:px-4">รหัสงาน</th>
                      <th className="py-3 px-3 lg:px-4">เครื่องจักร & สถานที่</th>
                      <th className="py-3 px-3 lg:px-4">อาการเสีย</th>
                      <th className="py-3 px-3 lg:px-4">ระดับความสำคัญ</th>
                      <th className="py-3 px-3 lg:px-4">สถานะงาน</th>
                      <th className="py-3 px-3 lg:px-4">ช่างผู้รับผิดชอบ</th>
                      <th className="py-3 px-3 lg:px-4">ผู้แจ้งซ่อม</th>
                      <th className="py-3 px-3 lg:px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-muted-foreground">
                          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          ไม่พบข้อมูลงานซ่อมที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => {
                        const techInfo = req.assigned_to ? TECHNICIAN_MAP[req.assigned_to] : null;
                        const statusStyle = STATUS_BADGE[req.status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
                        const priorityStyle = PRIORITY_BADGE[req.priority] || PRIORITY_BADGE.medium;

                        return (
                          <tr key={req.request_id} className="hover:bg-muted/30 transition-colors">
                            {/* Request ID */}
                            <td className="py-3 px-3 lg:px-4 font-mono font-bold text-foreground">
                              {req.request_id}
                            </td>

                            {/* Machine & Location */}
                            <td className="py-3 px-3 lg:px-4">
                              <div className="font-semibold text-foreground">{req.asset_name}</div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[140px] lg:max-w-none">{req.asset_location}</span>
                              </div>
                            </td>

                            {/* Issue */}
                            <td className="py-3 px-3 lg:px-4 max-w-[180px] lg:max-w-[240px]">
                              <p className="line-clamp-2 text-foreground font-medium">{req.issue_summary}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {CATEGORY_LABEL[req.category as keyof typeof CATEGORY_LABEL] || req.category}
                              </span>
                            </td>

                            {/* Priority */}
                            <td className="py-3 px-3 lg:px-4">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
                                  priorityStyle.bg
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", priorityStyle.dot)} />
                                {priorityStyle.text}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 lg:px-4 whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                                  statusStyle.bg,
                                  statusStyle.text,
                                  statusStyle.border
                                )}
                              >
                                {STATUS_LABEL[req.status] || req.status}
                              </span>
                            </td>

                            {/* Technician */}
                            <td className="py-3 px-3 lg:px-4">
                              {techInfo ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] grid place-items-center shrink-0">
                                    {techInfo.name.charAt(0)}
                                  </div>
                                  <div className="truncate max-w-[120px]">
                                    <span className="font-semibold text-foreground text-xs">{techInfo.name}</span>
                                    <p className="text-[10px] text-muted-foreground truncate">{techInfo.department}</p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200 inline-block">
                                  ยังไม่มีผู้รับงาน
                                </span>
                              )}
                            </td>

                            {/* Reporter */}
                            <td className="py-3 px-3 lg:px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                              <div>{req.reported_by}</div>
                              <div className="text-[10px] opacity-75">{timeAgo(req.reported_time)}</div>
                            </td>

                            {/* Action Buttons: PENCIL ICON */}
                            <td className="py-3 px-3 lg:px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* ── THE PENCIL ICON BUTTON (EDIT) ── */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary border-primary/30 shadow-2xs transition-all gap-1.5"
                                  onClick={() => setEditingRequest(req)}
                                  title="แก้ไขงาน: รวมฟังก์ชันมอบหมายช่างและปรับสถานะ"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>แก้ไข</span>
                                </Button>

                                {/* Details */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => setDetailModalReq(req)}
                                  title="ดูรายละเอียดใบงาน"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                {/* Cancel */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setCancelModalReq(req)}
                                  title="ยกเลิกใบงานนี้"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* iPad & Desktop Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((req) => {
                const techInfo = req.assigned_to ? TECHNICIAN_MAP[req.assigned_to] : null;
                const statusStyle = STATUS_BADGE[req.status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
                const priorityStyle = PRIORITY_BADGE[req.priority] || PRIORITY_BADGE.medium;

                return (
                  <Card key={req.request_id} className="p-4 shadow-2xs flex flex-col justify-between border-l-4 border-l-primary bg-card">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="font-mono font-bold text-sm text-foreground bg-muted/60 px-2 py-0.5 rounded">
                          {req.request_id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", priorityStyle.bg)}>
                            {priorityStyle.text}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", statusStyle.bg, statusStyle.text, statusStyle.border)}>
                            {STATUS_LABEL[req.status]}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-foreground text-sm line-clamp-1">{req.asset_name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                          {req.asset_location}
                        </p>
                      </div>

                      <p className="text-xs text-foreground/80 line-clamp-2 bg-muted/20 p-2 rounded-lg border border-border/40">
                        {req.issue_summary}
                      </p>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          <span>ช่างที่รับผิดชอบงาน: </span>
                          <strong className="text-foreground">{techInfo ? techInfo.name : "ยังไม่มีช่าง"}</strong>
                        </div>
                        <span className="text-[11px]">{timeAgo(req.reported_time)}</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-border flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailModalReq(req)}
                        className="text-xs h-8"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        รายละเอียด
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => setEditingRequest(req)}
                        className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        แก้ไขงาน
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── UNIFIED EDIT MODAL (Combined Assign & Status) ── */}
      <EditWorkOrderModal
        isOpen={Boolean(editingRequest)}
        onClose={() => setEditingRequest(null)}
        request={editingRequest}
        onConfirm={handleEditConfirm}
      />

      {/* ── Detail Modal (Mobile & iPad Responsive) ── */}
      {detailModalReq && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-150"
          onClick={() => setDetailModalReq(null)}
        >
          <Card
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-background space-y-4 shadow-2xl rounded-xl sm:rounded-2xl cursor-default animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {detailModalReq.request_id}
                </span>
                <h3 className="font-bold text-base sm:text-lg mt-1">{detailModalReq.issue_summary}</h3>
              </div>
              <button
                onClick={() => setDetailModalReq(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">เครื่องจักร</p>
                <p className="font-semibold text-sm mt-0.5">{detailModalReq.asset_name}</p>
                <p className="text-muted-foreground">ตำแหน่ง: {detailModalReq.asset_location}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">หมวดหมู่งาน</p>
                <p className="font-semibold text-sm mt-0.5">{CATEGORY_LABEL[detailModalReq.category as keyof typeof CATEGORY_LABEL] ?? detailModalReq.category}</p>
                <p className="text-muted-foreground">ระดับ: {PRIORITY_LABEL[detailModalReq.priority]}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">ผู้แจ้งซ่อม</p>
                <p className="font-semibold mt-0.5">{detailModalReq.reported_by}</p>
                <p className="text-muted-foreground">เวลา: {new Date(detailModalReq.reported_time).toLocaleString("th-TH")}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">ช่างที่รับผิดชอบ</p>
                <p className="font-semibold mt-0.5">
                  {detailModalReq.assigned_to ? TECHNICIAN_MAP[detailModalReq.assigned_to]?.name || detailModalReq.assigned_to : "ยังไม่มีช่าง"}
                </p>
                <p className="text-muted-foreground">สถานะ: {STATUS_LABEL[detailModalReq.status]}</p>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-foreground">รายละเอียดเพิ่มเติม:</p>
              <p className="text-muted-foreground leading-relaxed">
                {detailModalReq.request_details?.additional_note || "ไม่มีบันทึกรายละเอียดเพิ่มเติมจากผู้แจ้ง"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalReq(null)}
                className="h-9 text-xs"
              >
                ปิดหน้าต่าง
              </Button>
              <Button
                size="sm"
                className="h-9 bg-primary text-primary-foreground gap-1.5 text-xs font-semibold"
                onClick={() => {
                  const reqToEdit = detailModalReq;
                  setDetailModalReq(null);
                  setEditingRequest(reqToEdit);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                แก้ไขงานนี้
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Cancel Modal (Mobile & iPad Responsive) ── */}
      {cancelModalReq && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-150"
          onClick={() => setCancelModalReq(null)}
        >
          <Card
            className="w-full max-w-md p-4 sm:p-6 bg-background space-y-4 shadow-2xl rounded-xl sm:rounded-2xl cursor-default animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-red-600 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  ยืนยันการยกเลิกใบแจ้งซ่อม
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {cancelModalReq.request_id}: {cancelModalReq.issue_summary}
                </p>
              </div>
              <button
                onClick={() => setCancelModalReq(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">ระบุเหตุผลในการยกเลิกงาน *</Label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="เช่น งานซ้ำซ้อน, ผู้แจ้งขอยกเลิก, เครื่องจักรกลับมาใช้งานได้ปกติ..."
                  className="w-full rounded-md border border-input bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCancelModalReq(null)} className="h-9 text-xs">
                  ย้อนกลับ
                </Button>
                <Button type="submit" variant="destructive" className="h-9 text-xs font-semibold">
                  ยืนยันยกเลิกใบแจ้งซ่อม
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
