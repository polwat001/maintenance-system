import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock, AlertTriangle,
  ExternalLink, Calendar, FileText, ArrowRight, ShieldCheck, Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MOCK_QC_SCHEDULES,
  MOCK_QC_MATRIX_TEMPLATES,
  QCSchedule,
  QCScheduleStatus,
} from "@/lib/mockData";

const STATUS_BADGE: Record<QCScheduleStatus, { label: string; cls: string }> = {
  scheduled:     { label: "กำหนดการ",    cls: "bg-blue-100 text-blue-700 border-blue-200" },
  "in-progress": { label: "กำลังตรวจ",   cls: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  done:          { label: "ตรวจแล้ว",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  missed:        { label: "ไม่ได้ตรวจ", cls: "bg-red-100 text-red-700 border-red-200" },
};

export function QCSection() {
  const navigate = useNavigate();
  const [schedules] = useState<QCSchedule[]>(() => [...MOCK_QC_SCHEDULES]);

  const total = schedules.length;
  const done = schedules.filter((s) => s.status === "done").length;
  const inProgress = schedules.filter((s) => s.status === "in-progress").length;
  const scheduled = schedules.filter((s) => s.status === "scheduled").length;
  const missed = schedules.filter((s) => s.status === "missed").length;
  const passRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            ภาพรวมระบบตรวจสอบคุณภาพ (Quality Control Hub)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            สิทธิ์ Superadmin: ตรวจสอบสถานะการตรวจ QC, แม่แบบการตรวจสอบ (Matrix Templates) และประวัติการบันทึกผล
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/qc/dashboard")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
          >
            เปิดหน้า QC Dashboard เต็มรูปแบบ <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">กำหนดการตรวจทั้งหมด</p>
            <p className="text-2xl font-bold tabular-nums">{total} รายการ</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">ตรวจแล้วเสร็จ (Done)</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{done} รายการ</p>
            <p className="text-xs text-muted-foreground">{passRate}% อัตราการตรวจครบ</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-cyan-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">กำลังดำเนินการตรวจ</p>
            <p className="text-2xl font-bold text-cyan-600 tabular-nums">{inProgress} รายการ</p>
            <p className="text-xs text-muted-foreground">มีช่าง/QC กำลังบันทึก</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-cyan-100 text-cyan-700 grid place-items-center">
            <Activity className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">พลาดการตรวจ (Missed)</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">{missed} รายการ</p>
            <p className="text-xs text-muted-foreground">รอตรวจ {scheduled} รายการ</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-100 text-red-600 grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* QC Schedules Table */}
      <Card className="overflow-hidden border">
        <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
          <h2 className="font-semibold text-sm">รายการกำหนดการตรวจ QC ล่าสุด (QC Schedules)</h2>
          <span className="text-xs text-muted-foreground">อิงจากฐานข้อมูล FixFlow QC Module</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/70 text-xs font-semibold uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-4">รหัสกำหนดการ / วันที่</th>
                <th className="py-3 px-4">หัวข้อการตรวจ & เครื่องจักร</th>
                <th className="py-3 px-4">แม่แบบที่ใช้ (Template)</th>
                <th className="py-3 px-4">เจ้าหน้าที่ผู้รับผิดชอบ</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((sc) => {
                const sBadge = STATUS_BADGE[sc.status] || { label: sc.status, cls: "bg-gray-100 text-gray-700" };

                return (
                  <tr key={sc.schedule_id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-primary">{sc.schedule_id}</div>
                      <div className="text-xs text-muted-foreground">{sc.scheduled_date}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground text-xs">{sc.title}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{sc.machine_name}</div>
                    </td>

                    <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                      {sc.template_name}
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="font-medium text-foreground">{sc.assigned_to_name || sc.assigned_to}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border", sBadge.cls)}>
                        {sBadge.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/qc/record/${sc.schedule_id}`)}
                        className="text-xs text-primary hover:text-primary"
                      >
                        ดูรายละเอียด <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
