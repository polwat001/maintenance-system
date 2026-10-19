import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, LogOut, BarChart3, AlertTriangle, Clock,
  CheckCircle2, Package, Activity, Wrench, Users,
  DollarSign, Target, ArrowUp, ArrowDown, Minus,
  ShieldCheck, LayoutDashboard,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MOCK_SPARE_PARTS_EXTENDED,
  MOCK_PURCHASE_ORDERS,
  MOCK_SPARE_PART_REQUESTS,
  MOCK_QC_SCHEDULES,
  MOCK_USER_APPROVAL_REQUESTS,
  CATEGORY_LABEL,
  WorkRequest,
} from "@/lib/mockData";
import { useRequests } from "@/lib/requestStore";
import ExecutiveLayout from "@/components/ExecutiveLayout";

// ─── Mock monthly trend data ──────────────────────────────────────────────────

const MONTHLY_TREND = [
  { month: "พ.ค.", requests: 42, completed: 38, cost: 45000 },
  { month: "มิ.ย.", requests: 38, completed: 35, cost: 38000 },
  { month: "ก.ค.", requests: 55, completed: 48, cost: 62000 },
  { month: "ส.ค.", requests: 47, completed: 42, cost: 51000 },
  { month: "ก.ย.", requests: 63, completed: 55, cost: 72000 },
  { month: "ต.ค. (MTD)", requests: 18, completed: 12, cost: 21000 },
];

