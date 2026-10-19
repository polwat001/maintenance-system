import { useState, useMemo } from "react";
import {
  Users, Briefcase, BarChart2, Search, Eye, ChevronLeft, ChevronRight,
  UserCheck, ShieldCheck, Filter
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MOCK_TEAM_TECHNICIANS, TeamTechnician } from "@/lib/teamMockData";

interface TeamSectionProps {
  onViewDetail: (techId: string) => void;
}

// Bar colors matching the gradient transition in Image 1
const BAR_COLORS = [
  "#1d4ed8", // 1. Dark Blue
  "#2563eb", // 2. Royal Blue
  "#0284c7", // 3. Sky Blue
  "#0ea5e9", // 4. Light Sky Blue
  "#06b6d4", // 5. Cyan
  "#14b8a6", // 6. Teal
  "#34d399", // 7. Mint Green
  "#4ade80", // 8. Light Green
  "#84cc16", // 9. Lime Green
  "#a3e635", // 10. Yellow Green
];

// Custom 2-line tick for Bar Chart X-Axis
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload || !payload.value) return null;
  const parts = payload.value.split("||");
  const name = parts[0] || "";
  const role = parts[1] || "";

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#334155" fontSize={10.5} fontWeight={600}>
        {name}
      </text>
      <text x={0} y={0} dy={25} textAnchor="middle" fill="#64748b" fontSize={8.5}>
        {role.length > 18 ? `${role.slice(0, 17)}...` : role}
      </text>
    </g>
  );
};

// Custom value label on top of bar
const renderCustomBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 8} fill="#1e293b" textAnchor="middle" fontSize={11} fontWeight={700}>
      {value}
    </text>
  );
};

