import { useState, useMemo } from "react";
import {
  Wrench, Search, Filter, ShieldAlert, CheckCircle2, Clock, AlertTriangle,
  UserCheck, RotateCcw, XCircle, Eye, ArrowRight, Check, Sparkles, Building2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  MOCK_REQUESTS,
  WorkRequest,
  TECHNICIAN_MAP,
  STATUS_LABEL,
  PRIORITY_LABEL,
  CATEGORY_LABEL,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  open:     { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  assess:   { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  waiting:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  doing:    { bg: "bg-cyan-50",   text: "text-cyan-700",   border: "border-cyan-200" },
  done:     { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  qc1:      { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  qc2:      { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  complete: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", text: "วิกฤติ" },
  high:     { bg: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", text: "สูง" },
  medium:   { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "ปานกลาง" },
  normal:   { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "ปกติ" },
  low:      { bg: "bg-gray-50 text-gray-700 border-gray-200", dot: "bg-gray-400", text: "ต่ำ" },
};

export function WorkRequestsSection() {
  const [requests, setRequests] = useState<WorkRequest[]>(() => [...MOCK_REQUESTS]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Modal states
  const [assignModalReq, setAssignModalReq] = useState<WorkRequest | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [overrideModalReq, setOverrideModalReq] = useState<WorkRequest | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPriority, setNewPriority] = useState<string>("");
  const [cancelModalReq, setCancelModalReq] = useState<WorkRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [detailModalReq, setDetailModalReq] = useState<WorkRequest | null>(null);

  // Filtered requests
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.issue_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.asset_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reported_by.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const critical = requests.filter((r) => r.priority === "critical").length;
    const active = requests.filter((r) => r.status === "doing" || r.status === "waiting" || r.status === "open").length;
    const completed = requests.filter((r) => r.status === "complete").length;
    return { total, critical, active, completed };
  }, [requests]);

  // Force Assign
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalReq || !selectedTech) return;
    const techName = TECHNICIAN_MAP[selectedTech]?.name ?? selectedTech;
    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === assignModalReq.request_id
          ? {
              ...r,
              assigned_to: selectedTech,
              status: r.status === "open" ? "doing" : r.status,
            }
          : r
      )
    );
    toast.success(`มอบหมายงาน ${assignModalReq.request_id} ให้ช่าง ${techName} สำเร็จ (Superadmin Override)`);
    setAssignModalReq(null);
    setSelectedTech("");
  };

  // Override Status & Priority
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalReq) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === overrideModalReq.request_id
          ? {
              ...r,
              status: (newStatus || r.status) as any,
              priority: (newPriority || r.priority) as any,
            }
          : r
      )
    );
    toast.success(`อัปเดตงาน ${overrideModalReq.request_id} สถานะ: ${STATUS_LABEL[newStatus as any] || overrideModalReq.status}, ความสำคัญ: ${PRIORITY_LABEL[newPriority as any] || overrideModalReq.priority}`);
    setOverrideModalReq(null);
  };

  // Cancel Request
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalReq) return;
    setRequests((prev) => prev.filter((r) => r.request_id !== cancelModalReq.request_id));
    toast.error(`ยกเลิกใบแจ้งซ่อม ${cancelModalReq.request_id} เรียบร้อยแล้ว (เหตุผล: ${cancelReason || "ยกเลิกโดย Superadmin"})`);
    setCancelModalReq(null);
    setCancelReason("");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6 text-purple-600" />
            จัดการงานซ่อมบำรุงทั้งหมด (Work Request Management)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            สิทธิ์ Superadmin: บังคับมอบหมายงาน (Force Assign), ปรับเปลี่ยนสถานะ/ความสำคัญ, ยกเลิกงานซ่อม
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRequests([...MOCK_REQUESTS])}
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> รีเซ็ตข้อมูลจำลอง
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">งานทั้งหมด</p>
            <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Wrench className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">งานวิกฤติ (Critical)</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">{stats.critical}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-100 text-red-600 grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-cyan-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">กำลังดำเนินการ / คอย</p>
            <p className="text-2xl font-bold text-cyan-600 tabular-nums">{stats.active}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-cyan-100 text-cyan-700 grid place-items-center">
            <Clock className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">เสร็จสิ้นแล้ว</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{stats.completed}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* ── Search & Filter Bar ── */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาตามรหัสงาน, อาการแจ้งซ่อม, ชื่อเครื่องจักร, ผู้แจ้ง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="กรองตามสถานะงานซ่อม"
              className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">ทุกสถานะ ({requests.length})</option>
              {Object.entries(STATUS_LABEL).map(([val, label]) => (
                <option key={val} value={val}>
                  {label} ({requests.filter((r) => r.status === val).length})
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="กรองตามระดับความสำคัญ"
              className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">ทุกความสำคัญ</option>
              <option value="critical">🔴 วิกฤติ (Critical)</option>
              <option value="high">🟠 สูง (High)</option>
              <option value="medium">🔵 ปานกลาง (Medium)</option>
              <option value="low">⚪ ต่ำ (Low)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Work Requests Table ── */}
      <Card className="overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/70 text-xs font-semibold uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-4">รหัสงาน / เครื่องจักร</th>
                <th className="py-3 px-4">อาการเสีย & หมวดหมู่</th>
                <th className="py-3 px-4">ความสำคัญ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">ช่างผู้รับผิดชอบ</th>
                <th className="py-3 px-4">ผู้แจ้ง / เวลา</th>
                <th className="py-3 px-4 text-right">Superadmin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่พบรายการงานซ่อมที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const pBadge = PRIORITY_BADGE[req.priority] || PRIORITY_BADGE.normal;
                  const sBadge = STATUS_BADGE[req.status] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
                  const techInfo = req.assigned_to ? TECHNICIAN_MAP[req.assigned_to] : null;

                  return (
                    <tr key={req.request_id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-primary">{req.request_id}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-sans">
                          <Building2 className="h-3 w-3" />
                          {req.asset_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-sans">({req.asset_location})</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-foreground line-clamp-1">{req.issue_summary}</p>
                        <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          {CATEGORY_LABEL[req.category] ?? req.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", pBadge.bg)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", pBadge.dot)} />
                          {PRIORITY_LABEL[req.priority] ?? req.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={cn("inline-block px-2.5 py-1 rounded-full text-xs font-medium border", sBadge.bg, sBadge.text, sBadge.border)}>
                          {STATUS_LABEL[req.status] ?? req.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {techInfo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center">
                              {techInfo.name.charAt(0)}
                            </div>
                            <span className="font-medium text-xs">{techInfo.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            ยังไม่มีผู้รับงาน
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        <div>{req.reported_by}</div>
                        <div className="text-[11px] opacity-75">{timeAgo(req.reported_time)}</div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Force Assign Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-blue-700 hover:bg-blue-50 border-blue-200"
                            onClick={() => {
                              setAssignModalReq(req);
                              setSelectedTech(req.assigned_to || "");
                            }}
                            title="บังคับมอบหมายงานให้ช่าง"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            {req.assigned_to ? "เปลี่ยนช่าง" : "มอบหมาย"}
                          </Button>

                          {/* Override Status Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-purple-700 hover:bg-purple-50 border-purple-200"
                            onClick={() => {
                              setOverrideModalReq(req);
                              setNewStatus(req.status);
                              setNewPriority(req.priority);
                            }}
                            title="ปรับสถานะ & ความสำคัญ"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            ปรับสถานะ
                          </Button>

                          {/* Cancel Work Request */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => setCancelModalReq(req)}
                            title="ยกเลิกงานซ่อม"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>

                          {/* Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setDetailModalReq(req)}
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
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

      {/* ── Modal 1: Force Assign Modal ── */}
      {assignModalReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  บังคับมอบหมายงาน (Force Assign)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {assignModalReq.request_id}: {assignModalReq.issue_summary}
                </p>
              </div>
              <button
                onClick={() => setAssignModalReq(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>เลือกช่างซ่อมบำรุง</Label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(TECHNICIAN_MAP).map(([techId, tech]) => {
                    const isSelected = selectedTech === techId;
                    return (
                      <div
                        key={techId}
                        onClick={() => setSelectedTech(techId)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-muted/50 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs grid place-items-center">
                            {tech.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight">{tech.name}</p>
                            <p className="text-xs text-muted-foreground">รหัส: {tech.technician_id}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
                          {tech.skills.map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-muted/60 rounded-lg text-xs text-muted-foreground">
                ℹ️ <strong>หมายเหตุ:</strong> การ Force Assign โดย Superadmin จะข้ามขั้นตอนรับงานปกติ และเปลี่ยนสถานะงานเป็น "กำลังดำเนินการ (Doing)" ให้ทันที
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAssignModalReq(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={!selectedTech} className="bg-blue-600 hover:bg-blue-700 text-white">
                  ยืนยันมอบหมายงาน
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal 2: Override Status & Priority Modal ── */}
      {overrideModalReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  ปรับเปลี่ยนสถานะ / ความสำคัญ (Override)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {overrideModalReq.request_id}: {overrideModalReq.issue_summary}
                </p>
              </div>
              <button
                onClick={() => setOverrideModalReq(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="override-status-select">สถานะงาน (Status)</Label>
                <select
                  id="override-status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  {Object.entries(STATUS_LABEL).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label} ({val})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="override-priority-select">ระดับความสำคัญ (Priority)</Label>
                <select
                  id="override-priority-select"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="critical">🔴 วิกฤติ (Critical)</option>
                  <option value="high">🟠 สูง (High)</option>
                  <option value="medium">🔵 ปานกลาง (Medium)</option>
                  <option value="low">⚪ ต่ำ (Low)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⚠️ การเปลี่ยนสถานะย้อนหลังจะถูกบันทึกไว้ใน <strong>Audit Log</strong> ของระบบโดยอัตโนมัติ
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOverrideModalReq(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal 3: Cancel Work Request Modal ── */}
      {cancelModalReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  ยืนยันการยกเลิกใบแจ้งซ่อม
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {cancelModalReq.request_id}: {cancelModalReq.issue_summary}
                </p>
              </div>
              <button
                onClick={() => setCancelModalReq(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ระบุเหตุผลในการยกเลิกงาน *</Label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="เช่น งานซ้ำซ้อน, ผู้แจ้งขอยกเลิก, เครื่องจักรกลับมาใช้งานได้ปกติ..."
                  className="w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCancelModalReq(null)}>
                  ย้อนกลับ
                </Button>
                <Button type="submit" variant="destructive">
                  ยืนยันยกเลิกใบแจ้งซ่อม
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal 4: Detail Modal ── */}
      {detailModalReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {detailModalReq.request_id}
                </span>
                <h3 className="font-bold text-lg mt-1">{detailModalReq.issue_summary}</h3>
              </div>
              <button
                onClick={() => setDetailModalReq(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">เครื่องจักร</p>
                <p className="font-semibold text-sm mt-0.5">{detailModalReq.asset_name}</p>
                <p className="text-muted-foreground">ตำแหน่ง: {detailModalReq.asset_location}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">หมวดหมู่งาน</p>
                <p className="font-semibold text-sm mt-0.5">{CATEGORY_LABEL[detailModalReq.category] ?? detailModalReq.category}</p>
                <p className="text-muted-foreground">ระดับ: {PRIORITY_LABEL[detailModalReq.priority]}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">ผู้แจ้งซ่อม</p>
                <p className="font-semibold mt-0.5">{detailModalReq.reported_by}</p>
                <p className="text-muted-foreground">เวลา: {new Date(detailModalReq.reported_time).toLocaleString("th-TH")}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">ช่างที่รับผิดชอบ</p>
                <p className="font-semibold mt-0.5">
                  {detailModalReq.assigned_to ? TECHNICIAN_MAP[detailModalReq.assigned_to]?.name || detailModalReq.assigned_to : "ยังไม่มีช่าง"}
                </p>
                <p className="text-muted-foreground">สถานะ: {STATUS_LABEL[detailModalReq.status]}</p>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-foreground">รายละเอียดเพิ่มเติม:</p>
              <p className="text-muted-foreground leading-relaxed">
                {detailModalReq.request_details?.additional_note || "ไม่มีบันทึกรายละเอียดเพิ่มเติมจากผู้แจ้ง"}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setDetailModalReq(null)} variant="outline" size="sm">
                ปิดหน้าต่าง
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
