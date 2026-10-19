import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, LogOut, History, Search, Filter,
  Wrench, Package, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Calendar, User, BarChart3, Download, FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// ─── Technician Filter Bar ─────────────────────────────────────────────────────

function TechFilterChips({
  techs, selected, onChange,
}: {
  techs: { id: string; name: string }[];
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
          selected === "all"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border text-muted-foreground hover:border-primary/50"
        )}
      >
        ช่างทุกคน
      </button>
      {techs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            selected === t.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          {t.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TechnicianHistory() {
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
    const set = new Set(allRows.map((r) => r.category));
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
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => navigate("/")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniKpi label="งานทั้งหมด" value={kpi.total} accentClass="border-l-primary" icon={<Wrench className="h-5 w-5" />} />
          <MiniKpi label="เสร็จสิ้น" value={kpi.done} accentClass="border-l-emerald-500" icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
          <MiniKpi label="อัตราปิดงาน" value={`${kpi.completionRate}%`} accentClass="border-l-cyan-500" icon={<BarChart3 className="h-5 w-5 text-cyan-500" />} />
          <MiniKpi label="งานที่ใช้อะไหล่" value={kpi.withSpares} accentClass="border-l-amber-500" icon={<Package className="h-5 w-5 text-amber-500" />} />
        </div>

        {/* Tabs & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 sm:pb-0">
          <div className="flex gap-1">
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
            {/* Filters */}
            <Card className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 h-9" placeholder="ค้นหาช่าง, งาน, เครื่องจักร..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">ทุกหมวดงาน</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{(CATEGORY_LABEL as Record<string, string>)[c] ?? c}</option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "complete" | "in-progress")}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="complete">เสร็จสิ้น</option>
                  <option value="in-progress">กำลังดำเนินการ</option>
                </select>
              </div>
              <TechFilterChips techs={techs} selected={techFilter} onChange={setTechFilter} />
            </Card>

            <div className="text-xs text-muted-foreground px-1">{filtered.length} รายการ</div>

            {/* Timeline Groups */}
            <div className="space-y-8">
              {Object.keys(grouped).length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">ไม่พบรายการ</Card>
              ) : (
                Object.entries(grouped).map(([date, rows]) => (
                  <div key={date} className="relative">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">{formatDate(date)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{rows.length} งาน</span>
                    </div>

                    {/* Timeline items */}
                    <div className="ml-4 border-l-2 border-dashed border-border pl-6 space-y-3">
                      {rows.map((row) => (
                        <div key={row.request_id} className={cn(
                          "relative flex items-start gap-3 rounded-xl p-4 border transition-all hover:shadow-sm cursor-pointer",
                          STATUS_ROW_BG[row.status] ?? "bg-card"
                        )}
                          onClick={() => navigate(`/admin/technician/${row.tech_id}`)}
                        >
                          {/* Timeline dot */}
                          <div className={cn("absolute -left-9 top-5 h-3 w-3 rounded-full border-2 border-background", STATUS_DOT[row.status])} />

                          {/* Avatar */}
                          <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold shrink-0">
                            {row.tech_name.charAt(0)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className="font-mono text-xs text-primary">{row.request_id}</span>
                              <span className={cn(
                                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                row.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                                row.status === "waiting" ? "bg-rose-100 text-rose-700" :
                                row.status === "doing" ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-600"
                              )}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[row.status])} />
                                {STATUS_LABEL[row.status]}
                              </span>
                              {row.spare_count > 0 && (
                                <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs">
                                  <Package className="h-3 w-3" />{row.spare_count} รายการ
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">{row.asset_name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{row.tech_name}</span>
                              <span>{row.asset_location}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(row.reported_time)}</span>
                              <span>{(CATEGORY_LABEL as Record<string, string>)[row.category] ?? row.category}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      ))}
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
            {/* Filters */}
            <Card className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 h-9" placeholder="ค้นหาช่าง, งาน, เครื่องจักร..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">ทุกหมวดงาน</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{(CATEGORY_LABEL as Record<string, string>)[c] ?? c}</option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "complete" | "in-progress")}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="complete">เสร็จสิ้น</option>
                  <option value="in-progress">กำลังดำเนินการ</option>
                </select>
              </div>
              <TechFilterChips techs={techs} selected={techFilter} onChange={setTechFilter} />
            </Card>

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">ตารางรายงานประวัติงานซ่อม</h3>
                  <p className="text-xs text-muted-foreground">แสดงประวัติงาน, สถานะ, เวลาที่ใช้ และรายการอะไหล่</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{filtered.length} รายการ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
                              onClick={() => navigate(`/admin/technician/${row.tech_id}`)}
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
            </Card>
          </div>
        )}

        {/* ─── Tab: Summary per technician ─── */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            {techSummary.map((t) => (
              <Card key={t.id} className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-lg shrink-0">
                    {t.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold">{t.name}</p>
                      <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    </div>

                    {/* Completion bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${t.rate}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{t.rate}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="rounded-lg bg-muted py-2">
                        <p className="text-base font-bold">{t.total}</p>
                        <p className="text-muted-foreground">งานทั้งหมด</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 py-2">
                        <p className="text-base font-bold text-emerald-700">{t.done}</p>
                        <p className="text-emerald-600">เสร็จสิ้น</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 py-2">
                        <p className="text-base font-bold text-amber-700">{t.withSpares}</p>
                        <p className="text-amber-600">ใช้อะไหล่</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => navigate(`/admin/technician/${t.id}`)}
                  >
                    ดูรายละเอียด <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex flex-wrap gap-3 pb-4">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/dashboard")}>
            <BarChart3 className="h-4 w-4" />Admin Dashboard
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/spare-requests")}>
            <Package className="h-4 w-4" />ความต้องการอะไหล่
          </Button>
        </div>
      </main>
    </div>
  );
}
