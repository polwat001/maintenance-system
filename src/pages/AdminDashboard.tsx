import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import AdminSpareRequests from "./AdminSpareRequests.tsx";
import TechnicianHistory from "./TechnicianHistory.tsx";
import TechnicianDetail from "./TechnicianDetail.tsx";
import TeamSection from "@/components/admin/TeamSection.tsx";
import Checksheet from "./Checksheet.tsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  LabelList,
} from "recharts";
import {
  Wrench,
  LogOut,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  ChevronRight,
  LayoutDashboard,
  Menu,
  X,
  ClipboardList,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  History,
  Search,
  Plus,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequests } from "@/lib/requestStore";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  PRIORITY_LABEL,
  TECHNICIAN_MAP,
  addTechnician,
  Technician,
  timeAgo,
  WorkRequest,
  MOCK_SPARE_PARTS_EXTENDED,
  MOCK_SPARE_PART_TRANSACTIONS,
  MOCK_CHECKSHEET_TEMPLATES,
  MOCK_CHECKSHEET_RECORDS,
  MOCK_SPARE_PART_REQUESTS,
  SPARE_PART_CATEGORY_LABEL,
} from "@/lib/mockData";
import { cn } from "@/lib/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(0 78% 48%)",
  high: "hsl(25 95% 53%)",
  medium: "hsl(210 85% 50%)",
  low: "hsl(215 14% 55%)",
};

const STATUS_BAR_COLOR: Record<string, string> = {
  open: "#38bdf8",
  assess: "#f59e0b",
  waiting: "#f43f5e",
  doing: "#22d3ee",
  done: "#f97316",
  qc1: "#8b5cf6",
  qc2: "#d946ef",
  complete: "#10b981",
};

// ─── Nav items grouped by category ──────────────────────────────────────────
type NavKey = "overview" | "pipeline" | "team" | "spare" | "checksheet" | "spare-requests" | "technician-history";

type NavItem = {
  key: NavKey;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  href?: string;
};

