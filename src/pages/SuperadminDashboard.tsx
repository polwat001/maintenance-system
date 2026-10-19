import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Crown, LogOut, LayoutDashboard, Users, Wrench, Package,
  ClipboardCheck, ShieldCheck, Settings, FileText, Menu, X,
  ChevronRight, ChevronDown, BarChart3, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, Activity, DollarSign, Target, ArrowUp, ArrowDown,
  Minus, UserCheck, ShoppingCart, Eye, Pencil,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  PRIORITY_LABEL,
  TECHNICIAN_MAP,
  MOCK_SPARE_PARTS_EXTENDED,
  MOCK_PURCHASE_ORDERS,
  MOCK_SPARE_PART_REQUESTS,
  MOCK_QC_SCHEDULES,
  MOCK_USER_APPROVAL_REQUESTS,
  MOCK_SYSTEM_USERS,
  MOCK_CHECKSHEET_TEMPLATES,
  MOCK_CHECKSHEET_RECORDS,
  WorkRequest,
  timeAgo,
} from "@/lib/mockData";
import { useRequests } from "@/lib/requestStore";
import WorkOrderManagementUnified from "./WorkOrderManagementUnified";
import { WorkRequestsSection } from "@/components/superadmin/WorkRequestsSection";
import { SparePartsSection } from "@/components/superadmin/SparePartsSection";
import { ApprovalsSection } from "@/components/superadmin/ApprovalsSection";
import { SettingsSection } from "@/components/superadmin/SettingsSection";
import { AuditLogSection } from "@/components/superadmin/AuditLogSection";
import { QCSection } from "@/components/superadmin/QCSection";
import SuperadminUserManagement from "./SuperadminUserManagement";
import DispatchSection from "@/components/superadmin/DispatchSection";

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

// ─── Monthly Trend ─────────────────────────────────────────────────────────────
const MONTHLY_TREND = [
  { month: "พ.ค.", requests: 42, completed: 38, cost: 45000 },
  { month: "มิ.ย.", requests: 38, completed: 35, cost: 38000 },
  { month: "ก.ค.", requests: 55, completed: 48, cost: 62000 },
  { month: "ส.ค.", requests: 47, completed: 42, cost: 51000 },
  { month: "ก.ย.", requests: 63, completed: 55, cost: 72000 },
  { month: "ต.ค. (MTD)", requests: 18, completed: 12, cost: 21000 },
];
const BUDGET = 80000;

// ─── Nav items grouped by category ──────────────────────────────────────────
type NavKey = "overview" | "users" | "work-requests" | "work-orders-unified" | "dispatch" | "spare-parts" | "qc" | "approvals" | "settings" | "audit-log";

type NavSubItem = {
  key: NavKey;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
};

type NavItem = {
  key: NavKey;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavSubItem[];
};

const NAV_GROUPS: {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}[] = [
  {
    title: "ภาพรวม & งานซ่อม",
    icon: <Wrench className="h-3 w-3 text-amber-400" />,
    items: [
      { key: "overview",      label: "ภาพรวมระบบ",        sublabel: "System Overview",       icon: <LayoutDashboard className="h-5 w-5" /> },
      {
        key: "work-requests",
        label: "จัดการงานซ่อมบำรุง",
        sublabel: "มอบหมาย & ปรับสถานะ",
        icon: <Wrench className="h-5 w-5" />,
        children: [
          {
            key: "dispatch",
            label: "กระดานมอบหมายงาน",
            sublabel: "Dispatch Board",
            icon: <UserCheck className="h-4 w-4" />,
          },
        ],
      },
      { key: "spare-parts",   label: "จัดการอะไหล่",       sublabel: "Spare Parts & Stock",   icon: <Package className="h-5 w-5" /> },
      { key: "qc",            label: "ระบบ QC",            sublabel: "Quality Control",       icon: <ClipboardCheck className="h-5 w-5" /> },
    ],
  },
  {
    title: "การจัดการ & อนุมัติ",
    icon: <ShieldCheck className="h-3 w-3 text-blue-400" />,
    items: [
      { key: "users",         label: "จัดการผู้ใช้งาน", sublabel: "User Management",       icon: <Users className="h-5 w-5" /> },
      { key: "approvals",     label: "การอนุมัติ",      sublabel: "PO & User Access",      icon: <ShieldCheck className="h-5 w-5" /> },
    ],
  },
  {
    title: "ระบบ & ตรวจสอบ",
    icon: <Settings className="h-3 w-3 text-slate-400" />,
    items: [
      { key: "settings",      label: "ตั้งค่าระบบ",     sublabel: "System Configuration",  icon: <Settings className="h-5 w-5" /> },
      { key: "audit-log",     label: "Audit Log",       sublabel: "ประวัติการเปลี่ยนแปลง", icon: <FileText className="h-5 w-5" /> },
    ],
  },
];

