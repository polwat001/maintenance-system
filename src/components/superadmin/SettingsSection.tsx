import { useState } from "react";
import {
  Settings, Building2, Clock, Bell, DollarSign, Download, Plus,
  Edit2, Trash2, CheckCircle2, Shield, Save, RotateCcw, AlertTriangle, FileSpreadsheet
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  MOCK_MACHINES_MASTER,
  SystemMachineMaster,
  MOCK_SYSTEM_CONFIG,
  SystemSettingsConfig,
  MOCK_REQUESTS,
  MOCK_SPARE_PARTS_EXTENDED,
  MOCK_SYSTEM_USERS,
  MOCK_AUDIT_LOGS,
} from "@/lib/mockData";
import { toast } from "sonner";

export function SettingsSection() {
  const [activeTab, setActiveTab] = useState<"machines" | "sla" | "budget" | "backup">("machines");

  // Machines Master State
  const [machines, setMachines] = useState<SystemMachineMaster[]>(() => [...MOCK_MACHINES_MASTER]);
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<SystemMachineMaster | null>(null);
  const [machineForm, setMachineForm] = useState({
    code: "",
    name: "",
    zone: "Zone A",
    building: "Main Plant",
    line: "Line 1",
    status: "operational" as SystemMachineMaster["status"],
    critical_level: "high" as SystemMachineMaster["critical_level"],
  });

  // System Configuration State
  const [config, setConfig] = useState<SystemSettingsConfig>(() => ({ ...MOCK_SYSTEM_CONFIG }));

  // Machine CRUD
  const openAddMachine = () => {
    setEditingMachine(null);
    setMachineForm({
      code: `MC-${String(machines.length + 1).padStart(2, "0")}`,
      name: "",
      zone: "Zone A",
      building: "Main Plant",
      line: "Line 1",
      status: "operational",
      critical_level: "medium",
    });
    setMachineModalOpen(true);
  };

  const openEditMachine = (m: SystemMachineMaster) => {
    setEditingMachine(m);
    setMachineForm({
      code: m.code,
      name: m.name,
      zone: m.zone,
      building: m.building,
      line: m.line,
      status: m.status,
      critical_level: m.critical_level,
    });
    setMachineModalOpen(true);
  };

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMachine) {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === editingMachine.id
            ? { ...m, ...machineForm }
            : m
        )
      );
      toast.success(`อัปเดตเครื่องจักร ${machineForm.code} สำเร็จ`);
    } else {
      const newM: SystemMachineMaster = {
        id: `MC-${Date.now()}`,
        installed_date: new Date().toISOString().split("T")[0],
        ...machineForm,
      };
      setMachines((prev) => [...prev, newM]);
      toast.success(`เพิ่มเครื่องจักร ${machineForm.code} เข้าระบบเรียบร้อยแล้ว`);
    }
    setMachineModalOpen(false);
  };

  const handleDeleteMachine = (id: string, code: string) => {
    if (confirm(`คุณต้องการลบเครื่องจักร ${code} หรือไม่?`)) {
      setMachines((prev) => prev.filter((m) => m.id !== id));
      toast.error(`ลบเครื่องจักร ${code} ออกจากระบบแล้ว`);
    }
  };

  // Save Settings Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว");
  };

  // Export Helpers
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportWorkOrdersCSV = () => {
    const headers = ["ID", "Title", "Machine", "Location", "Priority", "Status", "Reporter", "Technician", "ReportedTime"];
    const rows = MOCK_REQUESTS.map((r) => [
      r.request_id,
      `"${r.issue_summary.replace(/"/g, '""')}"`,
      `"${r.asset_name}"`,
      `"${r.asset_location}"`,
      r.priority,
      r.status,
      `"${r.reported_by}"`,
      `"${r.assigned_to || ""}"`,
      r.reported_time,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile("\uFEFF" + csv, `FixFlow_WorkOrders_${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8;");
    toast.success("ส่งออกข้อมูลงานซ่อม (CSV) สำเร็จ");
  };

  const exportSparePartsCSV = () => {
    const headers = ["PartNo", "Name", "Category", "Stock", "MinStock", "UnitPrice", "Location", "Supplier"];
    const rows = MOCK_SPARE_PARTS_EXTENDED.map((p) => [
      p.part_number,
      `"${p.name}"`,
      p.category,
      p.stock,
      p.min_stock,
      p.unit_price,
      `"${p.location}"`,
      `"${p.supplier || ""}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile("\uFEFF" + csv, `FixFlow_SpareParts_${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8;");
    toast.success("ส่งออกคลังอะไหล่ (CSV) สำเร็จ");
  };

  const exportUsersCSV = () => {
    const headers = ["EmpID", "Name", "Username", "Role", "Department", "Position", "Email", "Status"];
    const rows = MOCK_SYSTEM_USERS.map((u) => [
      u.emp_id,
      `"${u.name}"`,
      u.username,
      u.role,
      `"${u.department}"`,
      `"${u.position}"`,
      u.email,
      u.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile("\uFEFF" + csv, `FixFlow_SystemUsers_${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8;");
    toast.success("ส่งออกข้อมูลผู้ใช้งาน (CSV) สำเร็จ");
  };

  const exportFullSnapshotJSON = () => {
    const snapshot = {
      exported_at: new Date().toISOString(),
      system: "FixFlow CMMS ISO 55001",
      config,
      machines,
      work_orders: MOCK_REQUESTS,
      spare_parts: MOCK_SPARE_PARTS_EXTENDED,
      users: MOCK_SYSTEM_USERS,
      audit_logs: MOCK_AUDIT_LOGS,
    };
    downloadFile(
      JSON.stringify(snapshot, null, 2),
      `FixFlow_System_Snapshot_${new Date().toISOString().split("T")[0]}.json`,
      "application/json"
    );
    toast.success("ดาวน์โหลด System Snapshot (JSON) สมบูรณ์");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-purple-600" />
            ตั้งค่าระบบ & Master Data (System Configuration)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            สิทธิ์ Superadmin: บริหารจัดการ Master Data เครื่องจักร, กฎ SLA, ขอบเขตงบประมาณ และการ Backup/Export ข้อมูล
          </p>
        </div>
      </div>

      {/* ── Settings Sub Tabs ── */}
      <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
        {[
          { key: "machines", label: "Master เครื่องจักร", icon: <Building2 className="h-4 w-4" /> },
          { key: "sla", label: "กฎ SLA & การแจ้งเตือน", icon: <Clock className="h-4 w-4" /> },
          { key: "budget", label: "งบประมาณ & เกณฑ์อำนาจ", icon: <DollarSign className="h-4 w-4" /> },
          { key: "backup", label: "สำรองข้อมูล & ส่งออก (Backup & Export)", icon: <Download className="h-4 w-4" /> },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "text-xs shrink-0",
              activeTab === tab.key && "bg-purple-600 hover:bg-purple-700 text-white"
            )}
          >
            {tab.icon}
            <span className="ml-1.5">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* ── Tab 1: Machines Master Data ── */}
      {activeTab === "machines" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              รายการเครื่องจักรในระบบทั้งหมด ({machines.length} เครื่อง)
            </p>
            <Button onClick={openAddMachine} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
              <Plus className="h-4 w-4 mr-1" /> เพิ่มเครื่องจักรใหม่
            </Button>
          </div>

          <Card className="overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/70 text-xs font-semibold uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="py-3 px-4">รหัส / ชื่อเครื่องจักร</th>
                    <th className="py-3 px-4">โซน / อาคาร / สายการผลิต</th>
                    <th className="py-3 px-4 text-center">ระดับความสำคัญ</th>
                    <th className="py-3 px-4 text-center">สถานะเครื่องจักร</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {machines.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{m.name}</div>
                        <div className="text-xs font-mono text-primary font-semibold">{m.code}</div>
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-foreground">{m.zone} • {m.building}</div>
                        <div className="text-muted-foreground">{m.line}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[11px] font-semibold",
                            m.critical_level === "high"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : m.critical_level === "medium"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          )}
                        >
                          {m.critical_level.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            m.status === "operational"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : m.status === "warning"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : m.status === "down"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          )}
                        >
                          {m.status === "operational" ? "ปกติ (Operational)" : m.status === "warning" ? "เตือน (Warning)" : m.status === "down" ? "หยุดทำงาน (Down)" : "ซ่อมบำรุง"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditMachine(m)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteMachine(m.id, m.code)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab 2: SLA & Notifications ── */}
      {activeTab === "sla" && (
        <form onSubmit={handleSaveConfig} className="space-y-6 max-w-2xl">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              เกณฑ์เวลา SLA ในการตอบสนองงานซ่อม (Response Time SLA)
            </h3>
            <p className="text-xs text-muted-foreground">
              ระบบจะแจ้งเตือน Overdue ทันทีหากงานไม่ได้รับการปิดหรือประเมินภายในระยะเวลาที่กำหนด
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="sla-critical-input" className="text-xs">งานวิกฤติ (Critical SLA - ชั่วโมง)</Label>
                <Input
                  id="sla-critical-input"
                  type="number"
                  min={1}
                  value={config.sla_critical_hours}
                  onChange={(e) => setConfig({ ...config, sla_critical_hours: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sla-high-input" className="text-xs">งานความสำคัญสูง (High SLA - ชั่วโมง)</Label>
                <Input
                  id="sla-high-input"
                  type="number"
                  min={1}
                  value={config.sla_high_hours}
                  onChange={(e) => setConfig({ ...config, sla_high_hours: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sla-normal-input" className="text-xs">งานระดับปกติ (Normal SLA - ชั่วโมง)</Label>
                <Input
                  id="sla-normal-input"
                  type="number"
                  min={1}
                  value={config.sla_normal_hours}
                  onChange={(e) => setConfig({ ...config, sla_normal_hours: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sla-low-input" className="text-xs">งานระดับต่ำ (Low SLA - ชั่วโมง)</Label>
                <Input
                  id="sla-low-input"
                  type="number"
                  min={1}
                  value={config.sla_low_hours}
                  onChange={(e) => setConfig({ ...config, sla_low_hours: Number(e.target.value) })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              การแจ้งเตือนและการยกระดับ (Notification & Escalation)
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-semibold">Auto Escalation</p>
                  <p className="text-xs text-muted-foreground">ยกระดับงานไปถึงผู้จัดการอัตโนมัติเมื่องาน Critical ค้างเกินเวลา</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="เปิดใช้งาน Auto Escalation"
                  checked={config.auto_escalation}
                  onChange={(e) => setConfig({ ...config, auto_escalation: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-semibold">LINE Notify Integration</p>
                  <p className="text-xs text-muted-foreground">ส่งข้อความแจ้งเตือนเข้ากลุ่มไลน์ฝ่ายซ่อมบำรุง</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="เปิดใช้งาน LINE Notify"
                  checked={config.line_notify_enabled}
                  onChange={(e) => setConfig({ ...config, line_notify_enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-semibold">อีเมลแจ้งเตือนอัตโนมัติ</p>
                  <p className="text-xs text-muted-foreground">ส่งสรุปรายงานรายวันและแจ้งเตือนฉุกเฉินทางอีเมล</p>
                </div>
                <input
                  type="checkbox"
                  aria-label="เปิดใช้งานอีเมลแจ้งเตือน"
                  checked={config.email_notify_enabled}
                  onChange={(e) => setConfig({ ...config, email_notify_enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </div>
            </div>
          </Card>

          <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="h-4 w-4 mr-1.5" /> บันทึกการตั้งค่า
          </Button>
        </form>
      )}

      {/* ── Tab 3: Budget & Limits ── */}
      {activeTab === "budget" && (
        <form onSubmit={handleSaveConfig} className="space-y-6 max-w-2xl">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              การจัดการงบประมาณและขอบเขตอำนาจอนุมัติ PO
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="monthly-budget-input" className="text-xs">งบประมาณซ่อมบำรุงรายเดือน (Monthly Budget - บาท)</Label>
                <Input
                  id="monthly-budget-input"
                  type="number"
                  value={config.monthly_budget}
                  onChange={(e) => setConfig({ ...config, monthly_budget: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="po-mgr-limit-input" className="text-xs">วงเงินสูงสุดที่ผู้จัดการซ่อมบำรุง (Admin) อนุมัติได้ (บาท)</Label>
                <Input
                  id="po-mgr-limit-input"
                  type="number"
                  value={config.po_manager_limit}
                  onChange={(e) => setConfig({ ...config, po_manager_limit: Number(e.target.value) })}
                />
                <p className="text-[11px] text-muted-foreground">หากเกินยอดนี้ จะต้องส่งต่อให้ผู้บริหาร (Executive) หรือ Superadmin</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="po-exec-limit-input" className="text-xs">วงเงินสูงสุดระดับผู้บริหาร (Executive Limit - บาท)</Label>
                <Input
                  id="po-exec-limit-input"
                  type="number"
                  value={config.po_exec_limit}
                  onChange={(e) => setConfig({ ...config, po_exec_limit: Number(e.target.value) })}
                />
              </div>
            </div>
          </Card>

          <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="h-4 w-4 mr-1.5" /> บันทึกวงเงิน & งบประมาณ
          </Button>
        </form>
      )}

      {/* ── Tab 4: Backup & Export ── */}
      {activeTab === "backup" && (
        <div className="space-y-6 max-w-3xl">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              ส่งออกข้อมูลระบบ (Export to CSV / Excel)
            </h3>
            <p className="text-xs text-muted-foreground">
              ส่งออกไฟล์ข้อมูลตารางสำหรับการตรวจสอบย้อนหลังตามมาตรฐาน ISO 55001 หรือรายงานผู้บริหาร
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={exportWorkOrdersCSV}
                className="h-auto p-4 flex flex-col items-start gap-1 text-left border-2 hover:border-emerald-500"
              >
                <span className="font-bold text-sm">ใบแจ้งซ่อม (Work Orders)</span>
                <span className="text-xs text-muted-foreground">รวมทุกสถานะ ประวัติการซ่อม</span>
                <span className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> ดาวน์โหลด .CSV
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={exportSparePartsCSV}
                className="h-auto p-4 flex flex-col items-start gap-1 text-left border-2 hover:border-emerald-500"
              >
                <span className="font-bold text-sm">คลังอะไหล่ (Spare Parts)</span>
                <span className="text-xs text-muted-foreground">ยอดคงเหลือ, ตำแหน่งจัดเก็บ, มูลค่า</span>
                <span className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> ดาวน์โหลด .CSV
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={exportUsersCSV}
                className="h-auto p-4 flex flex-col items-start gap-1 text-left border-2 hover:border-emerald-500"
              >
                <span className="font-bold text-sm">รายชื่อผู้ใช้ (Users)</span>
                <span className="text-xs text-muted-foreground">บัญชีผู้ใช้, บทบาท, แผนก</span>
                <span className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> ดาวน์โหลด .CSV
                </span>
              </Button>
            </div>
          </Card>

          <Card className="p-5 space-y-4 border-l-4 border-l-purple-600">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-600" />
              การสำรองข้อมูลทั้งระบบ (Complete System Snapshot Backup)
            </h3>
            <p className="text-xs text-muted-foreground">
              สร้างไฟล์ Snapshot ในรูปแบบ JSON ที่รวบรวมข้อมูล Work Orders, Spare Parts, System Users, Machines Master และ Audit Logs ไว้ในไฟล์เดียว
            </p>

            <div className="pt-2">
              <Button
                onClick={exportFullSnapshotJSON}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด System Snapshot (.JSON)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Machine Add/Edit Modal ── */}
      {machineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg">
                  {editingMachine ? "แก้ไขข้อมูลเครื่องจักร" : "เพิ่มเครื่องจักรใหม่"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Master Data เครื่องจักรในโรงงาน</p>
              </div>
              <button
                onClick={() => setMachineModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="machine-code-input" className="text-xs">รหัสเครื่องจักร (Machine Code) *</Label>
                <Input
                  id="machine-code-input"
                  required
                  value={machineForm.code}
                  onChange={(e) => setMachineForm({ ...machineForm, code: e.target.value })}
                  placeholder="CNC-01"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="machine-name-input" className="text-xs">ชื่อเครื่องจักร *</Label>
                <Input
                  id="machine-name-input"
                  required
                  value={machineForm.name}
                  onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                  placeholder="CNC Milling VMC-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="machine-zone-input" className="text-xs">โซน (Zone)</Label>
                  <Input
                    id="machine-zone-input"
                    value={machineForm.zone}
                    onChange={(e) => setMachineForm({ ...machineForm, zone: e.target.value })}
                    placeholder="Zone A"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="machine-building-input" className="text-xs">อาคาร (Building)</Label>
                  <Input
                    id="machine-building-input"
                    value={machineForm.building}
                    onChange={(e) => setMachineForm({ ...machineForm, building: e.target.value })}
                    placeholder="Main Plant"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="machine-line-input" className="text-xs">สายการผลิต (Line)</Label>
                <Input
                  id="machine-line-input"
                  value={machineForm.line}
                  onChange={(e) => setMachineForm({ ...machineForm, line: e.target.value })}
                  placeholder="Line 1 - Machining"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="machine-criticality-select" className="text-xs">ระดับความสำคัญ</Label>
                  <select
                    id="machine-criticality-select"
                    value={machineForm.critical_level}
                    onChange={(e) => setMachineForm({ ...machineForm, critical_level: e.target.value as any })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="high">High (วิกฤติสูง)</option>
                    <option value="medium">Medium (ปานกลาง)</option>
                    <option value="low">Low (ทั่วไป)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="machine-status-select" className="text-xs">สถานะเครื่องจักร</Label>
                  <select
                    id="machine-status-select"
                    value={machineForm.status}
                    onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value as any })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="operational">ปกติ (Operational)</option>
                    <option value="warning">เตือน (Warning)</option>
                    <option value="down">หยุดทำงาน (Down)</option>
                    <option value="maintenance">ซ่อมบำรุง (Maintenance)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setMachineModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  {editingMachine ? "บันทึกการแก้ไข" : "เพิ่มเครื่องจักร"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
