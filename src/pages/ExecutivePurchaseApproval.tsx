import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, ArrowLeft, CheckCircle2, XCircle,
  Clock, ChevronRight, AlertTriangle, ShoppingCart, Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MOCK_PURCHASE_ORDERS,
  MOCK_SPARE_PART_REQUESTS,
  PurchaseOrder,
  POStatus,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";
import ExecutiveLayout from "@/components/ExecutiveLayout";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<POStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:  { label: "รออนุมัติ",    cls: "bg-amber-100 text-amber-700 border-amber-200",    icon: <Clock className="h-3 w-3" /> },
  approved: { label: "อนุมัติแล้ว",  cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "ปฏิเสธ",       cls: "bg-red-100 text-red-700 border-red-200",          icon: <XCircle className="h-3 w-3" /> },
  ordered:  { label: "สั่งซื้อแล้ว", cls: "bg-blue-100 text-blue-700 border-blue-200",       icon: <ShoppingCart className="h-3 w-3" /> },
};

// ─── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({ po, onClose, onConfirm }: { po: PurchaseOrder; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border animate-in zoom-in-95 fade-in duration-200 ease-out">
        <div className="p-6 border-b">
          <h3 className="font-bold">ปฏิเสธใบสั่งซื้อ</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{po.po_id} · ฿{po.total_amount.toLocaleString("th-TH")}</p>
        </div>
        <div className="p-6 space-y-4">
          <label className="text-xs font-medium text-muted-foreground">เหตุผลการปฏิเสธ <span className="text-red-500">*</span></label>
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