const BUDGET = 80000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Delta({ value, unit = "" }: { value: number; unit?: string }) {
  if (value > 0) return <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-semibold"><ArrowUp className="h-3 w-3" />{value}{unit}</span>;
  if (value < 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs font-semibold"><ArrowDown className="h-3 w-3" />{Math.abs(value)}{unit}</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="h-3 w-3" />0{unit}</span>;
}

function KpiCard({
  icon, label, value, sub, accentClass, trend,
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; accentClass?: string; trend?: number;
}) {
  return (
    <Card className={cn("relative overflow-hidden p-5 border-l-4 transition-shadow hover:shadow-md", accentClass ?? "border-l-primary")}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="h-11 w-11 rounded-xl grid place-items-center shrink-0 bg-muted text-muted-foreground">{icon}</div>
      </div>
      {trend !== undefined && (
        <div className="mt-2">
          <Delta value={trend} unit="%" />
        </div>
      )}
    </Card>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; fill?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((e, i) => <p key={i} style={{ color: e.fill }}>{e.name}: <strong>{e.value?.toLocaleString("th-TH")}</strong></p>)}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const requests = useRequests();

  const kpi = useMemo(() => {
    const total = requests.length;
    const critical = requests.filter((r) => r.priority === "critical" && r.status !== "complete").length;
    const complete = requests.filter((r) => r.status === "complete").length;
    const overdue = requests.filter((r) => r.status !== "complete" && (Date.now() - new Date(r.reported_time).getTime()) > 86400000 * 2).length;
    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;
    const pendingPO = MOCK_PURCHASE_ORDERS.filter((p) => p.status === "pending").length;
    const pendingApproval = MOCK_USER_APPROVAL_REQUESTS.filter((a) => a.status === "pending").length;
    const currentMonthCost = MONTHLY_TREND[MONTHLY_TREND.length - 1].cost;
    const budgetUsed = Math.round((currentMonthCost / BUDGET) * 100);
    const spareOutOfStock = MOCK_SPARE_PARTS_EXTENDED.filter((p) => p.stock === 0).length;
    const qcCompliance = MOCK_QC_SCHEDULES.length > 0
      ? Math.round((MOCK_QC_SCHEDULES.filter((s) => s.status === "done").length / MOCK_QC_SCHEDULES.length) * 100) : 0;
    return { total, critical, complete, overdue, completionRate, pendingPO, pendingApproval, currentMonthCost, budgetUsed, spareOutOfStock, qcCompliance };
  }, [requests]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach((r) => { map[r.category] = (map[r.category] ?? 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: (CATEGORY_LABEL as Record<string, string>)[k] ?? k, value: v }));
  }, [requests]);

  const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

  // Top spare parts by cost
  const topSpares = useMemo(() =>
    [...MOCK_SPARE_PARTS_EXTENDED]
      .sort((a, b) => (b.stock * b.unit_price) - (a.stock * a.unit_price))
      .slice(0, 5)
      .map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name, value: p.stock * p.unit_price })),
    []
  );

  return (
    <ExecutiveLayout
      title="สรุปภาพรวมสำหรับผู้บริหาร"
      subtitle="Executive KPIs, Budget Allocation & Machine Reliability"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs"
            onClick={() => navigate("/executive/purchase-approval")}
          >
            <Package className="h-3.5 w-3.5" /> PO รออนุมัติ
            {kpi.pendingPO > 0 && <span className="bg-white/20 rounded-full px-1.5 py-0.2 text-[10px] font-bold">{kpi.pendingPO}</span>}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs"
            onClick={() => navigate("/executive/user-approval")}
          >
            <Users className="h-3.5 w-3.5" /> สิทธิ์รออนุมัติ
            {kpi.pendingApproval > 0 && <span className="bg-white/20 rounded-full px-1.5 py-0.2 text-[10px] font-bold">{kpi.pendingApproval}</span>}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">

        {/* Quick Action */}
        <div className="flex flex-wrap gap-3">
          <Button
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => navigate("/executive/purchase-approval")}
          >
            <Package className="h-4 w-4" />อนุมัติการสั่งซื้อ
            {kpi.pendingPO > 0 && <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{kpi.pendingPO}</span>}
          </Button>
          <Button
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => navigate("/executive/user-approval")}
          >
            <Users className="h-4 w-4" />อนุมัติสิทธิ์ผู้ใช้
            {kpi.pendingApproval > 0 && <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{kpi.pendingApproval}</span>}
          </Button>
        </div>

        {/* KPI Row */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary grid place-items-center"><BarChart3 className="h-4 w-4" /></div>
            <h2 className="font-semibold text-base">ตัวชี้วัดหลัก (Executive KPIs)</h2>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard icon={<DollarSign className="h-5 w-5 text-violet-500" />} label="งบอะไหล่เดือนนี้" value={`฿${kpi.currentMonthCost.toLocaleString("th-TH")}`} sub={`${kpi.budgetUsed}% ของงบประมาณ`} accentClass="border-l-violet-500" />
            <KpiCard icon={<Clock className="h-5 w-5 text-orange-500" />} label="MTTR เฉลี่ย" value="3.2 ชม." sub="ลดลง 0.4 ชม. เทียบเดือนก่อน" accentClass="border-l-orange-500" trend={-0.4} />
            <KpiCard icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} label="OEE / Uptime" value="94.8%" sub="สูงกว่าเป้า 92%" accentClass="border-l-emerald-500" trend={2.8} />
            <KpiCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="งานวิกฤติค้าง" value={kpi.critical} sub="เกิน SLA ที่กำหนด" accentClass="border-l-red-500" />
            <KpiCard icon={<Users className="h-5 w-5 text-blue-500" />} label="ประสิทธิภาพทีม" value={`${(kpi.total / 3).toFixed(1)} งาน`} sub="เฉลี่ยงานต่อช่าง" accentClass="border-l-blue-500" />
            <KpiCard icon={<CheckCircle2 className="h-5 w-5 text-teal-600" />} label="อัตราปิดงาน" value={`${kpi.completionRate}%`} sub={`${kpi.complete}/${kpi.total} งานทั้งหมด`} accentClass="border-l-teal-500" trend={5} />
          </div>
        </section>

        {/* Alert Banner */}
        {(kpi.critical > 0 || kpi.pendingPO > 0) && (
          <div className="flex flex-wrap gap-3">
            {kpi.critical > 0 && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-1 min-w-0">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">มี {kpi.critical} งานวิกฤติที่ยังค้างอยู่</p>
                  <p className="text-xs text-red-500">ต้องดำเนินการทันที</p>
                </div>
              </div>
            )}
            {kpi.pendingPO > 0 && (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-1 min-w-0 cursor-pointer" onClick={() => navigate("/executive/purchase-approval")}>
                <Package className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">PO {kpi.pendingPO} รายการรออนุมัติ</p>
                  <p className="text-xs text-amber-500">คลิกเพื่อดำเนินการ</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Row 1 */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded bg-primary/10 text-primary grid place-items-center"><Activity className="h-3.5 w-3.5" /></div>
              <h3 className="font-semibold text-sm">Trend งานซ่อมรายเดือน</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MONTHLY_TREND} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 18% 87%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="งานทั้งหมด" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="เสร็จสิ้น" />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded bg-violet-100 text-violet-600 grid place-items-center"><DollarSign className="h-3.5 w-3.5" /></div>
              <h3 className="font-semibold text-sm">ค่าใช้จ่ายรายเดือน vs. งบประมาณ</h3>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">งบประมาณ: ฿{BUDGET.toLocaleString("th-TH")}</span>
                <span className="font-semibold text-violet-600">{kpi.budgetUsed}% ใช้ไปแล้ว</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", kpi.budgetUsed > 90 ? "bg-red-500" : kpi.budgetUsed > 75 ? "bg-amber-500" : "bg-violet-500")} style={{ width: `${kpi.budgetUsed}%` }} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={MONTHLY_TREND} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 18% 87%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} formatter={(v: number) => `฿${v.toLocaleString("th-TH")}`} />
                <Bar dataKey="cost" fill="hsl(270 60% 55%)" radius={[4, 4, 0, 0]} name="ค่าใช้จ่าย" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* Charts Row 2 */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded bg-primary/10 text-primary grid place-items-center"><BarChart3 className="h-3.5 w-3.5" /></div>
              <h3 className="font-semibold text-sm">สัดส่วนตามหมวดงาน</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
                  {categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded bg-amber-100 text-amber-600 grid place-items-center"><Package className="h-3.5 w-3.5" /></div>
              <h3 className="font-semibold text-sm">อะไหล่มูลค่าสูงสุด Top 5</h3>
            </div>
            <div className="space-y-3">
              {topSpares.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-4 shrink-0 font-bold text-muted-foreground">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.round((s.value / topSpares[0].value) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums shrink-0">฿{s.value.toLocaleString("th-TH")}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded bg-emerald-100 text-emerald-600 grid place-items-center"><Target className="h-3.5 w-3.5" /></div>
              <h3 className="font-semibold text-sm">สรุปด่วน</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "งานค้าง > 48 ชม.", value: kpi.overdue, dot: "bg-red-500", bad: kpi.overdue > 0 },
                { label: "อะไหล่หมดสต็อก", value: kpi.spareOutOfStock, dot: "bg-orange-500", bad: kpi.spareOutOfStock > 0 },
                { label: "PO รออนุมัติ", value: kpi.pendingPO, dot: "bg-amber-500", bad: kpi.pendingPO > 0 },
                { label: "สิทธิ์รออนุมัติ", value: kpi.pendingApproval, dot: "bg-blue-500", bad: false },
                { label: "QC Compliance", value: `${kpi.qcCompliance}%`, dot: kpi.qcCompliance >= 80 ? "bg-emerald-500" : "bg-amber-500", bad: kpi.qcCompliance < 80 },
              ].map((item) => (
                <div key={item.label} className={cn("flex items-center justify-between rounded-lg px-3 py-2", item.bad ? "bg-red-50" : "bg-muted/40")}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", item.dot)} />
                    <span>{item.label}</span>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", item.bad ? "text-red-600" : "text-foreground")}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Navigation */}
        <div className="flex flex-wrap gap-3 pb-4">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/executive/purchase-approval")}>
            <Package className="h-4 w-4" />จัดการ PO
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/executive/user-approval")}>
            <Users className="h-4 w-4" />จัดการสิทธิ์
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/dashboard")}>
            <LayoutDashboard className="h-4 w-4" />Admin Dashboard
          </Button>
        </div>
      </div>
    </ExecutiveLayout>
  );
}
