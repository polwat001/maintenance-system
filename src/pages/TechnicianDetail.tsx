import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Search, Bell, Phone, Mail, Building2, Calendar,
  Wrench, Snowflake, Plug, ClipboardCheck, Shield, Edit3,
  ClipboardList, Clock, StickyNote, Eye, ChevronLeft, ChevronRight,
  Plus, CheckCircle2, AlertCircle
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MOCK_TEAM_TECHNICIANS,
  getTechnicianJobs,
  TechnicianJobItem,
  TeamTechnician,
} from "@/lib/teamMockData";
import { toast } from "sonner";

interface TechnicianDetailProps {
  embedded?: boolean;
  id?: string;
  onBack?: () => void;
}

// Male technician avatar illustration matching Image 2
function TechnicianAvatarIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={cn("relative rounded-full overflow-hidden bg-sky-50 border-2 border-sky-100 flex items-center justify-center shrink-0 shadow-xs", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="#EBF4FE" />
        {/* Hair back */}
        <path d="M26 44 C26 22 38 15 50 15 C62 15 74 22 74 44 Z" fill="#1E293B" />
        {/* Neck */}
        <rect x="44" y="56" width="12" height="15" fill="#F8CBA6" />
        {/* Face */}
        <ellipse cx="50" cy="46" rx="19" ry="20" fill="#FDD9B5" />
        {/* Hair front/bangs */}
        <path d="M29 37 C33 24 44 20 52 20 C62 20 70 26 71 34 C66 31 59 32 54 35 C48 33 39 34 29 37 Z" fill="#1E293B" />
        {/* Sideburns */}
        <path d="M30 40 L32 47 L35 44 Z" fill="#1E293B" />
        <path d="M70 40 L68 47 L65 44 Z" fill="#1E293B" />
        {/* Ears */}
        <circle cx="31" cy="47" r="3.5" fill="#F8CBA6" />
        <circle cx="69" cy="47" r="3.5" fill="#F8CBA6" />
        {/* Eyes */}
        <ellipse cx="43" cy="45" rx="2" ry="2.2" fill="#1E293B" />
        <ellipse cx="57" cy="45" rx="2" ry="2.2" fill="#1E293B" />
        {/* Eyebrows */}
        <path d="M39 41 Q43 39 47 41" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M53 41 Q57 39 61 41" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Nose */}
        <path d="M50 46 L49 50 L52 50" stroke="#E29D7C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Smile */}
        <path d="M45 54 Q50 58 55 54" stroke="#B45309" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* Shirt (Blue technician service uniform) */}
        <path d="M20 100 C22 75 33 68 50 68 C67 68 78 75 80 100 Z" fill="#2563EB" />
        {/* Collar & Inner Shirt */}
        <path d="M41 68 L50 82 L59 68 L50 73 Z" fill="#1D4ED8" />
        <path d="M36 68 L46 77 L43 68 Z" fill="#3B82F6" />
        <path d="M64 68 L54 77 L57 68 Z" fill="#3B82F6" />
        {/* Shirt pocket line / seam */}
        <path d="M32 82 L40 82" stroke="#1D4ED8" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function TechnicianDetail({
  embedded = false,
  id: propId,
  onBack,
}: TechnicianDetailProps = {}) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Determine current technician ID (default to TECH004 if not matched)
  const currentId = propId || params.id || "TECH004";
  const tech: TeamTechnician = useMemo(() => {
    return MOCK_TEAM_TECHNICIANS.find((t) => t.id === currentId) || MOCK_TEAM_TECHNICIANS[2]; // fallback to Anont
  }, [currentId]);

  // Load jobs for this technician
  const jobs: TechnicianJobItem[] = useMemo(() => {
    return getTechnicianJobs(tech.id);
  }, [tech.id]);

  // Table filters & search
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [jobSort, setJobSort] = useState("latest");
  const [tablePage, setTablePage] = useState(1);
  const [notes, setNotes] = useState<string[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState("");

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/admin/dashboard?tab=team");
    }
  };

  // Filtered jobs for the table
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        jobSearch === "" ||
        j.id.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.clientOrLocation.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.detail.toLowerCase().includes(jobSearch.toLowerCase());

      const matchStatus =
        jobStatusFilter === "all" || j.status === jobStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [jobs, jobSearch, jobStatusFilter]);

  // For Anont in Image 2, the total is exactly 6 jobs (2 assigned, 1 done, 3 inProgress)
  const assignedCount = tech.id === "TECH004" ? 2 : tech.jobsStats.assigned;
  const doneCount = tech.id === "TECH004" ? 1 : tech.jobsStats.done;
  const inProgressCount = tech.id === "TECH004" ? 3 : tech.jobsStats.inProgress;
  const totalCount = assignedCount + doneCount + inProgressCount; // 6 for Anont

  const assignedPct = ((assignedCount / totalCount) * 100).toFixed(1);
  const donePct = ((doneCount / totalCount) * 100).toFixed(1);
  const inProgressPct = ((inProgressCount / totalCount) * 100).toFixed(1);

  // Category breakdown for Anont: General Repair 3, HVAC 2, Installation 1, Inspection 0
  const catStats = tech.categoryStats;
  const maxCat = Math.max(catStats.generalRepair, catStats.hvac, catStats.installation, catStats.inspection, 1);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes((prev) => [...prev, newNote.trim()]);
    setNewNote("");
    setIsAddNoteOpen(false);
    toast.success("เพิ่มหมายเหตุเรียบร้อยแล้ว");
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-slide-up pb-8">
      {/* ── Top Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Back Link */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors w-fit group py-1"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>กลับไปยังรายชื่อช่างทั้งหมด</span>
        </button>

        {/* Top Right Controls (Search, Bell, SA avatar) */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52 sm:flex-initial">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาช่าง..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-card focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-2xs"
            />
          </div>

          <div className="relative shrink-0">
            <button
              className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="h-4 w-4" />
            </button>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </div>

          <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs grid place-items-center cursor-pointer shadow-2xs shrink-0">
            SA
          </div>
        </div>
      </div>

      {/* ── Top Profile Row: Profile Card (Left) + Total Jobs Card (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Profile Card (~68% width -> 8 cols on lg) */}
        <Card className="lg:col-span-8 p-4 sm:p-5 lg:p-6 shadow-xs border border-border">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
            {/* Left Sub-Column: Avatar, Name, Badges, Contacts */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-3.5 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-3.5">
                <TechnicianAvatarIllustration className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h2 className="text-base sm:text-xl font-bold text-foreground">
                      {tech.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ออนไลน์
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">
                      {tech.role}
                    </span>
                    {tech.tag && (
                      <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md shrink-0">
                        {tech.tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact list */}
              <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-14 shrink-0">เบอร์โทร</span>
                  <strong className="text-foreground font-medium">{tech.phone}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-14 shrink-0">อีเมล</span>
                  <strong className="text-foreground font-medium truncate">{tech.email}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-14 shrink-0">แผนก</span>
                  <strong className="text-foreground font-medium truncate">{tech.department}</strong>
                </div>
              </div>
            </div>

            {/* Right Sub-Column: Experience / Skills & Start Date */}
            <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-border/80 pt-3.5 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground mb-2">
                  ประสบการณ์ / ความเชี่ยวชาญ
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {tech.skills.map((skill) => (
                    <li key={skill} className="flex items-start gap-1.5">
                      <span className="text-slate-400 shrink-0">•</span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 mt-2 border-t border-border/60">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  เข้าทำงานเมื่อ <strong>{tech.startDate}</strong> ({tech.experienceYears})
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Total Jobs Card (~32% width -> 4 cols on lg) */}
        <Card className="lg:col-span-4 p-4 sm:p-5 lg:p-6 shadow-xs border border-border flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center lg:mb-3 shadow-2xs shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">จำนวนงานทั้งหมด</p>
                <p className="text-2xl sm:text-3xl font-black text-foreground lg:mt-1 tabular-nums">
                  {totalCount} งาน
                </p>
              </div>
            </div>

            {/* Bottom 3-Column Mini Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-2 pt-3 sm:pt-0 lg:pt-4 border-t sm:border-t-0 lg:border-t border-border/80 text-center w-full sm:w-auto lg:w-full">
              <div className="bg-slate-50 dark:bg-slate-800/50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>รับงาน</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground mt-0.5 tabular-nums">{assignedCount}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>เสร็จสิ้น</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground mt-0.5 tabular-nums">{doneCount}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>ดำเนินการ</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground mt-0.5 tabular-nums">{inProgressCount}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Middle Row: 3 Cards (สัดส่วนสถานะงาน + งานตามหมวดหมู่ + ข้อมูลเพิ่มเติม) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* Card 1: สัดส่วนสถานะงาน (Donut Chart, ~28% -> 4 cols) */}
        <Card className="md:col-span-1 lg:col-span-4 p-4 sm:p-5 shadow-xs border border-border flex flex-col justify-between">
          <h3 className="font-bold text-xs text-foreground mb-1">สัดส่วนสถานะงาน</h3>

          <div className="flex items-center justify-between gap-2 py-2">
            {/* Donut Chart with Center Text */}
            <div className="relative w-[130px] h-[130px] shrink-0 flex items-center justify-center">
              <PieChart width={130} height={130}>
                <Pie
                  data={[
                    { name: "รับงาน", value: assignedCount, color: "#2563eb" },
                    { name: "เสร็จสิ้น", value: doneCount, color: "#10b981" },
                    { name: "ดำเนินการ", value: inProgressCount, color: "#f59e0b" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={52}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
              </PieChart>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-foreground tabular-nums leading-none">
                  {totalCount}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  งานทั้งหมด
                </span>
              </div>
            </div>

            {/* Legend list on right */}
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-muted-foreground text-[11px]">รับงาน</span>
                </div>
                <strong className="text-foreground text-[11px] tabular-nums">{assignedCount} ({assignedPct}%)</strong>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-muted-foreground text-[11px]">เสร็จสิ้น</span>
                </div>
                <strong className="text-foreground text-[11px] tabular-nums">{doneCount} ({donePct}%)</strong>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-muted-foreground text-[11px]">ดำเนินการ</span>
                </div>
                <strong className="text-foreground text-[11px] tabular-nums">{inProgressCount} ({inProgressPct}%)</strong>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: งานที่รับผิดชอบตามหมวดหมู่ (Horizontal Bars, ~42% -> 5 cols) */}
        <Card className="md:col-span-1 lg:col-span-5 p-4 sm:p-5 shadow-xs border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-xs font-bold">✧</span>
            <h3 className="font-bold text-xs text-foreground">งานที่รับผิดชอบตามหมวดหมู่</h3>
          </div>

          <div className="space-y-2.5 my-auto">
            {/* งานซ่อมทั่วไป */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 w-32 sm:w-36 shrink-0 text-muted-foreground">
                <Wrench className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="truncate">งานซ่อมทั่วไป</span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(catStats.generalRepair / maxCat) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right font-bold text-foreground tabular-nums">
                {catStats.generalRepair}
              </span>
            </div>

            {/* ระบบปรับอากาศ (HVAC) */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 w-32 sm:w-36 shrink-0 text-muted-foreground">
                <Snowflake className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                <span className="truncate">ระบบปรับอากาศ (HVAC)</span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(catStats.hvac / maxCat) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right font-bold text-foreground tabular-nums">
                {catStats.hvac}
              </span>
            </div>

            {/* งานติดตั้ง */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 w-32 sm:w-36 shrink-0 text-muted-foreground">
                <Plug className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                <span className="truncate">งานติดตั้ง</span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(catStats.installation / maxCat) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right font-bold text-foreground tabular-nums">
                {catStats.installation}
              </span>
            </div>

            {/* งานตรวจสอบ */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 w-32 sm:w-36 shrink-0 text-muted-foreground">
                <ClipboardCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">งานตรวจสอบ</span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(catStats.inspection / maxCat) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right font-bold text-muted-foreground tabular-nums">
                {catStats.inspection}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 3: ข้อมูลเพิ่มเติม (~30% -> 3 cols) */}
        <Card className="md:col-span-2 lg:col-span-3 p-4 sm:p-5 shadow-xs border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <h3 className="font-bold text-xs text-foreground">ข้อมูลเพิ่มเติม</h3>
            </div>
            {/* Tablet button at top right */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("เปิดหน้าต่างแก้ไขข้อมูลช่าง")}
              className="hidden md:inline-flex lg:hidden h-7 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold gap-1.5"
            >
              <Edit3 className="h-3 w-3" />
              <span>แก้ไขข้อมูล</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-x-6 gap-y-2 text-xs text-muted-foreground my-auto">
            <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0">
              <span>รหัสพนักงาน</span>
              <strong className="text-foreground font-semibold">{tech.emp_id}</strong>
            </div>
            <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0">
              <span>เบอร์โทรศัพท์</span>
              <strong className="text-foreground font-semibold">{tech.phone}</strong>
            </div>
            <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0">
              <span>อีเมล</span>
              <strong className="text-foreground font-semibold truncate max-w-[130px]">{tech.email}</strong>
            </div>
            <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0">
              <span>แผนก</span>
              <strong className="text-foreground font-semibold">{tech.department}</strong>
            </div>
            <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0">
              <span>ตำแหน่ง</span>
              <strong className="text-foreground font-semibold">{tech.role}</strong>
            </div>
            <div className="flex justify-between">
              <span>วันที่เข้าทำงาน</span>
              <strong className="text-foreground font-semibold">{tech.startDate}</strong>
            </div>
          </div>

          {/* Edit Info Button (mobile & desktop) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("เปิดหน้าต่างแก้ไขข้อมูลช่าง")}
            className="md:hidden lg:inline-flex w-full mt-3 h-8 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-xs font-semibold gap-1.5"
          >
            <Edit3 className="h-3 w-3" />
            <span>แก้ไขข้อมูล</span>
          </Button>
        </Card>
      </div>

      {/* ── Bottom Row: รายการงานของช่าง (Left 70%) + งานล่าสุด & หมายเหตุ (Right 30%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Card: รายการงานของช่าง (~70% -> 8 cols) */}
        <Card className="lg:col-span-8 p-4 sm:p-5 shadow-xs border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <ClipboardList className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-bold text-xs text-foreground">รายการงานของช่าง</h3>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหางาน (เลขที่งาน / ชื่อลูกค้า / รายละเอียด)..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={jobStatusFilter}
                  onValueChange={setJobStatusFilter}
                >
                  <SelectTrigger aria-label="สถานะงาน" className="flex-1 sm:flex-none h-8 w-auto min-w-[120px] rounded-lg border-input bg-muted/40 px-2.5 text-xs font-medium">
                    <SelectValue placeholder="สถานะทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                    <SelectItem value="doing">ดำเนินการ</SelectItem>
                    <SelectItem value="assigned">รับงาน</SelectItem>
                    <SelectItem value="complete">เสร็จสิ้น</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={jobSort}
                  onValueChange={setJobSort}
                >
                  <SelectTrigger aria-label="การเรียงลำดับ" className="flex-1 sm:flex-none h-8 w-auto min-w-[90px] rounded-lg border-input bg-muted/40 px-2.5 text-xs font-medium">
                    <SelectValue placeholder="ล่าสุด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">ล่าสุด</SelectItem>
                    <SelectItem value="oldest">เก่าสุด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Desktop & Tablet Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[660px]">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground font-semibold pb-2">
                  <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[100px]">เลขที่งาน</th>
                  <th className="py-2.5 px-3 min-w-[150px]">ชื่อลูกค้า / สถานที่</th>
                  <th className="py-2.5 px-3 min-w-[170px]">รายละเอียดงาน</th>
                  <th className="py-2.5 px-3 text-center min-w-[90px]">สถานะ</th>
                  <th className="py-2.5 px-3 min-w-[100px]">วันที่รับงาน</th>
                  <th className="py-2.5 px-3 min-w-[120px]">วันที่อัปเดตล่าสุด</th>
                  <th className="py-2.5 px-3 text-right w-20">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                      ไม่พบรายการงานตามเงื่อนไขที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job, idx) => (
                    <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        {job.id}
                      </td>

                      <td className="py-3 px-3 font-medium text-foreground">
                        {job.clientOrLocation}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate">
                        {job.detail}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {job.status === "doing" && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> ดำเนินการ
                          </span>
                        )}
                        {job.status === "assigned" && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> รับงาน
                          </span>
                        )}
                        {job.status === "complete" && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> เสร็จสิ้น
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {job.assignedDate}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {job.updatedDate}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => toast.info(`ดูรายละเอียดงาน ${job.id}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-foreground/80 hover:text-blue-600 hover:border-blue-300 text-[11px] font-medium transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>ดูรายละเอียด</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Jobs Card View (< sm) */}
          <div className="sm:hidden space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                ไม่พบรายการงานตามเงื่อนไขที่ค้นหา
              </div>
            ) : (
              filteredJobs.map((job, idx) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-muted text-muted-foreground font-bold text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {job.id}
                      </span>
                    </div>
                    <div>
                      {job.status === "doing" && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> ดำเนินการ
                        </span>
                      )}
                      {job.status === "assigned" && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> รับงาน
                        </span>
                      )}
                      {job.status === "complete" && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> เสร็จสิ้น
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-foreground leading-snug">{job.clientOrLocation}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.detail}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/60">
                    <span>รับงาน: {job.assignedDate}</span>
                    <span>อัปเดต: {job.updatedDate}</span>
                  </div>

                  <button
                    onClick={() => toast.info(`ดูรายละเอียดงาน ${job.id}`)}
                    className="w-full py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>ดูรายละเอียด</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/80 mt-2">
            <p className="text-xs text-muted-foreground">
              แสดง 1 - {filteredJobs.length} จากทั้งหมด {jobs.length} งาน
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground opacity-40 cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-2xs">
                1
              </button>
              <button
                disabled
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground opacity-40 cursor-not-allowed"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>

        {/* Right Side (งานล่าสุด + หมายเหตุ, ~30% -> 4 cols) */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Card 1: งานล่าสุด */}
          <Card className="p-4 sm:p-5 shadow-xs border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>งานล่าสุด</span>
              </div>
              <button
                onClick={() => toast.info("ดูรายการงานทั้งหมด")}
                className="text-[11px] text-muted-foreground hover:text-blue-600 font-medium transition-colors"
              >
                ดูทั้งหมด →
              </button>
            </div>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-2.5 pl-4 space-y-4 my-1">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="relative flex items-start justify-between gap-2 text-xs">
                  <span
                    className={cn(
                      "absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full border-2 border-background ring-2 ring-muted/50 shrink-0",
                      job.status === "doing"
                        ? "bg-amber-500"
                        : job.status === "assigned"
                        ? "bg-blue-600"
                        : "bg-emerald-500"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-[11px] truncate">
                      {job.id}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {job.detail}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                      {job.updatedDate}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.2 text-[10px] font-semibold border",
                      job.status === "doing" && "bg-amber-50 text-amber-700 border-amber-200",
                      job.status === "assigned" && "bg-blue-50 text-blue-700 border-blue-200",
                      job.status === "complete" && "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    {job.status === "doing" ? "ดำเนินการ" : job.status === "assigned" ? "รับงาน" : "เสร็จสิ้น"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 2: หมายเหตุ */}
          <Card className="p-4 sm:p-5 shadow-xs border border-border">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2">
              <StickyNote className="h-4 w-4 text-blue-600" />
              <span>หมายเหตุ</span>
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                ไม่มีหมายเหตุเพิ่มเติม
              </p>
            ) : (
              <div className="space-y-1.5 py-1">
                {notes.map((n, i) => (
                  <div key={i} className="text-xs text-foreground bg-muted/40 p-2 rounded-lg border border-border/60">
                    {n}
                  </div>
                ))}
              </div>
            )}

            {isAddNoteOpen ? (
              <div className="space-y-2 mt-2 pt-2 border-t">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="พิมพ์ข้อความหมายเหตุ..."
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => { setIsAddNoteOpen(false); setNewNote(""); }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleAddNote}
                  >
                    บันทึก
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddNoteOpen(true)}
                className="w-full mt-2 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:border-blue-400 hover:text-blue-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>เพิ่มหมายเหตุ</span>
              </button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
