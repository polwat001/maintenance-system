import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, LogOut, LayoutDashboard, AlertTriangle,
  CheckCircle2, XCircle, Clock, Filter, Search,
  ChevronRight, ExternalLink, Wrench, ShoppingCart,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MOCK_SPARE_PART_REQUESTS,
  SparePartRequest,
  SparePartRequestStatus,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SparePartRequestStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:  { label: "รออนุมัติ",    cls: "bg-amber-100 text-amber-700 border-amber-200",    icon: <Clock className="h-3 w-3" /> },
  approved: { label: "อนุมัติแล้ว",  cls: "bg-blue-100 text-blue-700 border-blue-200",       icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "ปฏิเสธ",       cls: "bg-red-100 text-red-700 border-red-200",          icon: <XCircle className="h-3 w-3" /> },
  ordered:  { label: "สั่งซื้อแล้ว", cls: "bg-violet-100 text-violet-700 border-violet-200", icon: <ShoppingCart className="h-3 w-3" /> },
  received: { label: "ได้รับแล้ว",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const URGENCY_CONFIG = {
  normal:   { label: "ปกติ",   cls: "bg-gray-100 text-gray-600",      dot: "bg-gray-400" },
  urgent:   { label: "เร่งด่วน", cls: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  critical: { label: "วิกฤติ", cls: "bg-red-100 text-red-700",        dot: "bg-red-500 animate-pulse" },
};

// ─── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({
  item,
  onClose,
  onConfirm,
}: {
  item: SparePartRequest;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border">
        <div className="p-6 border-b">
          <h3 className="font-bold text-base text-foreground">ปฏิเสธคำขออะไหล่</h3>
          <p className="text-sm text-muted-foreground mt-1">{item.sr_id} · {item.part_name}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เหตุผลการปฏิเสธ <span className="text-red-500">*</span></label>
            <textarea
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="ระบุเหตุผล..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              disabled={!reason.trim()}
              onClick={() => onConfirm(reason)}
            >
              ยืนยันปฏิเสธ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({ item, onClose }: { item: SparePartRequest; onClose: () => void }) {
  const s = STATUS_CONFIG[item.status];
  const u = URGENCY_CONFIG[item.urgency];
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border-l shadow-2xl flex flex-col animate-slide-up">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{item.sr_id}</p>
            <h3 className="font-bold text-base">{item.part_name}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><XCircle className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          <div className="flex gap-2 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border", s.cls)}>
              {s.icon}{s.label}
            </span>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", u.cls)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", u.dot)} />{u.label}
            </span>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <Row label="งานที่เกี่ยวข้อง" value={item.request_id} mono />
            <Row label="เครื่องจักร" value={item.asset_name} />
            <Row label="Part ID" value={item.part_id} mono />
            <Row label="จำนวน" value={`${item.quantity} ${item.unit}`} />
            <Row label="ราคาต่อหน่วย" value={`฿${item.unit_price.toLocaleString("th-TH")}`} />
            <Row label="รวม" value={`฿${(item.quantity * item.unit_price).toLocaleString("th-TH")}`} bold />
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <Row label="ช่างผู้ขอ" value={item.requested_by_name} />
            <Row label="วันที่ขอ" value={timeAgo(item.requested_at)} />
            {item.approved_by && <Row label="อนุมัติโดย" value={item.approved_by} />}
            {item.approved_at && <Row label="วันที่อนุมัติ" value={timeAgo(item.approved_at)} />}
            {item.po_number && <Row label="PO Number" value={item.po_number} mono />}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">เหตุผลการขอ</p>
            <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{item.reason}</p>
          </div>
          {item.reject_reason && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1.5">เหตุผลการปฏิเสธ</p>
              <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{item.reject_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-right", mono && "font-mono text-primary", bold && "font-bold text-foreground")}>{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSpareRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SparePartRequest[]>(MOCK_SPARE_PART_REQUESTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SparePartRequestStatus | "all">("all");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "normal" | "urgent" | "critical">("all");
  const [selected, setSelected] = useState<SparePartRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SparePartRequest | null>(null);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        !search ||
        r.part_name.toLowerCase().includes(search.toLowerCase()) ||
        r.sr_id.toLowerCase().includes(search.toLowerCase()) ||
        r.requested_by_name.toLowerCase().includes(search.toLowerCase()) ||
        r.asset_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchUrgency = urgencyFilter === "all" || r.urgency === urgencyFilter;
      return matchSearch && matchStatus && matchUrgency;
    });
  }, [requests, search, statusFilter, urgencyFilter]);

  const kpi = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    critical: requests.filter((r) => r.urgency === "critical").length,
    totalValue: requests.filter((r) => r.status === "pending").reduce((s, r) => s + r.quantity * r.unit_price, 0),
  }), [requests]);

  const handleApprove = (item: SparePartRequest) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.sr_id === item.sr_id
          ? { ...r, status: "approved", approved_by: "ADMIN001", approved_at: new Date().toISOString() }
          : r
      )
    );
    toast.success(`อนุมัติคำขอ ${item.sr_id} แล้ว`);
  };

  const handleReject = (item: SparePartRequest, reason: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.sr_id === item.sr_id
          ? { ...r, status: "rejected", reject_reason: reason }
          : r
      )
    );
    setRejectTarget(null);
    toast.error(`ปฏิเสธคำขอ ${item.sr_id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost" size="icon"
            className="text-primary-foreground hover:bg-white/10"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
            <Package className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Admin</div>
            <h1 className="font-bold truncate">ความต้องการอะไหล่จากช่าง</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {kpi.pending > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-semibold">
                <Clock className="h-3 w-3" /> รออนุมัติ {kpi.pending}
              </span>
            )}
            {kpi.critical > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/40 px-3 py-1 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> วิกฤติ {kpi.critical}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => navigate("/")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "คำขอทั้งหมด", value: kpi.total, cls: "border-l-primary", icon: <Package className="h-5 w-5" /> },
            { label: "รออนุมัติ", value: kpi.pending, cls: "border-l-amber-500", icon: <Clock className="h-5 w-5 text-amber-500" /> },
            { label: "วิกฤติ", value: kpi.critical, cls: "border-l-red-500", icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
            { label: "มูลค่ารอดำเนินการ", value: `฿${kpi.totalValue.toLocaleString("th-TH")}`, cls: "border-l-violet-500", icon: <ShoppingCart className="h-5 w-5 text-violet-500" /> },
          ].map((k) => (
            <Card key={k.label} className={cn("p-4 border-l-4", k.cls)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold tabular-nums mt-0.5">{k.value}</p>
                </div>
                <div className="text-muted-foreground mt-0.5">{k.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9"
                placeholder="ค้นหาอะไหล่, ช่าง, งาน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SparePartRequestStatus | "all")}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="pending">รออนุมัติ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="ordered">สั่งซื้อแล้ว</option>
                <option value="received">ได้รับแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as "all" | "normal" | "urgent" | "critical")}
              >
                <option value="all">ทุกความเร่งด่วน</option>
                <option value="critical">วิกฤติ</option>
                <option value="urgent">เร่งด่วน</option>
                <option value="normal">ปกติ</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <p className="text-sm font-semibold">รายการคำขออะไหล่</p>
            <p className="text-xs text-muted-foreground">{filtered.length} รายการ</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">SR ID</th>
                  <th className="px-4 py-3 text-left font-medium">อะไหล่</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">งาน / เครื่อง</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">ช่างผู้ขอ</th>
                  <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">มูลค่า</th>
                  <th className="px-4 py-3 text-left font-medium">ความเร่งด่วน</th>
                  <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                  <th className="px-4 py-3 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">ไม่พบรายการ</td></tr>
                ) : (
                  filtered
                    .sort((a, b) => {
                      const urgOrd = { critical: 0, urgent: 1, normal: 2 };
                      const statOrd = { pending: 0, approved: 1, ordered: 2, received: 3, rejected: 4 };
                      return urgOrd[a.urgency] - urgOrd[b.urgency] || statOrd[a.status] - statOrd[b.status];
                    })
                    .map((item, i) => {
                      const s = STATUS_CONFIG[item.status];
                      const u = URGENCY_CONFIG[item.urgency];
                      return (
                        <tr
                          key={item.sr_id}
                          className={cn(
                            "border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer",
                            i % 2 !== 0 && "bg-muted/10",
                            item.urgency === "critical" && "bg-red-50/30 hover:bg-red-50/50"
                          )}
                          onClick={() => setSelected(item)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-primary">{item.sr_id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{item.part_name}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} · ฿{item.unit_price.toLocaleString("th-TH")}/หน่วย</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs font-mono text-primary">{item.request_id}</p>
                            <p className="text-xs text-muted-foreground">{item.asset_name}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-sm">{item.requested_by_name}</td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell font-semibold tabular-nums">
                            ฿{(item.quantity * item.unit_price).toLocaleString("th-TH")}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", u.cls)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", u.dot)} />
                              {u.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border", s.cls)}>
                              {s.icon}{s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {item.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                                    onClick={() => handleApprove(item)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />อนุมัติ
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => setRejectTarget(item)}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />ปฏิเสธ
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => setSelected(item)}
                              >
                                <ChevronRight className="h-4 w-4" />
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

        {/* Quick Link */}
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/dashboard")}>
            <LayoutDashboard className="h-4 w-4" />Dashboard Admin
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/spare-parts")}>
            <Package className="h-4 w-4" />ระบบอะไหล่
          </Button>
        </div>
      </main>

      {/* Modals */}
      {selected && <DetailDrawer item={selected} onClose={() => setSelected(null)} />}
      {rejectTarget && (
        <RejectModal
          item={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
        />
      )}
    </div>
  );
}
