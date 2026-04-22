import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Wrench, ClipboardList, HardHat, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Role = "technician" | "requester";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("technician");
  const [username, setUsername] = useState("somsak.t");
  const [password, setPassword] = useState("demo1234");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    sessionStorage.setItem(
      "fixflow_user",
      JSON.stringify({
        emp_id: role === "technician" ? "TECH001" : "REQ042",
        name: role === "technician" ? "สมศักดิ์ ช่างไฟ" : "นภดล ฝ่ายผลิต",
        role,
        department: role === "technician" ? "Maintenance" : "ฝ่ายผลิต",
        skills: ["electrical", "facility"],
      }),
    );
    toast.success(`ยินดีต้อนรับ ${role === "technician" ? "ช่างซ่อมบำรุง" : "ผู้แจ้งซ่อม"}`);
    navigate(role === "technician" ? "/board" : "/request");
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Hero side */}
      <section className="relative hidden lg:flex bg-gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 industrial-stripe opacity-30" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-secondary grid place-items-center shadow-glow">
              <Wrench className="h-6 w-6 text-secondary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FixFlow</h1>
              <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
                Maintenance Operations
              </p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-5xl font-bold leading-tight">
            ดึงงาน.<br />
            ซ่อมเสร็จ.<br />
            <span className="text-secondary">ไลน์เดิน.</span>
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            กระดานงานแบบ Kanban ให้ช่างหน้างานรับงานเองได้ทันที
            ลดคอขวดที่หัวหน้างาน ตอบสนองได้รวดเร็วทุกที่ทุกเวลา
          </p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <span>ISO 55001 Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <HardHat className="h-4 w-4 text-secondary" />
              <span>Mobile-first</span>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-primary-foreground/50">
          © 2026 FixFlow CMMS · Designed for Industrial Operations
        </div>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">FixFlow CMMS</h1>
          </div>

          <header>
            <h2 className="text-3xl font-bold">เข้าสู่ระบบ</h2>
            <p className="text-muted-foreground mt-1">เลือกบทบาทของคุณเพื่อเริ่มทำงาน</p>
          </header>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              active={role === "technician"}
              onClick={() => setRole("technician")}
              icon={<Wrench className="h-6 w-6" />}
              title="ช่างซ่อมบำรุง"
              subtitle="Technician"
            />
            <RoleCard
              active={role === "requester"}
              onClick={() => setRole("requester")}
              icon={<ClipboardList className="h-6 w-6" />}
              title="ผู้แจ้งซ่อม"
              subtitle="Requester"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">รหัสพนักงาน / ชื่อผู้ใช้</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น TECH001"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              เข้าสู่ระบบ
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              เดโม: กรอกอะไรก็ได้แล้วกดเข้าสู่ระบบ
            </p>
          </form>
        </div>
      </section>
    </main>
  );
};

function RoleCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all border-2 ${
        active
          ? "border-primary bg-primary/5 shadow-card"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div
        className={`h-10 w-10 rounded-md grid place-items-center mb-2 ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </Card>
  );
}

export default Login;
