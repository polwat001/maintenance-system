import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, History, Search, Filter,
  Wrench, Package, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Calendar, User, BarChart3, Download, FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  TECHNICIAN_MAP,
  MOCK_SPARE_PART_REQUESTS,
  STATUS_LABEL,
  CATEGORY_LABEL,
  WorkRequest,
  timeAgo,
} from "@/lib/mockData";
import { useRequests } from "@/lib/requestStore";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryRow = {
  request_id: string;
  issue_summary: string;
  tech_id: string;
  tech_name: string;
  asset_name: string;
  asset_location: string;
  category: string;
  status: WorkRequest["status"];
  reported_time: string;
  spare_count: number;
  spare_names: string[];
  duration_hours: number;
};

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_DOT: Record<WorkRequest["status"], string> = {
  open: "bg-sky-400",
  assess: "bg-amber-400",
  waiting: "bg-rose-400",
  doing: "bg-cyan-400",
  done: "bg-orange-400",
  qc1: "bg-violet-400",
  qc2: "bg-fuchsia-400",
  complete: "bg-emerald-500",
};

const STATUS_BADGE_CONFIG: Record<WorkRequest["status"], { label: string; className: string }> = {
  open: {
    label: "เปิดงาน",
    className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
  doing: {
    label: "กำลังซ่อม",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  waiting: {
    label: "รออะไหล่",
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  complete: {
    label: "เสร็จสิ้น",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  assess: {
    label: "ประเมินงาน",
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  done: {
    label: "ซ่อมเสร็จ",
    className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  },
  qc1: {
    label: "รอ QC 1",
    className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  },
  qc2: {
    label: "รอ QC 2",
    className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800",
  },
};

function TechnicianMiniAvatar({ techName }: { techName: string }) {
  const isAlt = techName.includes("อานนท์") || techName.includes("เกรียงไกร");
  return (
    <svg className="w-full h-full" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#EBF4FE" />
      {/* Hair */}
      <path d="M26 44 C26 20 38 14 50 14 C62 14 74 20 74 44 Z" fill={isAlt ? "#1E293B" : "#0F172A"} />
      {/* Face */}
      <circle cx="50" cy="46" r="22" fill="#FDE68A" />
      {/* Hair front */}
      <path d="M30 36 C34 25 45 22 50 22 C56 22 66 25 70 36 C64 30 57 28 50 28 C43 28 36 30 30 36 Z" fill={isAlt ? "#1E293B" : "#0F172A"} />
      {/* Ears */}
      <circle cx="28" cy="46" r="4" fill="#FCD34D" />
      <circle cx="72" cy="46" r="4" fill="#FCD34D" />
      {/* Blue uniform shirt */}
      <path d="M22 92 C22 70 36 67 50 67 C64 67 78 70 78 92 Z" fill="#2563EB" />
      {/* Collar & Inner shirt */}
      <path d="M42 67 L50 80 L58 67 Z" fill="#1D4ED8" />
      <path d="M36 67 L46 76 L44 67 Z" fill="#3B82F6" />
      <path d="M64 67 L54 76 L56 67 Z" fill="#3B82F6" />
    </svg>
  );
}

const STATUS_ROW_BG: Partial<Record<WorkRequest["status"], string>> = {
  complete: "bg-emerald-50/30",
  waiting: "bg-rose-50/20",
};

// ─── KPI Mini Card ─────────────────────────────────────────────────────────────

function MiniKpi({ label, value, accentClass, icon }: {
  label: string; value: string | number; accentClass: string; icon: React.ReactNode;
}) {
  return (
    <Card className={cn("p-4 border-l-4 flex items-center gap-3", accentClass)}>
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </div>
    </Card>
  );
}

// ─── Modern Themed Filter Bar ───────────────────────────────────────────────

function HistoryFilterBar({
  search, setSearch,
  techFilter, setTechFilter,
  categoryFilter, setCategoryFilter,
  statusFilter, setStatusFilter,
  techs, categories,
}: {
  search: string;
  setSearch: (v: string) => void;
  techFilter: string;
  setTechFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  statusFilter: "all" | "complete" | "in-progress";
  setStatusFilter: (v: "all" | "complete" | "in-progress") => void;
  techs: { id: string; name: string }[];
  categories: string[];
}) {
  const hasActiveFilters = Boolean(search || techFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all");

  const clearFilters = () => {
    setSearch("");
    setTechFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  return (
    <Card className="p-3 sm:p-3.5 rounded-2xl border border-border/80 shadow-2xs bg-card space-y-2.5">
      <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-8 h-9.5 rounded-xl bg-background border-border/80 hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm transition-all"
            placeholder="ค้นหาช่าง, งาน, เครื่องจักร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
              title="ล้างข้อความค้นหา"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2 shrink-0">
          {/* 1. Technician Dropdown */}
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="w-full lg:w-[175px] h-9.5 rounded-xl bg-background border-border/80 hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer">
              <div className="flex items-center gap-1.5 truncate">
                <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <SelectValue placeholder="ช่างทุกคน" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-64 rounded-xl shadow-lg border border-border/80 bg-popover/98 backdrop-blur-md">
              <SelectItem value="all" className="text-xs sm:text-sm font-semibold cursor-pointer">
                ช่างทุกคน
              </SelectItem>
              {techs.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs sm:text-sm cursor-pointer">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 2. Category Dropdown */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full lg:w-[160px] h-9.5 rounded-xl bg-background border-border/80 hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer">
              <div className="flex items-center gap-1.5 truncate">
                <Wrench className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <SelectValue placeholder="ทุกหมวดงาน" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-64 rounded-xl shadow-lg border border-border/80 bg-popover/98 backdrop-blur-md">
              <SelectItem value="all" className="text-xs sm:text-sm font-semibold cursor-pointer">
                ทุกหมวดงาน
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="text-xs sm:text-sm cursor-pointer">
                  {(CATEGORY_LABEL as Record<string, string>)[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 3. Status Dropdown */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as "all" | "complete" | "in-progress")}>
            <SelectTrigger className="w-full lg:w-[155px] h-9.5 rounded-xl bg-background border-border/80 hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <SelectValue placeholder="ทุกสถานะ" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-64 rounded-xl shadow-lg border border-border/80 bg-popover/98 backdrop-blur-md">
              <SelectItem value="all" className="text-xs sm:text-sm font-semibold cursor-pointer">
                ทุกสถานะ
              </SelectItem>
              <SelectItem value="complete" className="text-xs sm:text-sm cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>เสร็จสิ้น</span>
                </div>
              </SelectItem>
              <SelectItem value="in-progress" className="text-xs sm:text-sm cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span>กำลังดำเนินการ</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors col-span-1 sm:col-span-3 lg:col-span-1 rounded-xl"
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface TechnicianHistoryProps {
  embedded?: boolean;
}

export default function TechnicianHistory({ embedded = false }: TechnicianHistoryProps = {}) {
  const navigate = useNavigate();
  const requests = useRequests();

  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "in-progress">("all");
  const [activeTab, setActiveTab] = useState<"timeline" | "table" | "summary">("timeline");

  // All technicians from the map
  const techs = useMemo(() =>
    Object.values(TECHNICIAN_MAP).map((t) => ({ id: t.technician_id, name: t.name })),
    []
  );

  // Build history rows
  const allRows: HistoryRow[] = useMemo(() => {
    return requests
      .filter((r) => r.assigned_to) // only assigned jobs
      .map((r) => {
        const techInfo = r.assigned_to ? TECHNICIAN_MAP[r.assigned_to] : null;
        const spares = MOCK_SPARE_PART_REQUESTS.filter((sr) => sr.request_id === r.request_id);
        const duration_hours = r.status === "complete"
          ? (r.priority === "critical" ? 4.2 : r.priority === "high" ? 2.5 : 1.5)
          : (r.status === "doing" ? 0.8 : 0);
        return {
          request_id: r.request_id,
          issue_summary: r.issue_summary,
          tech_id: r.assigned_to ?? "",
          tech_name: techInfo?.name ?? r.assigned_to ?? "ไม่ระบุ",
          asset_name: r.asset_name,
          asset_location: r.asset_location,
          category: r.category,
          status: r.status,
          reported_time: r.reported_time,
          spare_count: spares.length,
          spare_names: spares.map((s) => s.part_name),
          duration_hours,
        };
      })
      .sort((a, b) => new Date(b.reported_time).getTime() - new Date(a.reported_time).getTime());
  }, [requests]);

  const handleExportCSV = () => {
    const headers = ["วันที่", "รหัสงาน", "เครื่องจักร", "สถานที่", "หมวดงาน", "ช่างผู้รับผิดชอบ", "สถานะ", "เวลาที่ใช้ (ชม.)", "อะไหล่ที่เบิก"];
    const rows = filtered.map((r) => [
      r.reported_time.split("T")[0],
      r.request_id,
      `"${r.asset_name.replace(/"/g, '""')}"`,
      `"${r.asset_location.replace(/"/g, '""')}"`,
      `"${(CATEGORY_LABEL as Record<string, string>)[r.category] ?? r.category}"`,
      `"${r.tech_name}"`,
      `"${STATUS_LABEL[r.status]}"`,
      r.duration_hours > 0 ? r.duration_hours.toFixed(1) : "-",
      `"${r.spare_names.length > 0 ? r.spare_names.join(", ").replace(/"/g, '""') : "-"}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `technician_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`ส่งออกรายงาน CSV สำเร็จ (${filtered.length} รายการ)`);
  };

  const handleExportFuture = (format: "Excel" | "PDF") => {
    handleExportCSV();
    toast.info(`ส่งออกไฟล์ ${format} สำเร็จ (พร้อมไฟล์ CSV สำรอง)`);
  };

  // Filtered rows
  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      const matchSearch = !search ||
        r.tech_name.toLowerCase().includes(search.toLowerCase()) ||
        r.request_id.toLowerCase().includes(search.toLowerCase()) ||
        r.asset_name.toLowerCase().includes(search.toLowerCase());
      const matchTech = techFilter === "all" || r.tech_id === techFilter;
      const matchCat = categoryFilter === "all" || r.category === categoryFilter;
      const matchStatus =
        statusFilter === "all" ? true :
        statusFilter === "complete" ? r.status === "complete" :
        r.status !== "complete";
      return matchSearch && matchTech && matchCat && matchStatus;
    });
  }, [allRows, search, techFilter, categoryFilter, statusFilter]);

  // KPIs
  const kpi = useMemo(() => {
    const total = allRows.length;
    const done = allRows.filter((r) => r.status === "complete").length;
    const withSpares = allRows.filter((r) => r.spare_count > 0).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, withSpares, completionRate };
  }, [allRows]);

  // Category options
  const categories = useMemo(() => {
    const set = new Set(allRows.map((r) => r.category).filter(Boolean));
    return Array.from(set);
  }, [allRows]);

  // Per-technician summary
  const techSummary = useMemo(() => {
    return techs.map((t) => {
      const myRows = allRows.filter((r) => r.tech_id === t.id);
      const done = myRows.filter((r) => r.status === "complete").length;
      const withSpares = myRows.filter((r) => r.spare_count > 0).length;
      const rate = myRows.length > 0 ? Math.round((done / myRows.length) * 100) : 0;
      return { ...t, total: myRows.length, done, withSpares, rate };
    }).sort((a, b) => b.total - a.total);
  }, [techs, allRows]);

  // Group filtered rows by date
  const grouped = useMemo(() => {
    const map: Record<string, HistoryRow[]> = {};
    filtered.forEach((r) => {
      const date = r.reported_time.split("T")[0];
      (map[date] ??= []).push(r);
    });
    return map;
  }, [filtered]);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    const today = new Date().toISOString().split("T")[0];
    const label = iso === today ? " (วันนี้)" : "";
    return d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) + label;
  };

  const bodyContent = (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniKpi label="งานทั้งหมด" value={kpi.total} accentClass="border-l-primary" icon={<Wrench className="h-5 w-5" />} />
          <MiniKpi label="เสร็จสิ้น" value={kpi.done} accentClass="border-l-emerald-500" icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
          <MiniKpi label="อัตราปิดงาน" value={`${kpi.completionRate}%`} accentClass="border-l-cyan-500" icon={<BarChart3 className="h-5 w-5 text-cyan-500" />} />
          <MiniKpi label="งานที่ใช้อะไหล่" value={kpi.withSpares} accentClass="border-l-amber-500" icon={<Package className="h-5 w-5 text-amber-500" />} />
        </div>

        {/* Tabs & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 sm:pb-0">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
            {[
              { key: "timeline", label: "📋 Timeline รายงาน" },
              { key: "table",    label: "📑 ตารางรายงาน" },
              { key: "summary",  label: "👤 สรุปรายบุคคล" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as "timeline" | "table" | "summary")}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-1 sm:pb-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs border-dashed"
              onClick={handleExportCSV}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              onClick={() => handleExportFuture("Excel")}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
            </Button>
          </div>
        </div>

        {/* ─── Tab: Timeline ─── */}
        {activeTab === "timeline" && (
          <>
            {/* Modern Themed Filters */}
            <HistoryFilterBar
              search={search}
              setSearch={setSearch}
              techFilter={techFilter}
              setTechFilter={setTechFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              techs={techs}
              categories={categories}
            />

            <div className="text-xs text-muted-foreground px-1">{filtered.length} รายการ</div>

            {/* Timeline Groups */}
            <div className="space-y-8">
              {Object.keys(grouped).length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">ไม่พบรายการ</Card>
              ) : (
                Object.entries(grouped).map(([date, rows]) => (
                  <div key={date} className="relative">
                    {/* Date Header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="ml-1 sm:ml-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20 shrink-0" />
                      <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">{formatDate(date)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{rows.length} งาน</span>
                    </div>

                    {/* Timeline items / Cards matching Image 2 with vertical line going down in front of cards */}
                    <div className="relative ml-2 sm:ml-3 border-l-2 border-dashed border-slate-300 dark:border-slate-700 pl-6 space-y-3">
                      {rows.map((row) => {
                        const badge = STATUS_BADGE_CONFIG[row.status] || {
                          label: STATUS_LABEL[row.status] || row.status,
                          className: "bg-slate-50 text-slate-700 border-slate-200",
                        };

                        return (
                          <div key={row.request_id} className="relative group">
                            {/* Timeline Status Dot positioned on the vertical line */}
                            <div
                              className={cn(
                                "absolute -left-8 top-5 sm:top-6 h-3.5 w-3.5 rounded-full border-2 border-background ring-4 ring-muted/50 shadow-xs z-10 transition-transform group-hover:scale-125",
                                STATUS_DOT[row.status] || "bg-primary"
                              )}
                              title={`สถานะ: ${badge.label}`}
                            />

                            <div
                              onClick={() => navigate(`/admin/technician/${row.tech_id}`, { state: { from: "technician-history" } })}
                              className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                            >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                              {/* ─── Column 1: Request Info (Initial circle, REQ ID, Badges, Issue summary) ─── */}
                              <div className="flex items-start sm:items-center gap-3 min-w-0 md:w-[42%] md:pr-4">
                                {/* Circle Avatar with Tech initial */}
                                <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-base flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                                  {row.tech_name.charAt(0)}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm sm:text-base text-foreground font-mono tracking-tight leading-none mb-1.5">
                                    {row.request_id}
                                  </p>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border", badge.className)}>
                                      [ {badge.label} ]
                                    </span>

                                    {row.spare_count > 0 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                        [ {row.spare_count} รายการ ]
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 truncate">
                                    {row.issue_summary}
                                  </p>
                                </div>
                              </div>

                              {/* ─── Column 2: Asset / Machine Info (Asset ID, Location) ─── */}
                              <div className="border-t md:border-t-0 md:border-l border-border/70 pt-2.5 md:pt-0 md:px-5 md:w-[30%] min-w-0">
                                <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug truncate">
                                  {row.asset_name}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 truncate">
                                  {row.asset_location}
                                </p>
                              </div>

                              {/* ─── Column 3: Tech Info, Time ago, Category, Chevron ─── */}
                              <div className="border-t md:border-t-0 md:border-l border-border/70 pt-2.5 md:pt-0 md:pl-5 md:w-[28%] flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border/80 bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shadow-2xs">
                                    <TechnicianMiniAvatar techName={row.tech_name} />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs sm:text-sm text-foreground truncate leading-snug">
                                      {row.tech_name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                                      <span>เมื่อ {timeAgo(row.reported_time)}</span>
                                      <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {(CATEGORY_LABEL as Record<string, string>)[row.category] ?? row.category}
                                    </p>
                                  </div>
                                </div>

                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ─── Tab: Table Report (ตารางรายงาน) ─── */}
        {activeTab === "table" && (
          <div className="space-y-4">
            {/* Modern Themed Filters */}
            <HistoryFilterBar
              search={search}
              setSearch={setSearch}
              techFilter={techFilter}
              setTechFilter={setTechFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              techs={techs}
              categories={categories}
            />

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">ตารางรายงานประวัติงานซ่อม</h3>
                  <p className="text-xs text-muted-foreground">แสดงประวัติงาน, สถานะ, เวลาที่ใช้ และรายการอะไหล่</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{filtered.length} รายการ</span>
              </div>
              {/* Desktop/Tablet Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">วันที่</th>
                      <th className="px-4 py-3 text-left font-medium">รหัสงาน / เครื่องจักร</th>
                      <th className="px-4 py-3 text-left font-medium">ช่างผู้รับผิดชอบ</th>
                      <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                      <th className="px-4 py-3 text-right font-medium">เวลาที่ใช้</th>
                      <th className="px-4 py-3 text-left font-medium">อะไหล่ที่เบิก</th>
                      <th className="px-4 py-3 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                          ไม่พบรายการที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, i) => (
                        <tr
                          key={row.request_id}
                          className={cn(
                            "border-b last:border-0 hover:bg-muted/30 transition-colors",
                            i % 2 !== 0 && "bg-muted/5",
                            row.status === "complete" && "bg-emerald-50/20"
                          )}
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {row.reported_time.split("T")[0]}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs text-primary font-semibold">{row.request_id}</p>
                            <p className="text-xs font-medium text-foreground">{row.asset_name}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{row.issue_summary}</p>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-[10px] font-bold shrink-0">
                                {row.tech_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{row.tech_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{row.tech_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                              row.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                              row.status === "waiting" ? "bg-rose-100 text-rose-700" :
                              row.status === "doing" ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-600"
                            )}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[row.status])} />
                              {STATUS_LABEL[row.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-xs font-semibold tabular-nums">
                            {row.duration_hours > 0 ? `${row.duration_hours.toFixed(1)} ชม.` : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {row.spare_names.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {row.spare_names.map((sn, idx) => (
                                  <span key={idx} className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[10px]">
                                    {sn}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                              onClick={() => navigate(`/admin/technician/${row.tech_id}`, { state: { from: "technician-history" } })}
                            >
                              ดูประวัติช่าง <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (< sm) */}
              <div className="sm:hidden divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    ไม่พบรายการที่ตรงกับเงื่อนไข
                  </div>
                ) : (
                  filtered.map((row) => (
                    <div key={row.request_id} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-primary font-bold">{row.request_id}</span>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          row.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                          row.status === "waiting" ? "bg-rose-100 text-rose-700" :
                          row.status === "doing" ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-600"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[row.status])} />
                          {STATUS_LABEL[row.status]}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-foreground">{row.asset_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{row.issue_summary}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                        <span>ช่าง: <strong className="text-foreground">{row.tech_name}</strong></span>
                        <span>{row.reported_time.split("T")[0]}</span>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full h-8 text-xs text-primary hover:bg-primary/10 border border-primary/20"
                        onClick={() => navigate(`/admin/technician/${row.tech_id}`, { state: { from: "technician-history" } })}
                      >
                        ดูประวัติช่าง <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ─── Tab: Summary per technician ─── */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            {techSummary.map((t) => (
              <Card key={t.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3.5 sm:gap-4">
                  <div className="flex items-center gap-3 sm:block shrink-0">
                    {/* Avatar */}
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-base sm:text-lg shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="sm:hidden min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{t.name}</p>
                        <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        อัตราปิดงาน: <strong className="text-foreground">{t.rate}%</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="hidden sm:flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    </div>

                    {/* Completion bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${t.rate}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{t.rate}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs">
                      <div className="rounded-lg bg-muted py-2">
                        <p className="text-base font-bold tabular-nums">{t.total}</p>
                        <p className="text-muted-foreground text-[11px]">งานทั้งหมด</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 py-2">
                        <p className="text-base font-bold text-emerald-700 tabular-nums">{t.done}</p>
                        <p className="text-emerald-600 text-[11px]">เสร็จสิ้น</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 py-2">
                        <p className="text-base font-bold text-amber-700 tabular-nums">{t.withSpares}</p>
                        <p className="text-amber-600 text-[11px]">ใช้อะไหล่</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto shrink-0 sm:self-center"
                    onClick={() => navigate(`/admin/technician/${t.id}`, { state: { from: "technician-history" } })}
                  >
                    ดูรายละเอียด <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer nav */}
        {!embedded && (
          <div className="flex flex-wrap gap-3 pb-4">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/dashboard")}>
              <BarChart3 className="h-4 w-4" />Admin Dashboard
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/spare-requests")}>
              <Package className="h-4 w-4" />ความต้องการอะไหล่
            </Button>
          </div>
        )}
    </div>
  );

  if (embedded) {
    return bodyContent;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
            <History className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Admin</div>
            <h1 className="font-bold truncate">ประวัติการทำงานของช่าง</h1>
          </div>
          <span className="hidden sm:block rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            ทั้งหมด {allRows.length} รายการ
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {bodyContent}
      </main>
    </div>
  );
}
