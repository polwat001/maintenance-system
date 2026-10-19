import { useState, useMemo } from "react";
import {
  ShieldCheck, ShoppingCart, UserCheck, CheckCircle2, XCircle, Clock,
  DollarSign, FileText, Check, AlertTriangle, RotateCcw, Building, User
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MOCK_PURCHASE_ORDERS,
  MOCK_USER_APPROVAL_REQUESTS,
  PurchaseOrder,
  UserApprovalRequest,
  ROLE_LABEL,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";

export function ApprovalsSection() {
  const [activeTab, setActiveTab] = useState<"po" | "user">("po");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => [...MOCK_PURCHASE_ORDERS]);
  const [userRequests, setUserRequests] = useState<UserApprovalRequest[]>(() => [...MOCK_USER_APPROVAL_REQUESTS]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (filterStatus === "all") return true;
      return po.status === filterStatus;
    });
  }, [purchaseOrders, filterStatus]);

  // Filtered User Approvals
  const filteredUsers = useMemo(() => {
    return userRequests.filter((u) => {
      if (filterStatus === "all") return true;
      return u.status === filterStatus;
    });
  }, [userRequests, filterStatus]);

  // KPIs
  const pendingPOCount = purchaseOrders.filter((p) => p.status === "pending").length;
  const pendingPOValue = purchaseOrders
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.total_amount, 0);

  const pendingUserCount = userRequests.filter((u) => u.status === "pending").length;

  // Actions for PO
  const handleApprovePO = (poId: string) => {
    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              status: "approved",
              approved_by: "Superadmin",
              approved_at: new Date().toISOString(),
            }
          : p
      )
    );
    toast.success(`อนุมัติใบสั่งซื้อ ${poId} สำเร็จ`);
  };

  const handleRejectPO = (poId: string) => {
    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              status: "rejected",
              approved_by: "Superadmin",
              approved_at: new Date().toISOString(),
            }
          : p
      )
    );
    toast.error(`ปฏิเสธใบสั่งซื้อ ${poId}`);
  };

  // Actions for User Approval
  const handleApproveUser = (requestId: string) => {
    setUserRequests((prev) =>
      prev.map((u) =>
        u.id === requestId
          ? {
              ...u,
              status: "approved",
              reviewed_by: "Superadmin",
              reviewed_at: new Date().toISOString(),
            }
          : u
      )
    );
    toast.success(`อนุมัติการเข้าใช้งานระบบสำหรับคำขอ ${requestId} สำเร็จ`);
  };

  const handleRejectUser = (requestId: string) => {
    setUserRequests((prev) =>
      prev.map((u) =>
        u.id === requestId
          ? {
              ...u,
              status: "rejected",
              reviewed_by: "Superadmin",
              reviewed_at: new Date().toISOString(),
            }
          : u
      )
    );
    toast.error(`ปฏิเสธคำขอการเข้าใช้งาน ${requestId}`);
  };

  // Batch Approve All Pending
  const handleBatchApprove = () => {
    if (activeTab === "po") {
      setPurchaseOrders((prev) =>
        prev.map((p) =>
          p.status === "pending"
            ? {
                ...p,
                status: "approved",
                approved_by: "Superadmin (Batch)",
                approved_at: new Date().toISOString(),
              }
            : p
        )
      );
      toast.success(`อนุมัติใบสั่งซื้อที่รออยู่ทั้งหมด (${pendingPOCount} รายการ) สำเร็จ`);
    } else {
      setUserRequests((prev) =>
        prev.map((u) =>
          u.status === "pending"
            ? {
                ...u,
                status: "approved",
                reviewed_by: "Superadmin (Batch)",
                reviewed_at: new Date().toISOString(),
              }
            : u
        )
      );
      toast.success(`อนุมัติสิทธิ์ผู้ใช้งานที่รออยู่ทั้งหมด (${pendingUserCount} รายการ) สำเร็จ`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            ศูนย์การอนุมัติส่วนกลาง (Unified Approvals Hub)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            สิทธิ์ Superadmin: รวมอำนาจอนุมัติใบสั่งซื้ออะไหล่ (PO) และการอนุมัติสิทธิ์ผู้ใช้งานในที่เดียว
          </p>
        </div>
        <div className="flex items-center gap-2">
          {((activeTab === "po" && pendingPOCount > 0) || (activeTab === "user" && pendingUserCount > 0)) && (
            <Button
              onClick={handleBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              อนุมัติที่ค้างทั้งหมด ({activeTab === "po" ? pendingPOCount : pendingUserCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPurchaseOrders([...MOCK_PURCHASE_ORDERS]);
              setUserRequests([...MOCK_USER_APPROVAL_REQUESTS]);
            }}
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> รีเซ็ต
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">PO รออนุมัติ</p>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{pendingPOCount} ใบ</p>
            <p className="text-xs text-muted-foreground mt-0.5">มูลค่า ฿{pendingPOValue.toLocaleString("th-TH")}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">คำขอสิทธิ์ผู้ใช้รออนุมัติ</p>
            <p className="text-2xl font-bold text-blue-600 tabular-nums">{pendingUserCount} คน</p>
            <p className="text-xs text-muted-foreground mt-0.5">รอตรวจสอบสิทธิ์ & แผนก</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 grid place-items-center">
            <UserCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">อนุมัติแล้วทั้งหมด</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">
              {purchaseOrders.filter((p) => p.status === "approved").length +
                userRequests.filter((u) => u.status === "approved").length}{" "}
              รายการ
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">รวม PO และผู้ใช้งาน</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* ── Tabs & Filter Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "po" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("po")}
            className={cn(activeTab === "po" && "bg-primary hover:bg-primary/90 text-primary-foreground")}
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            ใบสั่งซื้ออะไหล่ (Purchase Orders)
            {pendingPOCount > 0 && (
              <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingPOCount}
              </span>
            )}
          </Button>

          <Button
            variant={activeTab === "user" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("user")}
            className={cn(activeTab === "user" && "bg-primary hover:bg-primary/90 text-primary-foreground")}
          >
            <UserCheck className="h-4 w-4 mr-1.5" />
            คำขอสิทธิ์ผู้ใช้งาน (User Access)
            {pendingUserCount > 0 && (
              <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                {pendingUserCount}
              </span>
            )}
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">สถานะ:</span>
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus(s)}
              className="text-xs h-7 px-2.5 capitalize"
            >
              {s === "all" ? "ทั้งหมด" : s === "pending" ? "รออนุมัติ" : s === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Content: Tab 1 (PO Approvals) ── */}
      {activeTab === "po" && (
        <Card className="overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/70 text-xs font-semibold uppercase text-muted-foreground border-b">
                <tr>
                  <th className="py-3 px-4">เลขที่ PO / วันที่ขอ</th>
                  <th className="py-3 px-4">รายการอะไหล่ & ผู้จำหน่าย</th>
                  <th className="py-3 px-4 text-center">จำนวน</th>
                  <th className="py-3 px-4 text-right">ยอดเงินรวม</th>
                  <th className="py-3 px-4">ผู้ขอซื้อ / เหตุผล</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">การตัดสินใจ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      ไม่มีรายการใบสั่งซื้อที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => {
                    const isPending = po.status === "pending";

                    return (
                      <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-primary">{po.id}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(po.requested_at).toLocaleDateString("th-TH")}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{po.part_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{po.part_number}</div>
                          <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                            Vendor: {po.vendor || "SKF Distribution"}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center tabular-nums font-semibold">
                          {po.quantity} ชิ้น
                        </td>

                        <td className="py-3 px-4 text-right tabular-nums">
                          <span className="font-bold text-sm text-foreground">
                            ฿{po.total_amount.toLocaleString("th-TH")}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs text-xs">
                          <div className="font-medium text-foreground">{po.requested_by}</div>
                          <p className="text-muted-foreground line-clamp-1 mt-0.5">{po.reason || "สต็อกต่ำกว่าเกณฑ์"}</p>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "inline-block px-2.5 py-1 rounded-full text-xs font-semibold border",
                              po.status === "pending"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : po.status === "approved"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            )}
                          >
                            {po.status === "pending" ? "รออนุมัติ" : po.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleApprovePO(po.id)}
                                className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> อนุมัติ
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectPO(po.id)}
                                className="h-8 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-100/70 border-red-200"
                              >
                                ปฏิเสธ
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-right">
                              <div>โดย: {po.approved_by || "Superadmin"}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Content: Tab 2 (User Access Approvals) ── */}
      {activeTab === "user" && (
        <Card className="overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/70 text-xs font-semibold uppercase text-muted-foreground border-b">
                <tr>
                  <th className="py-3 px-4">รหัสคำขอ / วันที่ขอ</th>
                  <th className="py-3 px-4">ชื่อ-นามสกุล / รหัสพนักงาน</th>
                  <th className="py-3 px-4">แผนก / ตำแหน่ง</th>
                  <th className="py-3 px-4">บทบาทที่ขอ (Requested Role)</th>
                  <th className="py-3 px-4">เหตุผลความจำเป็น</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">การตัดสินใจ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      ไม่มีรายการคำขอสิทธิ์ผู้ใช้ที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((req) => {
                    const isPending = req.status === "pending";

                    return (
                      <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-primary">{req.id}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(req.requested_at).toLocaleDateString("th-TH")}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{req.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{req.emp_id}</div>
                          <div className="text-[11px] text-muted-foreground">{req.email}</div>
                        </td>

                        <td className="py-3 px-4 text-xs">
                          <div className="font-medium text-foreground">{req.department}</div>
                          <div className="text-muted-foreground">{req.position}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            {ROLE_LABEL[req.requested_role] ?? req.requested_role}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs text-xs text-muted-foreground">
                          {req.reason || "สำหรับปฏิบัติงานประจำวัน"}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "inline-block px-2.5 py-1 rounded-full text-xs font-semibold border",
                              req.status === "pending"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : req.status === "approved"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            )}
                          >
                            {req.status === "pending" ? "รออนุมัติ" : req.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleApproveUser(req.id)}
                                className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> อนุมัติ & ผูกสิทธิ์
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectUser(req.id)}
                                className="h-8 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-100/70 border-red-200"
                              >
                                ปฏิเสธ
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-right">
                              <div>โดย: {req.reviewed_by || "Superadmin"}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
