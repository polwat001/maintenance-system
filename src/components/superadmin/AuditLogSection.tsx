import { useState, useMemo } from "react";
import {
  FileText, Search, Filter, Download, RotateCcw, Shield, Eye,
  Clock, User, CheckCircle2, AlertTriangle, Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MOCK_AUDIT_LOGS,
  AuditLogEntry,
  AuditAction,
  AuditEntity,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";

const ACTION_BADGE: Record<AuditAction, { bg: string; text: string; border: string }> = {
  LOGIN:        { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  CREATE:       { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  UPDATE:       { bg: "bg-cyan-50",   text: "text-cyan-700",   border: "border-cyan-200" },
  DELETE:       { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
  OVERRIDE:     { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  APPROVE:      { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  REJECT:       { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200" },
  STOCK_ADJUST: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
};

export function AuditLogSection() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => [...MOCK_AUDIT_LOGS]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [detailModalLog, setDetailModalLog] = useState<AuditLogEntry | null>(null);

  // Filtered Logs
  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address.includes(searchTerm);

      const matchAction = actionFilter === "all" || log.action === actionFilter;
      const matchEntity = entityFilter === "all" || log.entity === entityFilter;

      return matchSearch && matchAction && matchEntity;
    });
  }, [logs, searchTerm, actionFilter, entityFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["LogID", "Timestamp", "UserName", "Role", "Action", "Entity", "EntityID", "Details", "IPAddress"];
    const rows = filtered.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user_name}"`,
      l.user_role,
      l.action,
      l.entity,
      l.entity_id,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip_address,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FixFlow_AuditLog_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ส่งออกไฟล์ Audit Log (.CSV) เรียบร้อยแล้ว");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            ประวัติการเปลี่ยนแปลงระบบ (System Audit Log & Activity Trail)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            บันทึกประวัติการกระทำสำคัญทั้งหมด (ISO 55001 Audit Ready): การแก้ไขข้อมูล, Force Assign, อนุมัติงบ และการเข้าใช้งาน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1" /> ส่งออก CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogs([...MOCK_AUDIT_LOGS])}
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> รีเฟรช
          </Button>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหา Log ID, ผู้ดำเนินการ, รายละเอียด, รหัสเอกสาร, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="กรองตามการกระทำ"
              className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">ทุก Action ({logs.length})</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="OVERRIDE">OVERRIDE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="STOCK_ADJUST">STOCK_ADJUST</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              aria-label="กรองตามโมดูลระบบ"
              className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">ทุกโมดูล</option>
              <option value="WORK_REQUEST">Work Request (งานซ่อม)</option>
              <option value="USER">User (ผู้ใช้)</option>
              <option value="SPARE_PART">Spare Part (อะไหล่)</option>
              <option value="PO">PO (ใบสั่งซื้อ)</option>
              <option value="USER_APPROVAL">User Approval</option>
              <option value="SYSTEM_SETTING">System Setting</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Audit Logs Table ── */}
      <Card className="overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/70 text-xs font-semibold uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-4">Log ID / เวลา</th>
                <th className="py-3 px-4">ผู้ดำเนินการ (User)</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">โมดูล & รหัสอ้างอิง</th>
                <th className="py-3 px-4">รายละเอียดการกระทำ (Details)</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่พบบันทึกประวัติที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const badge = ACTION_BADGE[log.action] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-xs text-primary">{log.id}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(log.timestamp)}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-foreground">{log.user_name}</div>
                        <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase font-mono">
                          {log.user_role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono", badge.bg, badge.text, badge.border)}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs font-mono">
                        <div className="font-semibold text-foreground">{log.entity}</div>
                        <div className="text-muted-foreground text-[11px]">{log.entity_id}</div>
                      </td>

                      <td className="py-3 px-4 max-w-sm text-xs text-muted-foreground leading-snug">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {log.ip_address}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setDetailModalLog(log)}
                          title="ดูรายละเอียด Log Payload"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Detail Payload Modal ── */}
      {detailModalLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {detailModalLog.id}
                </span>
                <h3 className="font-bold text-lg mt-1">รายละเอียดบันทึกการกระทำ</h3>
              </div>
              <button
                onClick={() => setDetailModalLog(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-muted-foreground">ผู้ดำเนินการ</p>
                  <p className="font-semibold text-sm mt-0.5">{detailModalLog.user_name}</p>
                  <p className="text-muted-foreground">Role: {detailModalLog.user_role}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-muted-foreground">วันและเวลา</p>
                  <p className="font-semibold mt-0.5">{new Date(detailModalLog.timestamp).toLocaleString("th-TH")}</p>
                  <p className="text-muted-foreground">IP: {detailModalLog.ip_address}</p>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground">โมดูลและรหัสอ้างอิง</p>
                <p className="font-mono font-bold text-sm text-foreground mt-0.5">
                  {detailModalLog.entity} • {detailModalLog.entity_id}
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                <p className="font-semibold text-foreground">รายละเอียดเหตุการณ์:</p>
                <p className="text-muted-foreground leading-relaxed">{detailModalLog.details}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setDetailModalLog(null)} variant="outline" size="sm">
                ปิดหน้าต่าง
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
