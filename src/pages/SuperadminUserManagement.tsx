import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, ArrowLeft, Crown, Search, Plus, Edit3, Trash2,
  CheckCircle2, XCircle, Clock, Shield, UserCheck, Eye,
  X, ChevronRight, Mail, Phone, Key, AlertTriangle,
  Filter, RefreshCw, UserPlus, Ban, Unlock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MOCK_SYSTEM_USERS,
  SystemUser,
  UserRole,
  UserStatus,
  ROLE_LABEL,
  USER_STATUS_LABEL,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<UserStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  active:    { label: "ใช้งาน",       cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  inactive:  { label: "ไม่ได้ใช้งาน", cls: "bg-gray-100 text-gray-600 border-gray-200",         icon: <Clock className="h-3 w-3" /> },
  suspended: { label: "ระงับ",         cls: "bg-red-100 text-red-700 border-red-200",             icon: <XCircle className="h-3 w-3" /> },
};

const ROLE_COLOR: Record<UserRole, string> = {
  superadmin: "bg-amber-100 text-amber-800 border-amber-200",
  technician: "bg-blue-100 text-blue-700 border-blue-200",
  qc:         "bg-violet-100 text-violet-700 border-violet-200",
  admin:      "bg-orange-100 text-orange-700 border-orange-200",
  executive:  "bg-red-100 text-red-700 border-red-200",
  requester:  "bg-gray-100 text-gray-600 border-gray-200",
};

const ALL_ROLES: UserRole[] = ["superadmin", "admin", "executive", "qc", "technician", "requester"];
const ALL_STATUSES: UserStatus[] = ["active", "inactive", "suspended"];

// ─── User Form Modal ──────────────────────────────────────────────────────────

