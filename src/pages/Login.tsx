import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Wrench, ClipboardList, HardHat, ShieldCheck,
  BarChart3, ClipboardCheck, TrendingUp, Crown,
} from "lucide-react";
import { toast } from "sonner";

type Role = "technician" | "requester" | "admin" | "qc" | "executive" | "superadmin";

const ROLE_CONFIG: Record<
  Role,
  { username: string; password: string; emp_id: string; name: string; department: string; navTarget: string; label: string }
> = {
  technician: { username: "somsak.t",  password: "demo1234", emp_id: "TECH001",  name: "สมศักดิ์ ช่างไฟ",         department: "Maintenance",       navTarget: "/board",               label: "ช่างซ่อมบำรุง" },
  requester:  { username: "nophon.r",  password: "demo1234", emp_id: "REQ042",   name: "นภดล ฝ่ายผลิต",          department: "ฝ่ายผลิต",          navTarget: "/request",             label: "ผู้แจ้งซ่อม" },
  admin:      { username: "admin",     password: "demo1234", emp_id: "ADMIN001", name: "ผู้จัดการฝ่ายซ่อมบำรุง", department: "Management",        navTarget: "/admin/dashboard",     label: "ผู้ดูแลระบบ" },
  qc:         { username: "qc",        password: "demo1234", emp_id: "QC001",    name: "ณัฐพงศ์ QC",             department: "ฝ่ายควบคุมคุณภาพ", navTarget: "/qc/dashboard",        label: "เจ้าหน้าที่ QC" },
  executive:  { username: "executive", password: "demo1234", emp_id: "EXEC001",  name: "ผู้บริหาร",              department: "Executive",         navTarget: "/executive/dashboard", label: "ผู้บริหาร" },
  superadmin: { username: "superadmin", password: "demo1234", emp_id: "SA001",   name: "System Superadmin",        department: "IT",                navTarget: "/superadmin/dashboard", label: "Superadmin" },
};

const ROLE_CARDS: { role: Role; icon: React.ReactNode; title: string; subtitle: string; color: string }[] = [
  { role: "technician", icon: <Wrench className="h-6 w-6" />,         title: "ช่างซ่อมบำรุง",  subtitle: "Technician", color: "text-blue-600 bg-blue-50" },
  { role: "requester",  icon: <ClipboardList className="h-6 w-6" />,  title: "ผู้แจ้งซ่อม",    subtitle: "Requester",  color: "text-gray-600 bg-gray-50" },
  { role: "admin",      icon: <BarChart3 className="h-6 w-6" />,      title: "ผู้ดูแลระบบ",    subtitle: "Admin",      color: "text-orange-600 bg-orange-50" },
  { role: "qc",         icon: <ClipboardCheck className="h-6 w-6" />, title: "เจ้าหน้าที่ QC", subtitle: "QC Officer", color: "text-violet-600 bg-violet-50" },
  { role: "executive",  icon: <TrendingUp className="h-6 w-6" />,     title: "ผู้บริหาร",      subtitle: "Executive",  color: "text-emerald-600 bg-emerald-50" },
  { role: "superadmin", icon: <Crown className="h-6 w-6" />,          title: "Superadmin",   subtitle: "Full Access", color: "text-amber-600 bg-amber-50" },
];

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("technician");
  const [username, setUsername] = useState(ROLE_CONFIG.technician.username);
  const [password, setPassword] = useState("demo1234");

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setUsername(ROLE_CONFIG[newRole].username);
    setPassword("demo1234");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    const cfg = ROLE_CONFIG[role];
    sessionStorage.setItem(
      "fixflow_user",
      JSON.stringify({
        emp_id: cfg.emp_id,
        name: cfg.name,
        department: cfg.department,
        role,
        skills: role === "technician" ? ["electrical", "facility"] : [],
      }),
    );
    toast.success(`ยินดีต้อนรับ ${cfg.label} · ${cfg.name}`);
    navigate(cfg.navTarget);
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ── Hero ── */}
      <section className="relative hidden lg:flex bg-gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 industrial-stripe opacity-30" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-secondary grid place-items-center shadow-glow">
            <Wrench className="h-6 w-6 text-secondary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FixFlow</h1>
            <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">Maintenance Operations</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-5xl font-bold leading-tight">
            ดึงงาน.<br />ซ่อมเสร็จ.<br />
            <span className="text-secondary">ไลน์เดิน.</span>
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            กระดานงานแบบ Kanban ให้ช่างหน้างานรับงานเองได้ทันที
            ลดคอขวดที่หัวหน้างาน ตอบสนองได้รวดเร็วทุกที่ทุกเวลา
          </p>
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-secondary" /> ISO 55001 Ready</span>
            <span className="flex items-center gap-2"><HardHat className="h-4 w-4 text-secondary" /> Mobile-first</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {ROLE_CARDS.map((r) => (
              <span key={r.role} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                {r.icon}<span className="opacity-80">{r.title}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-primary-foreground/50">
          © 2026 FixFlow CMMS · Designed for Industrial Operations
        </div>
      </section>

      {/* ── Form ── */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">FixFlow CMMS</h1>
          </div>

          <header>
            <h2 className="text-3xl font-bold">เข้าสู่ระบบ</h2>
            <p className="text-muted-foreground mt-1">เลือกบทบาทของคุณเพื่อเริ่มทำงาน</p>
          </header>

          {/* Role selector: row 1 (3 cards) + row 2 (2 cards) */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {ROLE_CARDS.slice(0, 3).map((r) => (
                <RoleCard key={r.role} active={role === r.role} onClick={() => handleRoleChange(r.role)}
                  icon={r.icon} title={r.title} subtitle={r.subtitle} activeColor={r.color} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_CARDS.slice(3, 6).map((r) => (
                <RoleCard key={r.role} active={role === r.role} onClick={() => handleRoleChange(r.role)}
                  icon={r.icon} title={r.title} subtitle={r.subtitle} activeColor={r.color} />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">รหัสพนักงาน / ชื่อผู้ใช้</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="เช่น TECH001" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11" />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full">เข้าสู่ระบบ</Button>

            {/* Demo account list */}
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground text-center mb-2">Demo accounts — password: demo1234</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                {Object.entries(ROLE_CONFIG).map(([r, cfg]) => (
                  <div key={r} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    <span className="font-mono">{cfg.username}</span>
                    <span className="opacity-60">— {cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

function RoleCard({
  active, onClick, icon, title, subtitle, activeColor,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  title: string; subtitle: string; activeColor: string;
}) {
  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all border-2 ${
        active ? "border-primary bg-primary/5 shadow-card" : "border-border hover:border-primary/40"
      }`}
    >
      <div className={`h-10 w-10 rounded-md grid place-items-center mb-2 ${active ? activeColor : "bg-muted text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </Card>
  );
}

export default Login;