export default function TeamSection({ onViewDetail }: TeamSectionProps) {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter technicians
  const filteredTechs = useMemo(() => {
    return MOCK_TEAM_TECHNICIANS.filter((t) => {
      const matchSearch =
        search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.role.toLowerCase().includes(search.toLowerCase()) ||
        t.department.toLowerCase().includes(search.toLowerCase());

      const matchDept =
        selectedDept === "all" ||
        t.department.includes(selectedDept) ||
        t.role.includes(selectedDept);

      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "assigned" && t.jobsStats.assigned > 0) ||
        (selectedStatus === "done" && t.jobsStats.done > 0) ||
        (selectedStatus === "doing" && t.jobsStats.inProgress > 0);

      return matchSearch && matchDept && matchStatus;
    });
  }, [search, selectedDept, selectedStatus]);

  // Overall totals across all 24 technicians
  const totalTechnicians = MOCK_TEAM_TECHNICIANS.length;
  const totalAssigned = MOCK_TEAM_TECHNICIANS.reduce((sum, t) => sum + t.jobsStats.assigned, 0); // 18
  const totalDone = MOCK_TEAM_TECHNICIANS.reduce((sum, t) => sum + t.jobsStats.done, 0);         // 14
  const totalInProgress = MOCK_TEAM_TECHNICIANS.reduce((sum, t) => sum + t.jobsStats.inProgress, 0); // 10
  const totalJobs = totalAssigned + totalDone + totalInProgress; // 42

  const assignedPct = ((totalAssigned / totalJobs) * 100).toFixed(1); // 42.9%
  const donePct = ((totalDone / totalJobs) * 100).toFixed(1);         // 33.3%
  const inProgressPct = ((totalInProgress / totalJobs) * 100).toFixed(1); // 23.8%

  // Data for the top 10 bar chart (sorted descending by total jobs)
  const top10BarData = useMemo(() => {
    const list = [...MOCK_TEAM_TECHNICIANS]
      .sort((a, b) => b.jobsStats.total - a.jobsStats.total)
      .slice(0, 10);

    return list.map((t, idx) => ({
      nameWithRole: `${t.displayName}||${t.role}`,
      total: t.jobsStats.total,
      color: BAR_COLORS[idx % BAR_COLORS.length],
    }));
  }, []);

  // Pagination for the table
  const totalPages = Math.ceil(filteredTechs.length / pageSize) || 1;
  const paginatedTechs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTechs.slice(start, start + pageSize);
  }, [filteredTechs, currentPage]);

  const maxRowTotal = 6; // Maximum jobs among technicians to scale the horizontal bar length

  return (
    <div className="space-y-4 sm:space-y-5 animate-slide-up pb-8">
      {/* ── Row 1: Bar Chart (Left) + Overview Donut (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Card: Bar Chart (~70% width -> 8 cols on lg) */}
        <Card className="lg:col-span-8 p-4 sm:p-5 shadow-xs border border-border flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <BarChart2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">จำนวนงานรวมของช่างแต่ละคน</h3>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-44">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อช่าง..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={selectedDept}
                  onValueChange={setSelectedDept}
                >
                  <SelectTrigger aria-label="เลือกแผนก" className="flex-1 sm:flex-none h-8 w-auto min-w-[130px] rounded-lg border-input bg-muted/40 px-2.5 text-xs font-medium">
                    <SelectValue placeholder="ทุกแผนก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกแผนก</SelectItem>
                    <SelectItem value="ไฟฟ้า">งานระบบไฟฟ้า</SelectItem>
                    <SelectItem value="เครื่องกล">งานระบบเครื่องกล</SelectItem>
                    <SelectItem value="ปรับอากาศ">งานระบบปรับอากาศ</SelectItem>
                    <SelectItem value="โครงสร้าง">งานโครงสร้างและโลหะ</SelectItem>
                    <SelectItem value="อัตโนมัติ">งานระบบอัตโนมัติ</SelectItem>
                    <SelectItem value="สุขาภิบาล">งานระบบสุขาภิบาล</SelectItem>
                    <SelectItem value="บริการอาคาร">งานบริการอาคาร</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger aria-label="เลือกสถานะ" className="flex-1 sm:flex-none h-8 w-auto min-w-[110px] rounded-lg border-input bg-muted/40 px-2.5 text-xs font-medium">
                    <SelectValue placeholder="ทุกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="assigned">รับงาน</SelectItem>
                    <SelectItem value="done">เสร็จสิ้น</SelectItem>
                    <SelectItem value="doing">ดำเนินการ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="w-full overflow-x-auto pb-1">
            <div className="min-w-[560px] sm:min-w-full h-[225px] sm:h-[240px] pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10BarData}
                margin={{ top: 20, right: 8, left: -22, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <YAxis
                  domain={[0, 8]}
                  ticks={[0, 2, 4, 6, 8]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "จำนวนงาน",
                    angle: -90,
                    position: "insideLeft",
                    offset: 14,
                    fontSize: 9,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <XAxis
                  dataKey="nameWithRole"
                  interval={0}
                  tick={<CustomXAxisTick />}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const [n, r] = d.nameWithRole.split("||");
                    return (
                      <div className="bg-popover border border-border p-2 rounded-lg shadow-md text-xs">
                        <p className="font-bold text-foreground">{n} ({r})</p>
                        <p className="text-muted-foreground mt-0.5">จำนวนงานรวม: <strong className="text-blue-600">{d.total}</strong> งาน</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="total"
                  radius={[4, 4, 0, 0]}
                  label={renderCustomBarLabel}
                  maxBarSize={38}
                >
                  {top10BarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Right Card: Overview Summary (~30% width -> 4 cols on lg) */}
        <Card className="lg:col-span-4 p-4 sm:p-5 shadow-xs border border-border flex flex-col justify-between">
          <h3 className="font-bold text-sm text-foreground mb-3">สรุปภาพรวม</h3>

          <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-between gap-4 my-auto">
            {/* Legend Items */}
            <div className="space-y-2.5 w-full sm:w-1/2 lg:w-full">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-muted-foreground font-medium">รับงาน</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-foreground tabular-nums">{totalAssigned} งาน</span>
                  <span className="text-muted-foreground text-[11px] w-12 text-right tabular-nums">{assignedPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-muted-foreground font-medium">เสร็จสิ้น</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-foreground tabular-nums">{totalDone} งาน</span>
                  <span className="text-muted-foreground text-[11px] w-12 text-right tabular-nums">{donePct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-muted-foreground font-medium">ดำเนินการ</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-foreground tabular-nums">{totalInProgress} งาน</span>
                  <span className="text-muted-foreground text-[11px] w-12 text-right tabular-nums">{inProgressPct}%</span>
                </div>
              </div>
            </div>

            {/* Donut Chart with Center Text */}
            <div className="relative w-full sm:w-1/2 lg:w-full h-[150px] flex items-center justify-center">
              <PieChart width={170} height={150}>
                <Pie
                  data={[
                    { name: "รับงาน", value: totalAssigned, color: "#2563eb" },
                    { name: "เสร็จสิ้น", value: totalDone, color: "#10b981" },
                    { name: "ดำเนินการ", value: totalInProgress, color: "#f59e0b" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
              </PieChart>

              {/* Center Text inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-foreground tabular-nums leading-none">
                  {totalJobs}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  งาน
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Bottom Card: Technician Details Table (แสดง 10 คนแรก) ── */}
      <Card className="p-4 sm:p-5 shadow-xs border border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-bold text-sm text-foreground">
            รายละเอียดช่าง (แสดง 10 คนแรก)
          </h3>
        </div>

        {/* Desktop/Tablet Table View (>= sm) */}
        <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs min-w-[680px]">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground font-semibold pb-2">
                <th className="py-2.5 px-3 text-center w-12">อันดับ</th>
                <th className="py-2.5 px-3 min-w-[200px]">ชื่อช่าง / แผนก</th>
                <th className="py-2.5 px-3 text-center min-w-[100px]">จำนวนงานรวม</th>
                <th className="py-2.5 px-3 min-w-[260px]">
                  <div className="flex items-center gap-4">
                    <span>สถานะงาน</span>
                    <div className="flex items-center gap-3 font-normal text-[11px]">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600" /> รับงาน
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> เสร็จสิ้น
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> ดำเนินการ
                      </span>
                    </div>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right min-w-[120px]">ดูรายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedTechs.map((tech, index) => {
                const rank = (currentPage - 1) * pageSize + index + 1;
                const total = tech.jobsStats.total;
                // Bar length scales with total jobs
                const barWidthPercent = Math.min(100, Math.max(25, (total / maxRowTotal) * 100));

                return (
                  <tr key={tech.id} className="hover:bg-muted/30 transition-colors">
                    {/* อันดับ */}
                    <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums">
                      {rank}
                    </td>

                    {/* ชื่อช่าง / แผนก */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs",
                          tech.avatarColor
                        )}>
                          {tech.avatarChar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate leading-snug">
                            {tech.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {tech.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* จำนวนงานรวม */}
                    <td className="py-3 px-3 text-center font-bold text-sm text-foreground tabular-nums">
                      {total}
                    </td>

                    {/* สถานะงาน (Stacked Progress Bar) */}
                    <td className="py-3 px-3">
                      <div className="w-full max-w-[340px]">
                        <div
                          className="flex items-center h-6 rounded-md overflow-hidden shadow-2xs"
                          style={{ width: `${barWidthPercent}%` }}
                        >
                          {/* รับงาน (Blue) */}
                          {tech.jobsStats.assigned > 0 ? (
                            <div
                              style={{ flex: tech.jobsStats.assigned }}
                              className="h-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center tabular-nums"
                            >
                              {tech.jobsStats.assigned}
                            </div>
                          ) : (
                            <div className="h-full w-8 sm:w-9 bg-blue-50/80 text-blue-400 font-medium text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                              0
                            </div>
                          )}

                          {/* เสร็จสิ้น (Green) */}
                          {tech.jobsStats.done > 0 ? (
                            <div
                              style={{ flex: tech.jobsStats.done }}
                              className="h-full bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center tabular-nums"
                            >
                              {tech.jobsStats.done}
                            </div>
                          ) : (
                            <div className="h-full w-8 sm:w-9 bg-emerald-50/80 text-emerald-500 font-medium text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                              0
                            </div>
                          )}

                          {/* ดำเนินการ (Orange) */}
                          {tech.jobsStats.inProgress > 0 ? (
                            <div
                              style={{ flex: tech.jobsStats.inProgress }}
                              className="h-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center tabular-nums"
                            >
                              {tech.jobsStats.inProgress}
                            </div>
                          ) : (
                            <div className="h-full w-8 sm:w-9 bg-amber-50/80 text-amber-500 font-medium text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                              0
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ดูรายละเอียด Button */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onViewDetail(tech.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-xs font-medium transition-all shadow-2xs active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>ดูรายละเอียด</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (< sm) */}
        <div className="sm:hidden space-y-3">
          {paginatedTechs.map((tech, index) => {
            const rank = (currentPage - 1) * pageSize + index + 1;
            const total = tech.jobsStats.total;

            return (
              <div
                key={tech.id}
                className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-3"
              >
                {/* Header: Rank, Avatar, Name & Total */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      #{rank}
                    </span>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs",
                        tech.avatarColor
                      )}
                    >
                      {tech.avatarChar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate leading-snug">
                        {tech.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tech.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      {total} งาน
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span className="font-medium">สถานะงาน</span>
                    <div className="flex items-center gap-2.5 text-[10px]">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600" /> รับงาน
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> เสร็จสิ้น
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> ดำเนินการ
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center h-6 rounded-md overflow-hidden shadow-2xs w-full bg-slate-100 dark:bg-slate-800">
                    {tech.jobsStats.assigned > 0 ? (
                      <div
                        style={{ flex: tech.jobsStats.assigned }}
                        className="h-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center tabular-nums"
                      >
                        {tech.jobsStats.assigned}
                      </div>
                    ) : (
                      <div className="h-full w-8 bg-blue-50/80 text-blue-400 font-medium text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                        0
                      </div>
                    )}
                    {tech.jobsStats.done > 0 ? (
                      <div
                        style={{ flex: tech.jobsStats.done }}
                        className="h-full bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center tabular-nums"
                      >
                        {tech.jobsStats.done}
                      </div>
                    ) : (
                      <div className="h-full w-8 bg-emerald-50/80 text-emerald-500 font-medium text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                        0
                      </div>
                    )}
                    {tech.jobsStats.inProgress > 0 ? (
                      <div
                        style={{ flex: tech.jobsStats.inProgress }}
                        className="h-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center tabular-nums"
                      >
                        {tech.jobsStats.inProgress}
                      </div>
                    ) : (
                      <div className="h-full w-8 bg-amber-50/80 text-amber-500 font-medium text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                        0
                      </div>
                    )}
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => onViewDetail(tech.id)}
                  className="w-full py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  <span>ดูรายละเอียด</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/80 mt-2">
          <p className="text-xs text-muted-foreground">
            แสดง {paginatedTechs.length} จากทั้งหมด {filteredTechs.length} คน
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                  currentPage === pageNum
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "border border-border text-foreground hover:bg-muted"
                )}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="หน้าถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { TeamSection };