function UserFormModal({
  user,
  onClose,
  onSave,
}: {
  user?: SystemUser;
  onClose: () => void;
  onSave: (data: Partial<SystemUser>) => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [empId, setEmpId] = useState(user?.emp_id ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [position, setPosition] = useState(user?.position ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "requester");
  const [status, setStatus] = useState<UserStatus>(user?.status ?? "active");

  const canSave = name.trim() && empId.trim() && username.trim() && email.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{isEdit ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? `${user.name} · ${user.emp_id}` : "กรอกข้อมูลผู้ใช้งานใหม่"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="สมชาย ใจดี" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">รหัสพนักงาน <span className="text-red-500">*</span></label>
              <Input value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder="EMP-XXXX" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span></label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="somchai.j" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">อีเมล <span className="text-red-500">*</span></label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="somchai@fixflow.co.th" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">เบอร์โทร</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081-XXX-XXXX" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">แผนก</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Maintenance" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">ตำแหน่ง</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="ช่างไฟฟ้า" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">สถานะ</label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{USER_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
            <Button
              className="flex-1"
              disabled={!canSave}
              onClick={() => onSave({ name, emp_id: empId, username, email, phone, department, position, role, status })}
            >
              {isEdit ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้งาน"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  onClose,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: {
  user: SystemUser;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}) {
  const stCfg = STATUS_CONFIG[user.status];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">รายละเอียดผู้ใช้งาน</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar & name */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-14 w-14 rounded-full grid place-items-center font-bold text-lg shrink-0",
                user.role === "superadmin"
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                  : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
              )}
            >
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.position} · {user.department}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">รหัสพนักงาน</p>
              <p className="font-medium font-mono">{user.emp_id}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="font-medium font-mono">{user.username}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> อีเมล</p>
              <p className="font-medium text-xs">{user.email}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> เบอร์โทร</p>
              <p className="font-medium">{user.phone}</p>
            </div>
          </div>

          {/* Role & Status */}
          <div className="flex items-center gap-3">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", ROLE_COLOR[user.role])}>
              <Shield className="h-3 w-3" /> {ROLE_LABEL[user.role]}
            </span>
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", stCfg.cls)}>
              {stCfg.icon} {stCfg.label}
            </span>
          </div>

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">ทักษะ</p>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((s) => (
                  <span key={s} className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p>สร้างเมื่อ: {new Date(user.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p>เข้าใช้ล่าสุด: {timeAgo(user.last_login)}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onEdit}>
              <Edit3 className="h-3.5 w-3.5" /> แก้ไข
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("flex-1 gap-1", user.status === "active" ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50")}
              onClick={onToggleStatus}
            >
              {user.status === "active" ? <><Ban className="h-3.5 w-3.5" /> ระงับ</> : <><Unlock className="h-3.5 w-3.5" /> เปิดใช้งาน</>}
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-amber-600 hover:bg-amber-50" onClick={onResetPassword}>
              <Key className="h-3.5 w-3.5" /> รีเซ็ต
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SuperadminUserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SystemUser[]>(MOCK_SYSTEM_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | undefined>();
  const [viewUser, setViewUser] = useState<SystemUser | undefined>();

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase())
        || u.emp_id.toLowerCase().includes(search.toLowerCase())
        || u.username.toLowerCase().includes(search.toLowerCase())
        || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  }), [users]);

  const handleSave = (data: Partial<SystemUser>) => {
    if (editUser) {
      setUsers((prev) => prev.map((u) => u.user_id === editUser.user_id ? { ...u, ...data } as SystemUser : u));
      toast.success(`อัปเดตข้อมูล ${data.name} เรียบร้อย`);
    } else {
      const newUser: SystemUser = {
        user_id: `USR-${String(users.length + 1).padStart(3, "0")}`,
        emp_id: data.emp_id!,
        name: data.name!,
        username: data.username!,
        department: data.department ?? "",
        position: data.position ?? "",
        role: data.role ?? "requester",
        status: data.status ?? "active",
        email: data.email!,
        phone: data.phone ?? "",
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      setUsers((prev) => [newUser, ...prev]);
      toast.success(`เพิ่มผู้ใช้ ${data.name} เรียบร้อย`);
    }
    setShowForm(false);
    setEditUser(undefined);
  };

  const handleToggleStatus = (user: SystemUser) => {
    const newStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    setUsers((prev) => prev.map((u) => u.user_id === user.user_id ? { ...u, status: newStatus } : u));
    toast.success(`${newStatus === "active" ? "เปิดใช้งาน" : "ระงับ"} ${user.name} เรียบร้อย`);
    setViewUser(undefined);
  };

  const handleResetPassword = (user: SystemUser) => {
    toast.success(`รีเซ็ตรหัสผ่าน ${user.name} เรียบร้อย — รหัสชั่วคราว: temp1234`);
    setViewUser(undefined);
  };

  const handleDelete = (user: SystemUser) => {
    if (user.role === "superadmin") {
      toast.error("ไม่สามารถลบ Superadmin ได้");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
    toast.success(`ลบผู้ใช้ ${user.name} เรียบร้อย`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 shadow-md" style={{ background: "linear-gradient(135deg, hsl(260 70% 25%) 0%, hsl(280 60% 35%) 50%, hsl(300 50% 30%) 100%)" }}>
        <div className="px-4 py-3 flex items-center gap-3 text-white">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/superadmin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-md bg-amber-400 grid place-items-center shrink-0">
            <Crown className="h-5 w-5 text-amber-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wider text-white/70">Superadmin</div>
            <h1 className="font-bold truncate">จัดการผู้ใช้งาน</h1>
          </div>
          <Button
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5"
            onClick={() => { setEditUser(undefined); setShowForm(true); }}
          >
            <UserPlus className="h-4 w-4" /> เพิ่มผู้ใช้
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "ทั้งหมด", value: stats.total, cls: "border-l-indigo-500", icon: <Users className="h-5 w-5" /> },
            { label: "ใช้งาน", value: stats.active, cls: "border-l-emerald-500", icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" /> },
            { label: "ไม่ได้ใช้งาน", value: stats.inactive, cls: "border-l-gray-400", icon: <Clock className="h-5 w-5 text-gray-500" /> },
            { label: "ระงับ", value: stats.suspended, cls: "border-l-red-500", icon: <XCircle className="h-5 w-5 text-red-500" /> },
          ].map((s) => (
            <Card key={s.label} className={cn("p-4 border-l-4 flex items-center gap-3", s.cls)}>
              <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center shrink-0">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Filters ── */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="ค้นหาชื่อ, รหัสพนักงาน, username, อีเมล..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
              >
                <option value="all">ทุก Role</option>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
              >
                <option value="all">ทุกสถานะ</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{USER_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">แสดง {filtered.length} จาก {users.length} บัญชี</p>
        </Card>

        {/* ── User Table ── */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">ผู้ใช้งาน</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">รหัส</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">แผนก</th>
                  <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">เข้าใช้ล่าสุด</th>
                  <th className="px-4 py-3 text-right font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 opacity-30" />
                        <p className="text-sm">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, i) => {
                    const stCfg = STATUS_CONFIG[user.status];
                    return (
                      <tr
                        key={user.user_id}
                        className={cn(
                          "border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer",
                          i % 2 !== 0 && "bg-muted/10"
                        )}
                        onClick={() => setViewUser(user)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-9 w-9 rounded-full grid place-items-center font-bold text-sm shrink-0",
                                user.role === "superadmin"
                                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                  : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                              )}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{user.emp_id}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", ROLE_COLOR[user.role])}>
                            {user.role === "superadmin" && <Crown className="h-3 w-3" />}
                            {ROLE_LABEL[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{user.department}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", stCfg.cls)}>
                            {stCfg.icon} {stCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{timeAgo(user.last_login)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => setViewUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                              onClick={() => { setEditUser(user); setShowForm(true); }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {user.role !== "superadmin" && (
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                onClick={() => handleDelete(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {(showForm) && (
        <UserFormModal
          user={editUser}
          onClose={() => { setShowForm(false); setEditUser(undefined); }}
          onSave={handleSave}
        />
      )}
      {viewUser && (
        <UserDetailModal
          user={viewUser}
          onClose={() => setViewUser(undefined)}
          onEdit={() => { setViewUser(undefined); setEditUser(viewUser); setShowForm(true); }}
          onToggleStatus={() => handleToggleStatus(viewUser)}
          onResetPassword={() => handleResetPassword(viewUser)}
        />
      )}
    </div>
  );
}