const ADMIN_NAV_GROUPS: {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}[] = [
  {
    title: "ภาพรวม & งานซ่อม",
    icon: <Activity className="h-3.5 w-3.5 text-blue-400" />,
    items: [
      {
        key: "overview",
        label: "ภาพรวม",
        sublabel: "KPIs & กราฟ",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        key: "pipeline",
        label: "สถานะงาน",
        sublabel: "Pipeline & งานค้าง",
        icon: <Activity className="h-5 w-5" />,
      },
      {
        key: "checksheet",
        label: "เช็คชีท",
        sublabel: "Compliance & บันทึก",
        icon: <ClipboardList className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "ทีมช่าง & รายงาน",
    icon: <Users className="h-3.5 w-3.5 text-sky-400" />,
    items: [
      {
        key: "team",
        label: "ทีมช่าง",
        sublabel: "ประสิทธิภาพ",
        icon: <Users className="h-5 w-5" />,
      },
      {
        key: "technician-history",
        label: "ประวัติช่าง",
        sublabel: "Timeline & รายงาน",
        icon: <History className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "จัดการอะไหล่",
    icon: <Package className="h-3.5 w-3.5 text-amber-400" />,
    items: [
      {
        key: "spare",
        label: "อะไหล่",
        sublabel: "สต็อก & การใช้งาน",
        icon: <Package className="h-5 w-5" />,
      },
      {
        key: "spare-requests",
        label: "ขออะไหล่",
        sublabel: "คำขอจากช่าง",
        icon: <ShieldAlert className="h-5 w-5" />,
      },
    ],
  },
];

const NAV_ITEMS: NavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accentClass?: string;
  iconBgClass?: string;
  pulse?: boolean;
}
function KpiCard({ icon, label, value, unit, sub, accentClass, iconBgClass, pulse }: KpiCardProps) {
  let displayValue = value;
  let displayUnit = unit;
  if (!displayUnit && typeof value === "string") {
    const parts = value.trim().split(/\s+/);
    if (parts.length === 2 && !isNaN(Number(parts[0]))) {
      displayValue = parts[0];
      displayUnit = parts[1];
    }
  }

  const valStr = String(displayValue);
  const isCompactValue = valStr.length > 5;

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-3.5 sm:p-5 border-l-4 bg-card transition-all duration-200 hover:shadow-md flex flex-col justify-between min-w-0",
        accentClass ?? "border-l-primary"
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate" title={label}>{label}</p>
          <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-lg grid place-items-center shrink-0 transition-colors shadow-xs", iconBgClass ?? "bg-muted text-muted-foreground")}>
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 flex-nowrap overflow-hidden">
          <span
            className={cn(
              "font-bold tabular-nums tracking-tight leading-none text-foreground whitespace-nowrap",
              isCompactValue
                ? "text-[28px] sm:text-3xl xl:text-[22px] 2xl:text-[28px]"
                : "text-3xl sm:text-4xl xl:text-2xl 2xl:text-3xl"
            )}
            title={valStr}
          >
            {displayValue}
          </span>
          {displayUnit && (
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground shrink-0 whitespace-nowrap">
              {displayUnit}
            </span>
          )}
        </div>
      </div>

      {sub && (
        <div className="mt-2.5 pt-1.5 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground truncate" title={sub}>{sub}</p>
        </div>
      )}
      {pulse && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-priority-critical priority-pulse" />}
    </Card>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-7 w-7 rounded-md bg-primary/10 text-primary grid place-items-center">{icon}</div>
      <h2 className="font-semibold text-base">{title}</h2>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; fill?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.fill }}>
          {entry.name ?? "จำนวน"}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

function PriorityPill({ priority }: { priority: WorkRequest["priority"] }) {
  const cls: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-gray-100 text-gray-600",
  };
  const lbl: Record<string, string> = {
    critical: "🔴 วิกฤติ", high: "🟠 สูง", medium: "🔵 ปานกลาง", low: "⚪ ต่ำ",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", cls[priority])}>
      {lbl[priority]}
    </span>
  );
}

function StatusPill({ status }: { status: WorkRequest["status"] }) {
  const cls: Record<string, string> = {
    open: "bg-sky-100 text-sky-700",
    assess: "bg-amber-100 text-amber-700",
    waiting: "bg-rose-100 text-rose-700",
    doing: "bg-cyan-100 text-cyan-700",
    done: "bg-orange-100 text-orange-700",
    qc1: "bg-violet-100 text-violet-700",
    qc2: "bg-fuchsia-100 text-fuchsia-700",
    complete: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", cls[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Page Sections ────────────────────────────────────────────────────────────
function OverviewSection({
  kpi,
  categoryData,
  priorityData,
}: {
  kpi: ReturnType<typeof useKpi>;
  categoryData: { name: string; count: number }[];
  priorityData: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <section>
        <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="ตัวชี้วัดหลัก (KPIs)" />
        <div className="grid gap-3.5 sm:gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard icon={<BarChart3 className="h-4.5 w-4.5 text-primary" />} iconBgClass="bg-primary/10 text-primary" label="งานทั้งหมด" value={kpi.total} sub="ทุกสถานะรวมกัน" accentClass="border-l-primary" />
          <KpiCard icon={<AlertTriangle className="h-4.5 w-4.5 text-red-600" />} iconBgClass="bg-red-100/80 text-red-700" label="งานวิกฤติ" value={kpi.critical} sub="ต้องดำเนินการทันที" accentClass="border-l-red-500" pulse={kpi.critical > 0} />
          <KpiCard icon={<Clock className="h-4.5 w-4.5 text-orange-600" />} iconBgClass="bg-orange-100/80 text-orange-700" label="ค้างเกิน 24 ชม." value={kpi.overdue} sub="ยังไม่เสร็จ" accentClass="border-l-orange-500" />
          <KpiCard icon={<CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />} iconBgClass="bg-emerald-100/80 text-emerald-700" label="เสร็จสิ้นแล้ว" value={kpi.complete} sub={`${kpi.completionRate}% ของงาน`} accentClass="border-l-emerald-500" />
          <KpiCard icon={<Package className="h-4.5 w-4.5 text-violet-600" />} iconBgClass="bg-violet-100/80 text-violet-700" label="รออะไหล่" value={kpi.waiting} sub="รอจัดซื้อ/จัดส่ง" accentClass="border-l-violet-500" />
          <KpiCard icon={<TrendingUp className="h-4.5 w-4.5 text-cyan-600" />} iconBgClass="bg-cyan-100/80 text-cyan-700" label="MTTR (จำลอง)" value={kpi.mockMttr} unit="ชม." sub="เฉลี่ยเวลาซ่อม" accentClass="border-l-cyan-500" />
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="จำนวนงานแยกตามหมวดหมู่" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 18% 87%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="hsl(215 60% 40%)" radius={[4, 4, 0, 0]} name="จำนวนงาน" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="สัดส่วนความสำคัญของงาน" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} cx="45%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-xs">
                      <p style={{ color: payload[0].payload.color }} className="font-semibold">{payload[0].name}</p>
                      <p>จำนวน: <strong>{payload[0].value}</strong></p>
                    </div>
                  ) : null
                }
              />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </section>
    </div>
  );
}

function PipelineSection({
  statusPipeline,
  urgentJobs,
  maxPipelineCount,
}: {
  statusPipeline: { key: string; label: string; count: number }[];
  urgentJobs: WorkRequest[];
  maxPipelineCount: number;
}) {
  const [viewMode, setViewMode] = useState<"bar" | "list">("bar");
  const totalJobs = statusPipeline.reduce((acc, curr) => acc + curr.count, 0);
  const activeJobs = statusPipeline.filter((s) => s.key !== "complete").reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Pipeline */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Status Pipeline — การไหลของงาน" />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/80 rounded-lg border text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("bar")}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5",
                viewMode === "bar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>กราฟแท่ง</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5",
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>แถบแนวนอน</span>
            </button>
          </div>
        </div>

        <Card className="p-4 sm:p-6 shadow-sm border bg-card space-y-5">
          {/* Header Summary Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
            <div>
              <h3 className="font-semibold text-sm text-foreground">สถิติจำนวนงานในแต่ละขั้นตอน</h3>
              <p className="text-xs text-muted-foreground mt-0.5">ติดตามปริมาณงานคงค้างและขั้นตอนที่งานไหลผ่านตั้งแต่เปิดงานจนถึงเสร็จสิ้น</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                งานทั้งหมด {totalJobs} รายการ
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 font-semibold border border-amber-200">
                กำลังดำเนินการ {activeJobs} รายการ
              </span>
            </div>
          </div>

          {viewMode === "bar" ? (
            /* ── Bar Chart View ── */
            <div className="w-full">
              <div className="w-full overflow-x-auto pb-2">
                <div className="min-w-[560px] h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusPipeline}
                      margin={{ top: 25, right: 16, left: -16, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(215 18% 90%)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(215 28% 30%)" }}
                        interval={0}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(215 18% 85%)" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(215 14% 45%)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: "hsl(215 20% 95% / 0.6)" }}
                      />
                      <Bar
                        dataKey="count"
                        name="จำนวนงาน"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      >
                        {statusPipeline.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={STATUS_BAR_COLOR[entry.key] || "#3b82f6"}
                          />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="top"
                          formatter={(val: number) => (val > 0 ? val : "")}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fill: "hsl(215 28% 25%)",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Summary Cards Grid below chart */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-4 border-t mt-4">
                {statusPipeline.map((s) => (
                  <div
                    key={s.key}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border text-center"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground truncate mb-1">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_BAR_COLOR[s.key] }}
                      />
                      <span className="truncate">{s.label}</span>
                    </div>
                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{ color: s.count > 0 ? STATUS_BAR_COLOR[s.key] : undefined }}
                    >
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Progress Bar List View ── */
            <div className="space-y-3.5">
              {statusPipeline.map((s) => (
                <div key={s.key} className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-1.5 shrink-0 text-xs font-medium text-foreground w-28">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_BAR_COLOR[s.key] }}
                    />
                    <span className="truncate">{s.label}</span>
                  </div>
                  <div className="flex-1 bg-muted/60 rounded-full h-6 sm:h-7 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-center sm:justify-end pr-0 sm:pr-2 text-xs font-bold text-white transition-all duration-700"
                      style={{
                        width: `${Math.max((s.count / maxPipelineCount) * 100, s.count > 0 ? 7 : 0)}%`,
                        minWidth: s.count > 0 ? "24px" : "0px",
                        backgroundColor: STATUS_BAR_COLOR[s.key],
                      }}
                    >
                      {s.count > 0 && s.count}
                    </div>
                  </div>
                  <div className={cn("w-6 sm:w-7 text-xs font-semibold tabular-nums text-right shrink-0", s.count === 0 && "text-muted-foreground")}>
                    {s.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Urgent table */}
      <section>
        <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="งานวิกฤติ / งานสำคัญที่ต้องติดตาม" />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">รหัสงาน</th>
                  <th className="px-4 py-3 text-left font-medium">ทรัพย์สิน</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">ปัญหา</th>
                  <th className="px-4 py-3 text-left font-medium">ความสำคัญ</th>
                  <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                  <th className="px-4 py-3 text-left font-medium">รอมา</th>
                </tr>
              </thead>
              <tbody>
                {urgentJobs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs">ไม่มีงานวิกฤติ / สำคัญขณะนี้</td></tr>
                ) : (
                  urgentJobs.map((r, i) => (
                    <tr key={r.request_id} className={cn("border-b last:border-0 transition-colors hover:bg-muted/30", i % 2 !== 0 && "bg-muted/10")}>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{r.request_id}</td>
                      <td className="px-4 py-3 font-medium">{r.asset_name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[180px] truncate">{r.issue_summary}</td>
                      <td className="px-4 py-3"><PriorityPill priority={r.priority} /></td>
                      <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{timeAgo(r.reported_time)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

// ─── Custom hooks for data ────────────────────────────────────────────────────
function useKpi(requests: WorkRequest[]) {
  return useMemo(() => {
    const total = requests.length;
    const critical = requests.filter((r) => r.priority === "critical").length;
    const overdue = requests.filter((r) => r.status !== "complete" && hoursAgo(r.reported_time) > 24).length;
    const complete = requests.filter((r) => r.status === "complete").length;
    const waiting = requests.filter((r) => r.status === "waiting").length;
    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, critical, overdue, complete, waiting, completionRate, mockMttr: 3.2 };
  }, [requests]);
}

function useTechPerf(requests: WorkRequest[]) {
  return useMemo(() =>
    Object.values(TECHNICIAN_MAP).map((tech) => {
      const mine = requests.filter((r) => r.assigned_to === tech.technician_id);
      return {
        id: tech.technician_id,
        name: tech.name,
        department: tech.department,
        total: mine.length,
        done: mine.filter((r) => r.status === "complete").length,
        inProgress: mine.filter((r) => r.status === "doing").length,
        pending: mine.filter((r) => ["open", "assess", "waiting"].includes(r.status)).length,
      };
    }), [requests]);
}

function SpareSection({
  navigate,
  onNavigateNav,
}: {
  navigate: (p: string) => void;
  onNavigateNav?: (key: NavKey) => void;
}) {
  const parts = MOCK_SPARE_PARTS_EXTENDED;
  const transactions = MOCK_SPARE_PART_TRANSACTIONS;
  const out = parts.filter((p) => p.stock === 0).length;
  const low = parts.filter((p) => p.stock > 0 && p.stock < p.min_stock).length;
  const ok = parts.filter((p) => p.stock >= p.min_stock).length;
  const totalValue = parts.reduce((s, p) => s + p.stock * p.unit_price, 0);

  const catUsage = Object.entries(
    transactions
      .filter((t) => t.type === "issue")
      .reduce((acc, t) => {
        const part = parts.find((p) => p.part_id === t.part_id);
        const cat = part ? SPARE_PART_CATEGORY_LABEL[part.category] : "อื่น ๆ";
        acc[cat] = (acc[cat] ?? 0) + t.quantity;
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const criticalParts = parts.filter((p) => p.stock < p.min_stock).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* KPI mini cards */}
      <section>
        <SectionTitle icon={<Package className="h-4 w-4" />} title="สรุปสต็อกอะไหล่" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "รายการทั้งหมด", value: parts.length, cls: "border-l-indigo-500" },
            { label: "หมดสต็อก", value: out, cls: "border-l-red-500" },
            { label: "ใกล้หมด", value: low, cls: "border-l-amber-500" },
            { label: "มูลค่ารวม", value: `฿${totalValue.toLocaleString('th-TH')}`, cls: "border-l-emerald-500" },
          ].map((k) => (
            <Card key={k.label} className={cn("p-4 border-l-4", k.cls)}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold tabular-nums">{k.value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Category usage chart */}
        <Card className="p-5">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="การเบิกอะไหล่แยกตามหมวดหมู่" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catUsage} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 18% 87%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="hsl(260 60% 50%)" radius={[4, 4, 0, 0]} name="จำนวนเบิก" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Critical parts list */}
        <Card className="p-5">
          <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} title="อะไหล่ที่ต้องสั่งซื้อเร่งด่วน" />
          {criticalParts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">สต็อกทุกรายการอยู่ในระดับปกติ ✅</p>
          ) : (
            <div className="space-y-3">
              {criticalParts.map((p) => {
                const pct = Math.min(Math.round((p.stock / p.max_stock) * 100), 100);
                const isOut = p.stock === 0;
                return (
                  <div key={p.part_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate flex-1">{p.name}</span>
                      <span className={cn("font-bold tabular-nums ml-2", isOut ? "text-red-600" : "text-amber-600")}>{p.stock}/{p.max_stock} {p.unit}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", isOut ? "bg-red-400" : "bg-amber-400")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
            <Button
              variant="outline"
              className="w-full sm:flex-1 h-12 sm:h-10 text-sm font-semibold gap-2 shadow-sm border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-black active:scale-[0.98] transition-all"
              style={{ color: "#0f172a" }}
              onClick={() => navigate("/admin/spare-parts")}
            >
              <Package className="h-4 w-4 shrink-0" style={{ color: "#334155" }} />
              <span className="font-semibold" style={{ color: "#0f172a" }}>ไปยังระบบจัดการอะไหล่</span>
              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "#334155" }} />
            </Button>
            <Button
              className="w-full sm:flex-1 h-12 sm:h-10 text-sm font-semibold gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-[0.98] transition-all"
              onClick={() => (onNavigateNav ? onNavigateNav("spare-requests") : navigate("/admin/spare-requests"))}
            >
              <ShieldAlert className="h-4 w-4" /> ดูคำขออะไหล่จากช่าง
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

// ─── Checksheet Summary Section ───────────────────────────────────────────────
function ChecksheetSection({ navigate }: { navigate: (p: string) => void }) {
  const templates = MOCK_CHECKSHEET_TEMPLATES.filter((t) => t.active);
  const records = MOCK_CHECKSHEET_RECORDS;
  const flagged = records.filter((r) => r.status === "flagged").length;
  const completeRec = records.filter((r) => r.status === "complete").length;
  const complianceRate = records.length > 0 ? Math.round((completeRec / records.length) * 100) : 0;

  const perTemplate = templates.map((t) => {
    const recs = records.filter((r) => r.template_id === t.template_id);
    const ok = recs.filter((r) => r.status === "complete").length;
    return { name: t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name, total: recs.length, ok, rate: recs.length > 0 ? Math.round((ok / recs.length) * 100) : 0 };
  });

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="สรุประบบเช็คชีท" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Template ทั้งหมด", value: templates.length, cls: "border-l-indigo-500" },
            { label: "บันทึกทั้งหมด", value: records.length, cls: "border-l-slate-400" },
            { label: "พบปัญหา (Flag)", value: flagged, cls: "border-l-red-500" },
            { label: "Compliance Rate", value: `${complianceRate}%`, cls: complianceRate >= 80 ? "border-l-emerald-500" : "border-l-amber-500" },
          ].map((k) => (
            <Card key={k.label} className={cn("p-4 border-l-4", k.cls)}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold tabular-nums">{k.value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Compliance แต่ละ Template" />
          <div className="space-y-3">
            {perTemplate.map((t) => (
              <div key={t.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex-1">{t.name}</span>
                  <span className={cn("font-bold tabular-nums ml-2", t.rate >= 80 ? "text-emerald-600" : "text-amber-600")}>{t.rate}% ({t.ok}/{t.total})</span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", t.rate >= 80 ? "bg-emerald-400" : "bg-amber-400")} style={{ width: `${t.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle icon={<Activity className="h-4 w-4" />} title="บันทึกล่าสุด" />
          <div className="space-y-2">
            {records.slice(0, 5).map((rec) => (
              <div key={rec.record_id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", rec.status === "complete" ? "bg-emerald-400" : rec.status === "flagged" ? "bg-red-400" : "bg-amber-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{rec.template_name}</p>
                  <p className="text-[10px] text-muted-foreground">{rec.completed_by}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{timeAgo(rec.submitted_at)}</span>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 gap-1.5 h-11 sm:h-10 text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-black active:scale-[0.98] transition-all shadow-sm"
            style={{ color: "#0f172a" }}
            onClick={() => navigate('/admin/checksheet')}
          >
            <ClipboardList className="h-4 w-4 shrink-0" style={{ color: "#334155" }} />
            <span className="font-semibold" style={{ color: "#0f172a" }}>ไปยังระบบเช็คชีท</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#334155" }} />
          </Button>
        </Card>
      </section>
    </div>
  );
}

interface AdminDashboardProps {
  defaultTab?: NavKey;
}

const VALID_TABS: NavKey[] = [
  "overview",
  "pipeline",
  "team",
  "spare",
  "checksheet",
  "spare-requests",
  "technician-history",
];

export default function AdminDashboard({ defaultTab }: AdminDashboardProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const requests = useRequests();

  const isTechDetail = Boolean(params.id) || location.pathname.startsWith("/admin/technician/");
  const techId = params.id || (isTechDetail ? location.pathname.split("/admin/technician/")[1]?.split("/")[0] : undefined);
  const isChecksheetSystem =
    location.pathname === "/checksheet" ||
    location.pathname === "/admin/checksheet" ||
    searchParams.get("view") === "checksheet";

  const getInitialTab = (): NavKey => {
    if (isChecksheetSystem) return "checksheet";
    if (isTechDetail) {
      if (location.state?.from === "team") return "team";
      return "technician-history";
    }
    if (defaultTab && VALID_TABS.includes(defaultTab)) return defaultTab;
    if (location.pathname === "/admin/spare-requests") return "spare-requests";
    if (location.pathname === "/admin/technician-history") return "technician-history";
    const tabParam = searchParams.get("tab") as NavKey | null;
    if (tabParam && VALID_TABS.includes(tabParam)) return tabParam;
    return "overview";
  };

  const [activeNav, setActiveNav] = useState<NavKey>(getInitialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const current = getInitialTab();
    setActiveNav(current);
  }, [location.pathname, searchParams, defaultTab, isTechDetail, isChecksheetSystem]);

  const handleNavSelect = (key: NavKey) => {
    setActiveNav(key);
    setSidebarOpen(false);
    if (key === "spare-requests") {
      navigate("/admin/spare-requests", { replace: true });
    } else if (key === "technician-history") {
      navigate("/admin/technician-history", { replace: true });
    } else if (key === "overview") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate(`/admin/dashboard?tab=${key}`, { replace: true });
    }
  };

  const handleTechDetailBack = () => {
    if (location.state?.from === "team") {
      navigate("/admin/dashboard?tab=team");
    } else {
      navigate("/admin/technician-history");
    }
  };

  const handleChecksheetBack = () => {
    navigate("/admin/dashboard?tab=checksheet");
  };

  const kpi = useKpi(requests);
  const techPerf = useTechPerf(requests);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach((r) => { map[r.category] = (map[r.category] ?? 0) + 1; });
    return Object.entries(map)
      .map(([key, count]) => ({ name: (CATEGORY_LABEL as Record<string, string>)[key] ?? key, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  const priorityData = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach((r) => { map[r.priority] = (map[r.priority] ?? 0) + 1; });
    return Object.entries(map).map(([key, value]) => ({
      name: (PRIORITY_LABEL as Record<string, string>)[key] ?? key,
      value,
      color: PRIORITY_COLORS[key] ?? "#888",
    }));
  }, [requests]);

  const statusPipeline = useMemo(() => {
    const ORDER = ["open", "assess", "waiting", "doing", "done", "qc1", "qc2", "complete"] as const;
    return ORDER.map((s) => ({ key: s, label: STATUS_LABEL[s], count: requests.filter((r) => r.status === s).length }));
  }, [requests]);

  const urgentJobs = useMemo(() =>
    requests
      .filter((r) => r.status !== "complete" && (r.priority === "critical" || r.priority === "high"))
      .sort((a, b) => hoursAgo(b.reported_time) - hoursAgo(a.reported_time))
      .slice(0, 8),
    [requests]);

  const maxPipelineCount = Math.max(...statusPipeline.map((s) => s.count), 1);

  const activeNavItem = NAV_ITEMS.find((n) => n.key === activeNav) || NAV_ITEMS[0];

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 z-30 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-primary-foreground hover:bg-white/10"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="เปิด/ปิดเมนู"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
            <Wrench className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Admin Dashboard</div>
            <h1 className="font-bold truncate">ผู้จัดการฝ่ายซ่อมบำรุง · ADMIN001</h1>
          </div>

          {/* KPI chips — hidden on small screens */}
          <div className="hidden xl:flex items-center gap-2">
            {kpi.critical > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/40 px-3 py-1 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-400 priority-pulse" />
                วิกฤติ {kpi.critical}
              </span>
            )}
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              ทั้งหมด {kpi.total} งาน
            </span>
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Content ──────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 lg:static lg:z-auto",
            "w-64 h-full shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border shadow-2xl lg:shadow-none",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* User card */}
          <div className="p-4 border-b border-sidebar-border shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-secondary-foreground font-bold text-sm shrink-0">
                ผ
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">ผู้จัดการฝ่ายซ่อมบำรุง</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">ADMIN001 · Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground p-1 shrink-0"
              aria-label="ปิดเมนู"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0 p-3 space-y-3 overflow-y-auto">
            {ADMIN_NAV_GROUPS.map((group, groupIdx) => (
              <div key={group.title} className={cn("space-y-1", groupIdx > 0 && "pt-2.5 border-t border-sidebar-border/40")}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/50 px-3 py-1 flex items-center gap-1.5">
                  <span className="shrink-0">{group.icon}</span>
                  <span>{group.title}</span>
                </p>
                {group.items.map((item) => {
                  const isActive = activeNav === item.key;
                  const pendingBadge = item.key === "spare-requests" ? MOCK_SPARE_PART_REQUESTS.filter(r => r.status === "pending").length : 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavSelect(item.key)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-semibold"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <span className={cn("shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")}>
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{item.label}</p>
                          {pendingBadge > 0 && (
                            <span
                              className={cn(
                                "min-w-5 h-5 px-1 rounded-full text-[11px] font-bold font-sans leading-none pb-0.5 pl-px flex items-center justify-center select-none tabular-nums shadow-sm transition-all",
                                isActive
                                  ? "bg-red-500 text-white ring-2 ring-white"
                                  : "bg-red-500 text-white ring-1 ring-white/20"
                              )}
                            >
                              {pendingBadge}
                            </span>
                          )}
                        </div>
                        <p className={cn("text-[11px] truncate", isActive ? "text-sidebar-primary-foreground/70" : "text-sidebar-foreground/50")}>
                          {item.sublabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Mini KPI summary at bottom */}
          <div className="p-3 border-t border-sidebar-border space-y-2 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-1">สรุปด่วน</p>
            {[
              { label: "งานทั้งหมด", value: kpi.total, dot: "bg-primary" },
              { label: "งานวิกฤติ", value: kpi.critical, dot: "bg-red-500" },
              { label: "ค้างเกิน 24 ชม.", value: kpi.overdue, dot: "bg-orange-500" },
              { label: "เสร็จสิ้น", value: kpi.complete, dot: "bg-emerald-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between px-1 text-xs text-sidebar-foreground/70">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  <span>{s.label}</span>
                </div>
                <span className="font-semibold tabular-nums text-sidebar-foreground">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-sidebar-border shrink-0">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Page title bar */}
          {!isTechDetail && (
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {isChecksheetSystem ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleChecksheetBack}
                      className="gap-1.5 -ml-1 sm:-ml-2 text-xs font-medium text-muted-foreground hover:text-foreground h-9 px-2.5 sm:px-3 shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      ย้อนกลับ
                    </Button>
                    <div className="h-4 w-px bg-border shrink-0" />
                    <div className="h-6 w-6 rounded grid place-items-center text-primary shrink-0">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-sm leading-none truncate">
                        ระบบเช็คชีท
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        จัดการ Template & บันทึกการตรวจสอบ
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-6 w-6 rounded grid place-items-center text-primary shrink-0">{activeNavItem.icon}</div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-sm leading-none truncate">{activeNavItem.label}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{activeNavItem.sublabel}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Right-side summary stat pills for Team tab */}
              {activeNav === "team" && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-card rounded-lg border border-border px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium leading-none">ช่างทั้งหมด</p>
                      <p className="text-xs font-bold text-foreground tabular-nums leading-tight mt-0.5">24 คน</p>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border border-border px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Briefcase className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium leading-none">งานทั้งหมด</p>
                      <p className="text-xs font-bold text-foreground tabular-nums leading-tight mt-0.5">42 งาน</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-3.5 sm:p-5 lg:p-6 animate-slide-up">
            {isChecksheetSystem ? (
              <Checksheet
                embedded
                onBack={handleChecksheetBack}
              />
            ) : isTechDetail && techId ? (
              <TechnicianDetail
                embedded
                id={techId}
                onBack={handleTechDetailBack}
              />
            ) : (
              <>
                {activeNav === "overview" && (
                  <OverviewSection kpi={kpi} categoryData={categoryData} priorityData={priorityData} />
                )}
                {activeNav === "pipeline" && (
                  <PipelineSection statusPipeline={statusPipeline} urgentJobs={urgentJobs} maxPipelineCount={maxPipelineCount} />
                )}
                {activeNav === "team" && (
                  <TeamSection
                    onViewDetail={(techId) =>
                      navigate(`/admin/technician/${techId}`, { state: { from: "team" } })
                    }
                  />
                )}
                {activeNav === "spare" && <SpareSection navigate={navigate} onNavigateNav={handleNavSelect} />}
                {activeNav === "checksheet" && <ChecksheetSection navigate={navigate} />}
                {activeNav === "spare-requests" && <AdminSpareRequests embedded />}
                {activeNav === "technician-history" && <TechnicianHistory embedded />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