const NAV_ITEMS: (NavItem | NavSubItem)[] = NAV_GROUPS.flatMap((g) =>
  g.items.flatMap((item) => (item.children ? [item, ...item.children] : [item]))
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function Delta({ value, unit = "" }: { value: number; unit?: string }) {
  if (value > 0) return <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-semibold"><ArrowUp className="h-3 w-3" />{value}{unit}</span>;
  if (value < 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs font-semibold"><ArrowDown className="h-3 w-3" />{Math.abs(value)}{unit}</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="h-3 w-3" />0{unit}</span>;
}

function KpiCard({
  icon, label, value, sub, accentClass, pulse, trend,
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; accentClass?: string; pulse?: boolean; trend?: number;
}) {
  return (
    <Card className={cn("relative overflow-hidden p-3 border-l-4 transition-all hover:shadow-xs", accentClass ?? "border-l-primary")}>
      <div className="flex items-start justify-between gap-1.5">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold tabular-nums leading-none text-foreground">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sub}</p>}
        </div>
        <div className="h-7 w-7 rounded-md grid place-items-center shrink-0 bg-muted/80 text-muted-foreground">{icon}</div>
      </div>
      {pulse && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
      {trend !== undefined && <div className="mt-1"><Delta value={trend} unit="%" /></div>}
    </Card>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div className="h-5 w-5 rounded bg-primary/10 text-primary grid place-items-center shrink-0">{icon}</div>
      <h2 className="font-semibold text-xs text-foreground tracking-tight">{title}</h2>
    </div>
  );
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; fill?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-2.5 py-1.5 shadow-md text-[11px]">
      {label && <p className="font-semibold mb-0.5 text-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.fill }}>
          {entry.name ?? "จำนวน"}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Overview Section ─────────────────────────────────────────────────────────
function OverviewSection({ requests }: { requests: WorkRequest[] }) {
  const total = requests.length;
  const critical = requests.filter((r) => r.priority === "critical").length;
  const overdue = requests.filter((r) => r.status !== "complete" && hoursAgo(r.reported_time) > 24).length;
  const complete = requests.filter((r) => r.status === "complete").length;
  const waiting = requests.filter((r) => r.status === "waiting").length;
  const doing = requests.filter((r) => r.status === "doing").length;
  const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

  const pendingPO = MOCK_PURCHASE_ORDERS.filter((p) => p.status === "pending").length;
  const pendingUserApproval = MOCK_USER_APPROVAL_REQUESTS.filter((a) => a.status === "pending").length;
  const lowStock = MOCK_SPARE_PARTS_EXTENDED.filter((p) => p.stock < p.min_stock).length;
  const activeUsers = MOCK_SYSTEM_USERS.filter((u) => u.status === "active").length;
  const totalUsers = MOCK_SYSTEM_USERS.length;
  const totalSpareValue = MOCK_SPARE_PARTS_EXTENDED.reduce((s, p) => s + p.stock * p.unit_price, 0);

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
  const maxPipeline = Math.max(...statusPipeline.map((s) => s.count), 1);

  const currentMonthCost = MONTHLY_TREND[MONTHLY_TREND.length - 1].cost;

  // Checksheet
  const csTemplates = MOCK_CHECKSHEET_TEMPLATES.filter((t) => t.active).length;
  const csRecords = MOCK_CHECKSHEET_RECORDS;
  const csFlagged = csRecords.filter((r) => r.status === "flagged").length;
  const csCompliance = csRecords.length > 0
    ? Math.round((csRecords.filter((r) => r.status === "complete").length / csRecords.length) * 100)
    : 0;

  // QC
  const qcScheduled = MOCK_QC_SCHEDULES.filter((s) => s.status === "scheduled").length;
  const qcMissed = MOCK_QC_SCHEDULES.filter((s) => s.status === "missed").length;

  return (
    <div className="space-y-2.5">
      {/* ── Row 1: Unified 8-Item Top Metrics Bar ── */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        <KpiCard icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />} label="งานซ่อมทั้งหมด" value={total} sub={`วิกฤติ ${critical} · ค้าง ${overdue}`} accentClass="border-l-primary" pulse={critical > 0} />
        <KpiCard icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} label="อัตราเสร็จสิ้น" value={`${completionRate}%`} sub={`${complete}/${total} งาน`} accentClass="border-l-emerald-500" trend={5} />
        <KpiCard icon={<Users className="h-3.5 w-3.5 text-blue-500" />} label="ผู้ใช้งานระบบ" value={activeUsers} sub={`ทั้งหมด ${totalUsers} บัญชี`} accentClass="border-l-blue-500" />
        <KpiCard icon={<Package className="h-3.5 w-3.5 text-amber-500" />} label="อะไหล่ต่ำ/หมด" value={lowStock} sub={`฿${(totalSpareValue / 1000).toFixed(0)}k`} accentClass="border-l-amber-500" pulse={lowStock > 0} />

        {/* 4 Action Alert Cards */}
        {[
          { label: "PO รออนุมัติ", value: pendingPO, icon: <ShoppingCart className="h-3.5 w-3.5" />, color: "bg-amber-50 text-amber-700 border-amber-200", pulse: pendingPO > 0 },
          { label: "User รออนุมัติ", value: pendingUserApproval, icon: <UserCheck className="h-3.5 w-3.5" />, color: "bg-blue-50 text-blue-700 border-blue-200", pulse: pendingUserApproval > 0 },
          { label: "งานค้างเกิน 24 ชม.", value: overdue, icon: <Clock className="h-3.5 w-3.5" />, color: "bg-orange-50 text-orange-700 border-orange-200", pulse: overdue > 0 },
          { label: "QC พลาด/ยังไม่ตรวจ", value: qcMissed, icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "bg-red-50 text-red-700 border-red-200", pulse: qcMissed > 0 },
        ].map((item) => (
          <Card key={item.label} className={cn("relative p-2.5 border flex items-center gap-2 transition-shadow hover:shadow-xs", item.color)}>
            <div className="h-7 w-7 rounded-md grid place-items-center bg-white/70 shrink-0">{item.icon}</div>
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums leading-none">{item.value}</p>
              <p className="text-[10px] font-medium truncate mt-0.5">{item.label}</p>
            </div>
            {item.pulse && item.value > 0 && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
          </Card>
        ))}
      </div>

      {/* ── Row 2: Pipeline (Left 5 cols) + Categories (4 cols) + Priority (3 cols) ── */}
      <div className="grid gap-2.5 lg:grid-cols-12">
        {/* Status Pipeline */}
        <Card className="p-3 lg:col-span-5 flex flex-col justify-between">
          <SectionTitle icon={<ChevronRight className="h-3 w-3" />} title="Status Pipeline — การไหลของงาน" />
          <div className="space-y-1.5">
            {statusPipeline.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="w-20 shrink-0 text-[11px] font-medium text-right text-muted-foreground truncate">{s.label}</div>
                <div className="flex-1 bg-muted rounded-full h-3.5 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-1 text-[9px] font-bold text-white transition-all duration-700"
                    style={{
                      width: `${Math.max((s.count / maxPipeline) * 100, s.count > 0 ? 8 : 0)}%`,
                      backgroundColor: STATUS_BAR_COLOR[s.key],
                    }}
                  >
                    {s.count > 0 && s.count}
                  </div>
                </div>
                <div className={cn("w-5 text-[11px] font-semibold tabular-nums text-right", s.count === 0 && "text-muted-foreground")}>{s.count}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Categories Bar Chart */}
        <Card className="p-3 lg:col-span-4 flex flex-col justify-between">
          <SectionTitle icon={<BarChart3 className="h-3 w-3" />} title="งานแยกตามหมวดหมู่" />
          <div className="h-[155px]">
            <ResponsiveContainer width="100%" height={155}>
              <BarChart data={categoryData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 18% 87%)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={36} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" fill="hsl(215 60% 40%)" radius={[3, 3, 0, 0]} name="จำนวนงาน" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Donut Chart */}
        <Card className="p-3 lg:col-span-3 flex flex-col justify-between">
          <SectionTitle icon={<AlertTriangle className="h-3 w-3" />} title="สัดส่วนความสำคัญ" />
          <div className="h-[155px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={155}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="45%" innerRadius={38} outerRadius={56} paddingAngle={3} dataKey="value">
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border bg-card px-2.5 py-1.5 shadow-md text-[10px]">
                        <p style={{ color: payload[0].payload.color }} className="font-semibold">{payload[0].name}</p>
                        <p>จำนวน: <strong>{payload[0].value as number}</strong></p>
                      </div>
                    ) : null
                  }
                />
                <Legend iconType="circle" iconSize={6} formatter={(v) => <span style={{ fontSize: 9 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Row 3: Monthly Trend (7 cols) + Budget & Modules (5 cols) ── */}
      <div className="grid gap-2.5 lg:grid-cols-12">
        {/* Monthly Trend Chart */}
        <Card className="p-3 lg:col-span-7 flex flex-col justify-between">
          <SectionTitle icon={<TrendingUp className="h-3 w-3" />} title="แนวโน้มการแจ้งซ่อมและปิดงานรายเดือน" />
          <div className="h-[145px]">
            <ResponsiveContainer width="100%" height={145}>
              <LineChart data={MONTHLY_TREND} margin={{ top: 2, right: 12, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 18% 87%)" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="requests" stroke="hsl(215 60% 40%)" name="แจ้งซ่อม" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="completed" stroke="hsl(142 65% 38%)" name="เสร็จสิ้น" strokeWidth={2} dot={{ r: 2 }} />
                <Legend iconType="circle" iconSize={6} formatter={(v) => <span style={{ fontSize: 9 }}>{v}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget & Modules Summary Card */}
        <Card className="p-3 lg:col-span-5 flex flex-col justify-between">
          <SectionTitle icon={<DollarSign className="h-3 w-3" />} title="งบประมาณซ่อมบำรุง & สรุปภาพรวมย่อย" />
          
          <div className="space-y-1.5 my-1">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-lg font-bold tabular-nums">฿{currentMonthCost.toLocaleString("th-TH")}</span>
                <span className="text-[10px] text-muted-foreground ml-1">/ ฿{BUDGET.toLocaleString("th-TH")}</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full",
                currentMonthCost / BUDGET > 0.8 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              )}>
                ใช้ไป {Math.round((currentMonthCost / BUDGET) * 100)}%
              </span>
            </div>

            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", currentMonthCost / BUDGET > 0.8 ? "bg-red-500" : "bg-emerald-500")}
                style={{ width: `${Math.min((currentMonthCost / BUDGET) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* 4 Mini Module Summary chips */}
          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t text-center">
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">ทีมช่าง</p>
              <p className="text-xs font-bold text-foreground leading-tight mt-0.5">{Object.keys(TECHNICIAN_MAP).length} คน</p>
              <p className="text-[9px] text-muted-foreground">ทำอยู่ {doing}</p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">อะไหล่</p>
              <p className="text-xs font-bold text-foreground leading-tight mt-0.5">{MOCK_SPARE_PARTS_EXTENDED.length}</p>
              <p className="text-[9px] text-muted-foreground">ค้าง {MOCK_SPARE_PART_REQUESTS.filter(r => r.status === "pending").length}</p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">เช็คชีท</p>
              <p className="text-xs font-bold text-foreground leading-tight mt-0.5">{csTemplates} Tpl</p>
              <p className="text-[9px] text-muted-foreground">{csCompliance}%</p>
            </div>
            <div className="p-1.5 rounded-md bg-muted/40">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">QC นัดหมาย</p>
              <p className="text-xs font-bold text-foreground leading-tight mt-0.5">{qcScheduled}</p>
              <p className="text-[9px] text-muted-foreground">พลาด {qcMissed}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const requests = useRequests();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentTab = (searchParams.get("tab") as NavKey) || "overview";
  const [activeNav, setActiveNavState] = useState<NavKey>(currentTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => ({
    "work-requests": currentTab === "work-requests" || currentTab === "dispatch",
  }));

  useEffect(() => {
    let tab = searchParams.get("tab") as NavKey;
    if (tab === "work-orders-unified") {
      tab = "work-requests";
    }
    if (tab && (NAV_ITEMS.some((n) => n.key === tab) || tab === "dispatch")) {
      setActiveNavState(tab);
      if (tab === "work-requests" || tab === "dispatch") {
        setExpandedMenus((prev) => ({ ...prev, "work-requests": true }));
      } else {
        setExpandedMenus((prev) => ({ ...prev, "work-requests": false }));
      }
    }
  }, [searchParams]);

  const setActiveNav = (tab: NavKey) => {
    setActiveNavState(tab);
    if (tab === "work-requests" || tab === "dispatch") {
      setExpandedMenus((prev) => ({ ...prev, "work-requests": true }));
    } else {
      setExpandedMenus((prev) => ({ ...prev, "work-requests": false }));
    }
    navigate(`/superadmin/dashboard?tab=${tab}`, { replace: true });
  };

  const kpi = useMemo(() => {
    const total = requests.length;
    const critical = requests.filter((r) => r.priority === "critical").length;
    const overdue = requests.filter((r) => r.status !== "complete" && hoursAgo(r.reported_time) > 24).length;
    const complete = requests.filter((r) => r.status === "complete").length;
    return { total, critical, overdue, complete };
  }, [requests]);

  const pendingPO = MOCK_PURCHASE_ORDERS.filter((p) => p.status === "pending").length;
  const pendingUser = MOCK_USER_APPROVAL_REQUESTS.filter((a) => a.status === "pending").length;
  const totalPending = pendingPO + pendingUser;


  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 z-30 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="px-4 py-3 flex items-center gap-3 text-white">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="เปิด/ปิดเมนู"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="h-9 w-9 rounded-md bg-amber-400 grid place-items-center shrink-0">
            <Crown className="h-5 w-5 text-amber-900" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-white/70">Superadmin Console</div>
            <h1 className="font-bold truncate">FixFlow CMMS · SA001</h1>
          </div>

          {/* Quick badges */}
          <div className="hidden xl:flex items-center gap-2">
            {kpi.critical > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/30 border border-red-400/40 px-3 py-1 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                วิกฤติ {kpi.critical}
              </span>
            )}
            {totalPending > 0 && (
              <span className="rounded-full bg-amber-500/30 border border-amber-400/40 px-3 py-1 text-xs font-semibold">
                รออนุมัติ {totalPending}
              </span>
            )}
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              ทั้งหมด {kpi.total} งาน
            </span>
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 lg:static lg:z-auto",
            "w-56 h-full shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border shadow-2xl lg:shadow-none",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* User card */}
          <div className="p-3 border-b border-sidebar-border shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full grid place-items-center text-amber-900 font-bold text-xs shrink-0" style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                SA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">Superadmin</p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">SA001 · Full Access</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground p-1 shrink-0"
              aria-label="ปิดเมนู"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0 p-2 space-y-2.5 overflow-y-auto">
            {(() => {
              const unassignedCount = requests.filter((r) => !r.assigned_to || r.status === "open").length;

              return NAV_GROUPS.map((group, groupIdx) => (
                <div key={group.title} className={cn("space-y-0.5", groupIdx > 0 && "pt-2 border-t border-sidebar-border/40")}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/50 px-2 py-1 flex items-center gap-1.5">
                    <span className="shrink-0">{group.icon}</span>
                    <span>{group.title}</span>
                  </p>
                  {group.items.map((item) => {
                    const isActive = activeNav === item.key;
                    const isChildActive = item.children?.some((c) => activeNav === c.key);
                    const hasChildren = Boolean(item.children && item.children.length > 0);
                    const isExpanded = hasChildren
                      ? Boolean((isActive || isChildActive) && (expandedMenus[item.key] ?? true))
                      : false;

                    // When sub-menu is collapsed, combine unassigned dispatch count into parent badge
                    const rawBadge = item.key === "approvals"
                      ? totalPending
                      : item.key === "work-requests"
                      ? (isExpanded ? kpi.critical : kpi.critical + unassignedCount)
                      : 0;

                    // Always show badge whenever count > 0 (persistent notification)
                    const shouldShowBadge = rawBadge > 0;

                    return (
                      <div key={item.key} className="space-y-0.5">
                        <button
                          onClick={() => {
                            if (item.href) {
                              navigate(item.href);
                            } else {
                              if (hasChildren) {
                                if (isActive) {
                                  // Toggle accordion if already active on parent page
                                  setExpandedMenus((prev) => ({
                                    ...prev,
                                    [item.key]: !isExpanded,
                                  }));
                                } else {
                                  setActiveNav(item.key);
                                  setExpandedMenus((prev) => ({
                                    ...prev,
                                    [item.key]: true,
                                  }));
                                }
                              } else {
                                setActiveNav(item.key);
                              }
                            }
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-semibold"
                              : isChildActive
                              ? "text-sidebar-foreground font-semibold bg-sidebar-accent/50"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <span className={cn("shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")}>
                            {item.icon}
                          </span>
                          <p className="text-xs font-medium truncate flex-1 min-w-0">{item.label}</p>
                          {shouldShowBadge && (
                            <span
                              key={`${item.key}-${rawBadge}`}
                              className={cn(
                                "min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold font-['Inter',sans-serif] leading-none flex items-center justify-center select-none tabular-nums shadow-xs transition-all shrink-0 animate-badge-pop ml-auto",
                                isActive
                                  ? "bg-red-500 text-white ring-2 ring-white shadow-md"
                                  : isChildActive
                                  ? "bg-red-500 text-white ring-2 ring-white/60 shadow-sm"
                                  : "bg-red-500 text-white ring-1 ring-white/20"
                              )}
                            >
                              {rawBadge}
                            </span>
                          )}
                        </button>

                        {/* Sub-items (กระดานมอบหมายงาน) with Silky-Smooth Grid Accordion */}
                        {hasChildren && (
                          <div
                            className={cn(
                              "sidebar-submenu-wrapper",
                              isExpanded && "is-open"
                            )}
                          >
                            <div className="sidebar-submenu-inner">
                              <div className="ml-4 pl-2.5 border-l-2 border-sidebar-border/60 space-y-0.5 pt-1">
                                {item.children!.map((sub) => {
                                  const isSubActive = activeNav === sub.key;
                                  const subBadge = sub.key === "dispatch" ? unassignedCount : 0;

                                  return (
                                    <button
                                      key={sub.key}
                                      onClick={() => {
                                        setActiveNav(sub.key);
                                        setSidebarOpen(false);
                                      }}
                                      className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all duration-150 text-xs",
                                        isSubActive
                                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-semibold"
                                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                      )}
                                    >
                                      <span className={cn("shrink-0", isSubActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")}>
                                        {sub.icon}
                                      </span>
                                      <span className="truncate flex-1 text-[11px] font-medium">{sub.label}</span>
                                      {subBadge > 0 && (
                                        <span
                                          key={`${sub.key}-${subBadge}`}
                                          className={cn(
                                            "min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold font-['Inter',sans-serif] leading-none flex items-center justify-center select-none tabular-nums shrink-0 animate-badge-pop transition-all ml-auto",
                                            isSubActive
                                              ? "bg-red-500 text-white ring-2 ring-white shadow-md"
                                              : "bg-red-500 text-white ring-1 ring-white/20 shadow-xs"
                                          )}
                                        >
                                          {subBadge}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </nav>

          {/* Mini KPI at bottom */}
          <div className="p-2.5 border-t border-sidebar-border space-y-1 shrink-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-1">สรุปด่วน</p>
            {[
              { label: "งานทั้งหมด", value: kpi.total, dot: "bg-primary" },
              { label: "งานวิกฤติ", value: kpi.critical, dot: "bg-red-500" },
              { label: "ผู้ใช้งาน", value: MOCK_SYSTEM_USERS.filter(u => u.status === "active").length, dot: "bg-blue-500" },
              { label: "เสร็จสิ้น", value: kpi.complete, dot: "bg-emerald-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between px-1 text-[11px] text-sidebar-foreground/70">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                  <span>{s.label}</span>
                </div>
                <span className="font-semibold tabular-nums text-sidebar-foreground">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-sidebar-border shrink-0">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <div className="p-3.5 sm:p-5">
            {activeNav === "overview" && <OverviewSection requests={requests} />}
            {activeNav === "users" && <SuperadminUserManagement embedded />}
            {activeNav === "work-requests" && <WorkOrderManagementUnified embedded />}
            {activeNav === "dispatch" && (
              <DispatchSection
                onNavigateToWorkOrders={() => setActiveNav("work-requests")}
                onSwitchToTableView={() => setActiveNav("work-requests")}
                totalRequestsCount={requests.length}
              />
            )}
            {activeNav === "spare-parts" && <SparePartsSection />}
            {activeNav === "qc" && <QCSection />}
            {activeNav === "approvals" && <ApprovalsSection />}
            {activeNav === "settings" && <SettingsSection />}
            {activeNav === "audit-log" && <AuditLogSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