function PODetailDrawer({ po, onClose, onApprove, onReject }: {
  po: PurchaseOrder;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const s = STATUS_CONFIG[po.status];
  const relatedSRs = MOCK_SPARE_PART_REQUESTS.filter((sr) => po.sr_ids.includes(sr.sr_id));

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card sm:border-l shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300 ease-out">
        <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{po.po_id}</p>
            <h3 className="font-bold text-lg">฿{po.total_amount.toLocaleString("th-TH")}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><XCircle className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border", s.cls)}>
            {s.icon}{s.label}
          </span>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            {[
              { label: "ผู้ขอ", value: po.requested_by_name },
              { label: "Supplier", value: po.supplier ?? "-" },
              { label: "วันที่ขอ", value: timeAgo(po.requested_at) },
              { label: "มูลค่ารวม", value: `฿${po.total_amount.toLocaleString("th-TH")}`, bold: true },
            ].map((r) => (
              <div key={r.label} className="flex justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={cn("text-right", r.bold && "font-bold text-base")}>{r.value}</span>
              </div>
            ))}
          </div>

          {po.note && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs font-medium text-amber-700 mb-0.5">หมายเหตุ</p>
              <p className="text-sm">{po.note}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">รายการสินค้า</p>
            <div className="space-y-2">
              {po.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.part_name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × ฿{item.unit_price.toLocaleString("th-TH")}</p>
                  </div>
                  <span className="font-semibold text-sm tabular-nums">฿{(item.quantity * item.unit_price).toLocaleString("th-TH")}</span>
                </div>
              ))}
            </div>
          </div>

          {relatedSRs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">คำขออะไหล่ที่เกี่ยวข้อง</p>
              <div className="space-y-1.5">
                {relatedSRs.map((sr) => (
                  <div key={sr.sr_id} className="flex items-center gap-2 text-xs rounded-lg bg-muted/40 px-3 py-2">
                    <span className="font-mono text-primary">{sr.sr_id}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground truncate">{sr.asset_name}</span>
                    <span className="ml-auto font-semibold">{sr.requested_by_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {po.approved_by && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-xs font-medium text-emerald-700">อนุมัติโดย: {po.approved_by}</p>
              {po.approved_at && <p className="text-xs text-emerald-600">{timeAgo(po.approved_at)}</p>}
            </div>
          )}

          {po.reject_reason && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-xs font-medium text-red-700 mb-0.5">เหตุผลการปฏิเสธ</p>
              <p className="text-sm text-red-800">{po.reject_reason}</p>
            </div>
          )}
        </div>

        {po.status === "pending" && (
          <div className="p-5 border-t flex gap-3">
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={onApprove}>
              <CheckCircle2 className="h-4 w-4 mr-1" />อนุมัติ
            </Button>
            <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={onReject}>
              <XCircle className="h-4 w-4 mr-1" />ปฏิเสธ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ExecutivePurchaseApproval() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PurchaseOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<POStatus | "all">("all");

  const filtered = useMemo(() => {
    return orders.filter((o) => statusFilter === "all" || o.status === statusFilter);
  }, [orders, statusFilter]);

  const kpi = useMemo(() => ({
    pending: orders.filter((o) => o.status === "pending").length,
    pendingValue: orders.filter((o) => o.status === "pending").reduce((s, o) => s + o.total_amount, 0),
    total: orders.length,
    approved: orders.filter((o) => o.status === "approved" || o.status === "ordered").length,
  }), [orders]);

  const handleApprove = (po: PurchaseOrder) => {
    setOrders((prev) => prev.map((o) => o.po_id === po.po_id
      ? { ...o, status: "approved", approved_by: "EXEC001", approved_at: new Date().toISOString() }
      : o
    ));
    setSelected(null);
    toast.success(`อนุมัติ ${po.po_id} แล้ว · ฿${po.total_amount.toLocaleString("th-TH")}`);
  };

  const handleReject = (po: PurchaseOrder, reason: string) => {
    setOrders((prev) => prev.map((o) => o.po_id === po.po_id
      ? { ...o, status: "rejected", reject_reason: reason }
      : o
    ));
    setSelected(null);
    setRejectTarget(null);
    toast.error(`ปฏิเสธ ${po.po_id}`);
  };

  return (
    <ExecutiveLayout
      title="อนุมัติการสั่งซื้ออะไหล่ (Purchase Orders)"
      subtitle="พิจารณาและอนุมัติใบสั่งซื้ออะไหล่จากฝ่ายซ่อมบำรุงตามงบประมาณโรงงาน"
      actions={
        kpi.pending > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 text-xs font-bold">
            <Clock className="h-3.5 w-3.5" /> รออนุมัติ {kpi.pending} รายการ
          </span>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "PO ทั้งหมด", value: kpi.total, cls: "border-l-primary" },
            { label: "รออนุมัติ", value: kpi.pending, cls: "border-l-amber-500" },
            { label: "มูลค่ารออนุมัติ", value: `฿${kpi.pendingValue.toLocaleString("th-TH")}`, cls: "border-l-violet-500" },
            { label: "อนุมัติแล้ว", value: kpi.approved, cls: "border-l-emerald-500" },
          ].map((k) => (
            <Card key={k.label} className={cn("p-3.5 sm:p-4 border-l-4 min-w-0", k.cls)}>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground truncate">{k.label}</p>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums whitespace-nowrap truncate mt-0.5">{k.value}</p>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "ordered", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {s === "all" ? "ทั้งหมด" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* PO List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">ไม่พบรายการ</Card>
          ) : (
            filtered
              .sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1))
              .map((po) => {
                const s = STATUS_CONFIG[po.status];
                return (
                  <Card
                    key={po.po_id}
                    className={cn(
                      "p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md border-l-4",
                      po.status === "pending" ? "border-l-amber-400" :
                      po.status === "approved" || po.status === "ordered" ? "border-l-emerald-400" : "border-l-red-400"
                    )}
                    onClick={() => setSelected(po)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Icon */}
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-muted grid place-items-center shrink-0 mt-0.5">
                        <ShoppingCart className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-muted-foreground" />
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        {/* Title Row + Status */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-mono text-sm text-primary font-bold">{po.po_id}</p>
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border", s.cls)}>
                            {s.icon}{s.label}
                          </span>
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 shrink-0"><Building2 className="h-3 w-3" />{po.supplier ?? "ไม่ระบุ"}</span>
                          <span className="flex items-center gap-1 shrink-0"><Package className="h-3 w-3" />{po.items.length} รายการ</span>
                          <span className="shrink-0">ขอโดย: {po.requested_by_name}</span>
                          <span className="shrink-0 text-muted-foreground/75">· {timeAgo(po.requested_at)}</span>
                        </div>

                        {/* Note */}
                        {po.note && (
                          <p className="text-xs font-medium text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded-md px-2 py-1 mt-1.5 inline-block">
                            ⚠ {po.note}
                          </p>
                        )}

                        {/* Items Tags */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {po.items.map((item, i) => (
                            <span key={i} className="rounded-full bg-muted/80 border border-border/40 px-2.5 py-0.5 text-xs font-medium">
                              {item.part_name} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right side: Price & Desktop Actions */}
                      <div className="flex flex-col justify-between items-end shrink-0 self-stretch">
                        <p className="text-base sm:text-lg font-bold tabular-nums text-foreground">฿{po.total_amount.toLocaleString("th-TH")}</p>
                        
                        {/* Desktop buttons (hidden on mobile, aligned to bottom-right) */}
                        {po.status === "pending" && (
                          <div className="hidden sm:flex gap-2 mt-auto pt-3" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-xs" onClick={() => handleApprove(po)}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />อนุมัติ
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 font-medium" onClick={() => setRejectTarget(po)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />ปฏิเสธ
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile buttons (visible only on mobile for pending status) */}
                    {po.status === "pending" && (
                      <div className="flex sm:hidden gap-2 mt-3 pt-2.5 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium" onClick={() => handleApprove(po)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />อนุมัติ
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 font-medium" onClick={() => setRejectTarget(po)}>
                          <XCircle className="h-3.5 w-3.5 mr-1" />ปฏิเสธ
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })
          )}
        </div>
      </div>

      {selected && (
        <PODetailDrawer
          po={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected)}
          onReject={() => { setRejectTarget(selected); setSelected(null); }}
        />
      )}
      {rejectTarget && (
        <RejectModal
          po={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
        />
      )}
    </ExecutiveLayout>
  );
}
