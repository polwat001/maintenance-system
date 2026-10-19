import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TrendingUp, LogOut, BarChart3, Package, Users, Menu, X,
  ShieldCheck, LayoutDashboard, ChevronRight, DollarSign,
  Clock, CheckCircle2, AlertTriangle, Wrench, ShoppingCart,
  Layers, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MOCK_PURCHASE_ORDERS,
  MOCK_USER_APPROVAL_REQUESTS,
} from "@/lib/mockData";

export interface ExecutiveLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function ExecutiveLayout({
  children,
  title,
  subtitle,
  actions,
}: ExecutiveLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dynamic counts for badges
  const pendingPO = useMemo(
    () => MOCK_PURCHASE_ORDERS.filter((p) => p.status === "pending").length,
    []
  );
  const pendingUserApproval = useMemo(
    () => MOCK_USER_APPROVAL_REQUESTS.filter((a) => a.status === "pending").length,
    []
  );

  const NAV_ITEMS = [
    {
      key: "dashboard",
      label: "ภาพรวมสำหรับผู้บริหาร",
      sublabel: "Executive KPIs & Trends",
      icon: <TrendingUp className="h-5 w-5" />,
      path: "/executive/dashboard",
    },
    {
      key: "purchase-approval",
      label: "อนุมัติการสั่งซื้ออะไหล่",
      sublabel: "Purchase Orders (PO)",
      icon: <Package className="h-5 w-5" />,
      path: "/executive/purchase-approval",
      badge: pendingPO,
      badgeColor: "bg-amber-500",
    },
    {
      key: "user-approval",
      label: "อนุมัติสิทธิ์ผู้ใช้งาน",
      sublabel: "User Access Requests",
      icon: <Users className="h-5 w-5" />,
      path: "/executive/user-approval",
      badge: pendingUserApproval,
      badgeColor: "bg-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col text-slate-800">
      {/* ─── Topbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground hover:bg-white/10"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
              <TrendingUp className="h-5 w-5 text-secondary-foreground" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">FixFlow CMMS</div>
              <h1 className="font-bold text-base sm:text-lg">Executive Portal — ศูนย์ผู้บริหาร</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingPO > 0 && (
              <span
                onClick={() => navigate("/executive/purchase-approval")}
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-amber-500/30 transition-colors"
              >
                PO รออนุมัติ: {pendingPO}
              </span>
            )}
            {pendingUserApproval > 0 && (
              <span
                onClick={() => navigate("/executive/user-approval")}
                className="hidden md:inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-400/40 px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-blue-500/30 transition-colors"
              >
                สิทธิ์รออนุมัติ: {pendingUserApproval}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/10"
              onClick={() => navigate("/")}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Body: Sidebar + Main Content ──────────────────────────────────── */}
      <div className="flex-1 flex relative">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={cn(
            "fixed lg:sticky top-[57px] z-20 h-[calc(100vh-57px)] w-64 shrink-0",
            "flex flex-col bg-sidebar transition-transform duration-300 ease-in-out",
            "border-r border-sidebar-border",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* User Card */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-400/40 grid place-items-center text-amber-300 font-bold text-sm shrink-0">
                EX
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">วิเชียร ธนบดีทรัพย์</p>
                <p className="text-xs text-sidebar-foreground/60">EXEC001 · ผู้บริหารระดับสูง</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-3 py-2">
              เมนูผู้บริหาร
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-bold"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className={cn("shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")}>
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={cn("text-white rounded-full text-[10px] font-bold px-1.5 py-0.2", item.badgeColor)}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className={cn("text-[11px] truncate", isActive ? "text-sidebar-primary-foreground/80" : "text-sidebar-foreground/50")}>
                      {item.sublabel}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto shrink-0" />}
                </button>
              );
            })}

            {/* Other Factory Departments */}
            <div className="pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-3 py-2">
                ส่วนงานในโรงงาน
              </p>
              <button
                onClick={() => navigate("/qc/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>ศูนย์ควบคุมคุณภาพ (QC)</span>
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </button>
              <button
                onClick={() => navigate("/spare-parts")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <Package className="h-4 w-4" />
                <span>ระบบคลังอะไหล่</span>
              </button>
              <button
                onClick={() => navigate("/board")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <Wrench className="h-4 w-4" />
                <span>กระดานช่างซ่อม</span>
              </button>
            </div>
          </nav>

          {/* Quick Metrics Widget in Sidebar */}
          <div className="p-3 border-t border-sidebar-border space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-1">สรุปสถานะฝ่ายบริหาร</p>
            {[
              { label: "OEE / Uptime", value: "94.8%", dot: "bg-emerald-500" },
              { label: "PO รออนุมัติ", value: `${pendingPO} ใบ`, dot: pendingPO > 0 ? "bg-amber-500" : "bg-slate-400" },
              { label: "สิทธิ์รออนุมัติ", value: `${pendingUserApproval} คน`, dot: pendingUserApproval > 0 ? "bg-blue-500" : "bg-slate-400" },
              { label: "งบอะไหล่เดือนนี้", value: "฿21,000", dot: "bg-violet-500" },
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
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Sub Header */}
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
