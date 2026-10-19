import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, ArrowLeft, LogOut, CheckCircle2, XCircle, Clock,
  Shield, UserCheck, Building2, BadgeCheck, Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MOCK_USER_APPROVAL_REQUESTS,
  UserApprovalRequest,
  ApprovalStatus,
  ROLE_LABEL,
  UserRole,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";
import ExecutiveLayout from "@/components/ExecutiveLayout";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:  { label: "รออนุมัติ",   cls: "bg-amber-100 text-amber-700 border-amber-200",       icon: <Clock className="h-3 w-3" /> },
  approved: { label: "อนุมัติแล้ว", cls: "bg-emerald-100 text-emerald-700 border-emerald-200",  icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "ปฏิเสธ",      cls: "bg-red-100 text-red-700 border-red-200",             icon: <XCircle className="h-3 w-3" /> },
};

const ROLE_COLOR: Record<UserRole, string> = {
  technician: "bg-blue-100 text-blue-700",
  qc:         "bg-violet-100 text-violet-700",
  admin:      "bg-orange-100 text-orange-700",
  executive:  "bg-red-100 text-red-700",
  requester:  "bg-gray-100 text-gray-600",
};

// ─── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({ req, onClose, onConfirm }: { req: UserApprovalRequest; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border">
        <div className="p-6 border-b">
          <h3 className="font-bold">ปฏิเสธคำขอสิทธิ์</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{req.name} · {ROLE_LABEL[req.role_requested]}</p>
        </div>
        <div className="p-6 space-y-4">
          <label className="text-xs font-medium text-muted-foreground">เหตุผล <span className="text-red-500">*</span></label>
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="ระบุเหตุผล..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" disabled={!reason.trim()} onClick={() => onConfirm(reason)}>
              ยืนยันปฏิเสธ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function UserDetailDrawer({
  req,
  onClose,
  onApprove,
  onReject,
}: {
  req: UserApprovalRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const s = STATUS_CONFIG[req.status];
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border-l shadow-2xl flex flex-col">
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{req.approval_id}</p>
            <h3 className="font-bold text-base mt-0.5">{req.name}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><XCircle className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          <div className="flex gap-2 items-center">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border", s.cls)}>
              {s.icon}{s.label}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", ROLE_COLOR[req.role_requested])}>
              {ROLE_LABEL[req.role_requested]}
            </span>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">รหัสพนักงาน</span><span className="font-mono font-semibold">{req.emp_id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">แผนก</span><span className="font-semibold">{req.department}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ตำแหน่งปัจจุบัน</span><span className="font-semibold">{req.position}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">สิทธิ์ที่ขอ</span><span className="font-semibold text-primary">{ROLE_LABEL[req.role_requested]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">วันที่ส่งคำขอ</span><span>{timeAgo(req.requested_at)} ({req.requested_at.split("T")[0]})</span></div>
          </div>

          {req.note && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-medium text-blue-700 mb-0.5">เหตุผล / บันทึกเพิ่มเติม</p>
              <p className="text-sm text-blue-900">{req.note}</p>
            </div>
          )}

          {req.approved_by && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-xs font-medium text-emerald-700 mb-0.5">ข้อมูลการอนุมัติ</p>
              <p className="text-sm font-semibold text-emerald-800">อนุมัติโดย: {req.approved_by}</p>
              {req.approved_at && <p className="text-xs text-emerald-600 mt-0.5">{timeAgo(req.approved_at)}</p>}
            </div>
          )}

          {req.reject_reason && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-xs font-medium text-red-700 mb-0.5">เหตุผลการปฏิเสธ</p>
              <p className="text-sm text-red-800">{req.reject_reason}</p>
            </div>
          )}
        </div>

        {req.status === "pending" && (
          <div className="p-4 border-t bg-card flex gap-2">
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white gap-1" onClick={onApprove}>
              <UserCheck className="h-4 w-4" /> อนุมัติ
            </Button>
            <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1" onClick={onReject}>
              <XCircle className="h-4 w-4" /> ปฏิเสธ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ExecutiveUserApproval() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<UserApprovalRequest[]>(MOCK_USER_APPROVAL_REQUESTS);
  const [selected, setSelected] = useState<UserApprovalRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<UserApprovalRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchRole = roleFilter === "all" || r.role_requested === roleFilter;
      return matchStatus && matchRole;
    });
  }, [requests, statusFilter, roleFilter]);

  const kpi = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    total: requests.length,
  }), [requests]);

  const handleApprove = (req: UserApprovalRequest) => {
    setRequests((prev) => prev.map((r) => r.approval_id === req.approval_id
      ? { ...r, status: "approved", approved_by: "EXEC001", approved_at: new Date().toISOString() }
      : r
    ));
    toast.success(`อนุมัติสิทธิ์ ${req.name} (${ROLE_LABEL[req.role_requested]}) แล้ว`);
  };

  const handleReject = (req: UserApprovalRequest, reason: string) => {
    setRequests((prev) => prev.map((r) => r.approval_id === req.approval_id
      ? { ...r, status: "rejected", reject_reason: reason }
      : r
    ));
    setRejectTarget(null);
    toast.error(`ปฏิเสธคำขอของ ${req.name}`);
  };

  return (
    <ExecutiveLayout
      title="อนุมัติสิทธิ์ผู้ใช้งาน (User Access Requests)"
      subtitle="พิจารณาและอนุมัติการขอสิทธิ์และบทบาทในระบบ FixFlow CMMS"
      actions={
        kpi.pending > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 text-xs font-bold">
            <Clock className="h-3.5 w-3.5" /> รออนุมัติ {kpi.pending} คำขอ
          </span>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "คำขอทั้งหมด", value: kpi.total, cls: "border-l-primary" },
            { label: "รออนุมัติ", value: kpi.pending, cls: "border-l-amber-500" },
            { label: "อนุมัติแล้ว", value: kpi.approved, cls: "border-l-emerald-500" },
            { label: "ปฏิเสธ", value: kpi.rejected, cls: "border-l-red-500" },
          ].map((k) => (
            <Card key={k.label} className={cn("p-4 border-l-4", k.cls)}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold tabular-nums">{k.value}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {s === "all" ? "ทุกสถานะ" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <select
            className="h-8 rounded-full border bg-background px-3 text-xs focus:outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          >
            <option value="all">ทุก Role</option>
            {(Object.entries(ROLE_LABEL) as [UserRole, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">ไม่พบรายการ</Card>
          ) : (
            filtered
              .sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1))
              .map((req) => {
                const s = STATUS_CONFIG[req.status];
                return (
                  <Card
                    key={req.approval_id}
                    className={cn(
                      "p-5 border-l-4 transition-all hover:shadow-md",
                      req.status === "pending" ? "border-l-amber-400" :
                      req.status === "approved" ? "border-l-emerald-400" : "border-l-red-400"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="h-11 w-11 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-base shrink-0">
                        {req.name.charAt(0)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-semibold">{req.name}</p>
                          <span className="font-mono text-xs text-muted-foreground">{req.emp_id}</span>
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", ROLE_COLOR[req.role_requested])}>
                            {ROLE_LABEL[req.role_requested]}
                          </span>
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border", s.cls)}>
                            {s.icon}{s.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{req.department}</span>
                          <span className="flex items-center gap-1"><BadgeCheck className="h-3 w-3" />{req.position}</span>
                          <span>{timeAgo(req.requested_at)}</span>
                        </div>
                        {req.note && <p className="text-xs text-blue-600 mt-1">📝 {req.note}</p>}
                        {req.approved_by && (
                          <p className="text-xs text-emerald-600 mt-1">✅ อนุมัติโดย {req.approved_by} · {req.approved_at ? timeAgo(req.approved_at) : ""}</p>
                        )}
                        {req.reject_reason && (
                          <p className="text-xs text-red-600 mt-1">❌ ปฏิเสธ: {req.reject_reason}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-1.5 shrink-0 items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSelected(req)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />ดูข้อมูล
                        </Button>
                        {req.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => handleApprove(req)}
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" />อนุมัติ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => setRejectTarget(req)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />ปฏิเสธ
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
          )}
        </div>
      </div>

      {selected && (
        <UserDetailDrawer
          req={selected}
          onClose={() => setSelected(null)}
          onApprove={() => {
            handleApprove(selected);
            setSelected(null);
          }}
          onReject={() => {
            setRejectTarget(selected);
            setSelected(null);
          }}
        />
      )}
      {rejectTarget && (
        <RejectModal
          req={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
        />
      )}
    </ExecutiveLayout>
  );
}
