import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck, LogOut, Plus, Calendar, Clock, CheckCircle2,
  AlertTriangle, XCircle, ChevronRight, User, Filter, Search,
  ArrowLeft, MapPin, BarChart3, Activity, ExternalLink, Wrench,
  FileSpreadsheet, Sparkles, Layers, Sliders, Trash2, Eye, PenTool,
  Check, FileText, CheckSquare, Settings2, Menu, X, LayoutDashboard,
  ShieldCheck, Package
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MOCK_QC_SCHEDULES,
  MOCK_CHECKSHEET_TEMPLATES,
  MOCK_QC_MATRIX_TEMPLATES,
  QCSchedule,
  QCScheduleStatus,
  QC_OFFICER_MAP,
  QCMatrixTemplate,
  QCTemplateType,
  QCMatrixRow,
  QCMatrixColumn,
  timeAgo,
} from "@/lib/mockData";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<QCScheduleStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  scheduled:     { label: "กำหนดการ",    cls: "bg-blue-100 text-blue-700 border-blue-200",         icon: <Calendar className="h-3 w-3" /> },
  "in-progress": { label: "กำลังตรวจ",   cls: "bg-cyan-100 text-cyan-700 border-cyan-200",         icon: <Activity className="h-3 w-3" /> },
  done:          { label: "ตรวจแล้ว",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  missed:        { label: "ไม่ได้ตรวจ", cls: "bg-red-100 text-red-700 border-red-200",             icon: <XCircle className="h-3 w-3" /> },
};

const FREQ_LABEL: Record<QCSchedule["frequency"], string> = {
  daily: "รายวัน",
  monthly: "รายเดือน",
};

// ─── Field Helper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

// ─── Template Builder Modal ───────────────────────────────────────────────────

function CreateMatrixTemplateModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (tpl: QCMatrixTemplate) => void;
}) {
  const [templateType, setTemplateType] = useState<QCTemplateType>("hourly_matrix");
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("บริษัท เพรซิเดนท์ฟลาวมิลล์ จำกัด");
  const [documentNo, setDocumentNo] = useState(`QC-${Date.now().toString().slice(-4)}`);
  const [lineOrZone, setLineOrZone] = useState("");
  const [machineType, setMachineType] = useState("");
  const [rows, setRows] = useState<QCMatrixRow[]>([
    { row_id: "r1", order: 1, title: "ตรวจสอบการทำงานของเครื่องจักร", input_type: "status_symbol" },
    { row_id: "r2", order: 2, title: "ค่าแรงดันลม (PRESSURE GAUGE)", input_type: "number", unit: "bar", min_value: 5.5, max_value: 7.0 },
    { row_id: "r3", order: 3, title: "หลอดไฟทำงานทุกหลอด", input_type: "status_symbol" },
  ]);

  const [machinePointsText, setMachinePointsText] = useState("B1B2, B3, B4, B5, C1, C2, C3, C4");
  const [notesText, setNotesText] = useState("1. ตรวจสอบตามกำหนดเวลา\n2. พบสิ่งผิดปกติแจ้งหัวหน้างานทันที");

  // Presets loader
  const handleLoadPreset = (presetType: "hourly" | "rollermill") => {
    if (presetType === "hourly") {
      setTemplateType("hourly_matrix");
      setTitle("รายการตรวจสอบเครื่องคัดแยกและระบบสั่น 24 ชั่วโมง");
      setCompanyName("บริษัท เพรซิเดนท์ฟลาวมิลล์ จำกัด");
      setDocumentNo("QC-SRT-24H");
      setLineOrZone("Line คัดแยกข้าวสาร / ระบบสั่น");
      setMachineType("เครื่องคัดแยกและถาดสั่น");
      setRows([
        { row_id: "ch_sorter", order: 1, title: "1.) ช่องคัดข้าวไม่ได้คุณภาพมีข้าวติดปนหรือไม่", input_type: "status_symbol" },
        { row_id: "vib_1", order: 2, title: "2.) ระบบสั่นถาดที่ 1 ทำงานหรือไม่", input_type: "status_symbol" },
        { row_id: "vib_2", order: 3, title: "3.) ระบบสั่นถาดที่ 2 ทำงานหรือไม่", input_type: "status_symbol" },
        { row_id: "vib_3", order: 4, title: "4.) ระบบสั่นถาดที่ 3 ทำงานหรือไม่", input_type: "status_symbol" },
        { row_id: "vib_4", order: 5, title: "5.) ระบบสั่นถาดที่ 4 ทำงานหรือไม่", input_type: "status_symbol" },
        { row_id: "lamps", order: 6, title: "6.) หลอดไฟทำงานทุกหลอดหรือไม่", input_type: "status_symbol" },
        { row_id: "ejector_rates", order: 7, title: "7.) EJECTOR RATES", input_type: "number", unit: "%", min_value: 5, max_value: 20 },
        { row_id: "color_defect", order: 8, title: "8.) COLOUR DEFECT", input_type: "number", unit: "%", min_value: 0, max_value: 0.5 },
        { row_id: "spot_defect", order: 9, title: "9.) SPOT DEFECT", input_type: "number", unit: "%", min_value: 0, max_value: 0.3 },
        { row_id: "pressure_gauge", order: 10, title: "10.) ค่าแรงดันลมที่ PRESSURE GAUGE", input_type: "number", unit: "bar", min_value: 5.5, max_value: 7.0 },
        { row_id: "machine_oper", order: 11, title: "11.) การทำงานของเครื่องจักร", input_type: "status_symbol" },
      ]);
      setNotesText("1. ให้ตรวจสอบเครื่องจักรทุก 2 ชั่วโมง\n2. รายการที่ 7, 8, 9, 10 ให้ใส่ค่าที่อ่านได้ ถ้าไม่อยู่ในค่าที่กำหนดให้แจ้งหัวหน้างาน\n3. ผู้ตรวจสอบคือพนักงาน MILLHAND ขึ้นไป\n4. พบปัญหาการทำงานของเครื่องจักรแจ้งหัวหน้างานทันที");
      toast.success("โหลดต้นแบบ 'ตารางตรวจสอบ 24 ชม.' เรียบร้อย");
    } else {
      setTemplateType("shift_parameter_matrix");
      setTitle("ROLLERMILL PARAMETERS");
      setCompanyName("บริษัท เพรซิเดนท์ฟลาวมิลล์ จำกัด");
      setDocumentNo("QC-RML-LineC");
      setLineOrZone("ROLLERMILL Line C");
      setMachineType("เครื่องโม่แป้ง Rollermill");
      setMachinePointsText("B1B2, B3, B4, B5, C1AC1A I, C1AC1A II, C1BC2B, C3, C4, C5, C6, C7, C8, C10");
      setRows([
        { row_id: "motor_a", order: 1, title: "MOTOR (A)", input_type: "number", unit: "A", min_value: 15, max_value: 38 },
        { row_id: "2f1g_max", order: 2, title: "2F1G MAX", input_type: "number", min_value: 20, max_value: 45 },
        { row_id: "2f1g_min", order: 3, title: "2F1G MIN", input_type: "number", min_value: 10, max_value: 25 },
        { row_id: "level", order: 4, title: "LEVEL", input_type: "text" },
        { row_id: "level_min", order: 5, title: "LEVEL MIN", input_type: "text" },
        { row_id: "clock_l", order: 6, title: "CLOCK (L)", input_type: "number", unit: "mm" },
        { row_id: "clock_r", order: 7, title: "CLOCK (R)", input_type: "number", unit: "mm" },
        { row_id: "break_release", order: 8, title: "BREAK RELEASE", input_type: "status_symbol", note: "เช็คเฉพาะ B1-B3" },
        { row_id: "roller", order: 9, title: "ROLLER", input_type: "status_symbol", note: "[✓] ปกติ, [✗] ขาด" },
      ]);
      setNotesText("1. ทวนสอบทุกครั้งที่เปลี่ยนกะ\n2. ช่อง BREAK RELEASE เช็คเฉพาะ B1, B2 และ B3 เท่านั้น\n3. ช่อง Roller ใส่เครื่องหมายแทนค่า ดังนี้: [✓] ปกติ  [✗] ขาด/หัวฉีกขาด\n4. แจ้งหัวหน้างานทันทีเมื่อพบสิ่งผิดปกติ");
      toast.success("โหลดต้นแบบ 'ROLLERMILL PARAMETERS' เรียบร้อย");
    }
  };

  const handleAddRow = () => {
    const newId = `row_${Date.now().toString().slice(-4)}`;
    setRows((prev) => [
      ...prev,
      {
        row_id: newId,
        order: prev.length + 1,
        title: `รายการที่ ${prev.length + 1}`,
        input_type: "status_symbol",
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อแบบฟอร์ม");
      return;
    }

    let columns: QCMatrixColumn[] = [];

    if (templateType === "hourly_matrix") {
      columns = [
        "8.00", "9.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00",
        "24.00", "1.00", "2.00", "3.00", "4.00", "5.00", "6.00", "7.00"
      ].map((timeLabel) => ({
        col_id: timeLabel.replace(".", "_"),
        label: timeLabel,
      }));
    } else {
      const points = machinePointsText.split(",").map((s) => s.trim()).filter(Boolean);
      columns = points.map((p) => ({
        col_id: p.replace(/\s+/g, "_"),
        label: p,
      }));
      columns.push({ col_id: "inspector", label: "ผู้ตรวจ", sub_label: "ลายมือชื่อ" });
    }

    const newTemplate: QCMatrixTemplate = {
      template_id: `TPL-CUSTOM-${Date.now()}`,
      template_type: templateType,
      title,
      company_name: companyName,
      document_no: documentNo,
      line_or_zone: lineOrZone,
      machine_type: machineType,
      page_info: "หน้า 1",
      notes_guidelines: notesText.split("\n").filter(Boolean),
      columns,
      rows,
      shifts: templateType === "shift_parameter_matrix" ? [
        { shift_id: "shift_a", name: "SHIFT A", time_range: "08:00 - 16:00" },
        { shift_id: "shift_b", name: "SHIFT B", time_range: "16:00 - 24:00" },
        { shift_id: "shift_c", name: "SHIFT C", time_range: "00:00 - 08:00" },
      ] : undefined,
      signoff_roles: templateType === "hourly_matrix" ? [
        { role_id: "millhand", title: "ผู้ตรวจสอบ: Millhand" },
        { role_id: "miller", title: "ผู้ทวนสอบ: Miller" },
      ] : undefined,
      created_by: "เจ้าหน้าที่ QC",
      created_at: new Date().toISOString(),
      active: true,
    };

    onSave(newTemplate);
    toast.success(`สร้างแม่แบบ QC "${title}" สำเร็จ`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl border max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in">
        <div className="p-5 border-b bg-muted/30 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary">QC Form Builder</span>
            <h3 className="font-bold text-base text-foreground">สร้างแม่แบบ QC ใหม่ (Matrix Template)</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><XCircle className="h-5 w-5" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
              <Sparkles className="h-4 w-4" /> เลือกแม่แบบมาตรฐานโรงงานสำเร็จรูป (1-Click Presets):
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs bg-white hover:bg-primary/10 border-primary/30 text-primary gap-1"
                onClick={() => handleLoadPreset("hourly")}
              >
                ⏱️ ตารางตรวจเครื่องคัดแยก & สั่น 24 ชม. (ตามรูป 2)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs bg-white hover:bg-primary/10 border-primary/30 text-primary gap-1"
                onClick={() => handleLoadPreset("rollermill")}
              >
                🏭 ROLLERMILL PARAMETERS — Line C (ตามรูป 1)
              </Button>
            </div>
          </div>

          <Field label="ประเภทรูปแบบตาราง:">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTemplateType("hourly_matrix")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  templateType === "hourly_matrix"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                    : "border-border hover:bg-muted"
                )}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> ตารางตรวจสอบตามช่วงเวลา (24 ชม.)
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  แกนตั้งคือรายการตรวจ แกนนอนคือช่องเวลา (เช่น 8.00 - 7.00) พร้อมลายเซ็น Millhand/Miller
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType("shift_parameter_matrix")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  templateType === "shift_parameter_matrix"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                    : "border-border hover:bg-muted"
                )}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Layers className="h-4 w-4" /> ตารางพารามิเตอร์แยกตามกะและเครื่องจักร
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  แบ่งกะ A, B, C แกนตั้งคือพารามิเตอร์ แกนนอนคือจุดเครื่องจักร (เช่น B1B2, B3... C10)
                </div>
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="ชื่อแม่แบบเอกสาร *">
              <Input placeholder="เช่น ROLLERMILL PARAMETERS หรือ ตรวจสอบ 24 ชม." value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="ชื่อบริษัท / โรงงาน">
              <Input placeholder="เช่น บริษัท เพรซิเดนท์ฟลาวมิลล์ จำกัด" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <Field label="สายการผลิต / สถานที่ (Line/Zone)">
              <Input placeholder="เช่น ROLLERMILL Line C หรือ Line คัดแยก" value={lineOrZone} onChange={(e) => setLineOrZone(e.target.value)} />
            </Field>
            <Field label="รหัสเอกสาร (Doc No.)">
              <Input placeholder="เช่น QC-RML-001" value={documentNo} onChange={(e) => setDocumentNo(e.target.value)} />
            </Field>
          </div>

          {templateType === "shift_parameter_matrix" && (
            <Field label="จุดตรวจสอบ / เครื่องจักร (คั่นด้วยจุลภาค ,)">
              <Input
                placeholder="เช่น B1B2, B3, B4, B5, C1, C2, C3"
                value={machinePointsText}
                onChange={(e) => setMachinePointsText(e.target.value)}
              />
            </Field>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-foreground">
                รายการตรวจสอบ / พารามิเตอร์ ({rows.length} รายการ):
              </label>
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={handleAddRow}>
                <Plus className="h-3 w-3" /> เพิ่มรายการ
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rows.map((row, idx) => (
                <div key={row.row_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border">
                  <span className="font-mono text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
                  <Input
                    className="flex-1 h-8 text-xs"
                    value={row.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, title: v } : r)));
                    }}
                  />
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    value={row.input_type}
                    onChange={(e) => {
                      const v = e.target.value as "status_symbol" | "number" | "text";
                      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, input_type: v } : r)));
                    }}
                  >
                    <option value="status_symbol">สัญลักษณ์ (✓, O, ✗, -)</option>
                    <option value="number">ตัวเลข (วัดค่า)</option>
                    <option value="text">ข้อความ</option>
                  </select>

                  {row.input_type === "number" && (
                    <Input
                      placeholder="หน่วย เช่น bar"
                      className="w-20 h-8 text-xs font-mono"
                      value={row.unit || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, unit: v } : r)));
                      }}
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                    onClick={() => handleRemoveRow(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Field label="หมายเหตุและคำแนะนำท้ายตาราง (แยกบรรทัดละ 1 ข้อ):">
            <textarea
              className="w-full min-h-[70px] rounded-md border bg-background p-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
          </Field>
        </div>

        <div className="p-4 border-t bg-muted/20 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>ยกเลิก</Button>
          <Button size="sm" className="bg-primary text-primary-foreground gap-1.5" onClick={handleSave}>
            <Check className="h-4 w-4" /> บันทึกและสร้างแม่แบบ QC
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── New Schedule Modal ────────────────────────────────────────────────────────

function NewScheduleModal({
  matrixTemplates,
  onClose,
  onSave,
}: {
  matrixTemplates: QCMatrixTemplate[];
  onClose: () => void;
  onSave: (s: QCSchedule) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    machine_name: "",
    machine_id: "",
    zone: "",
    assigned_to: "QC001",
    frequency: "daily" as QCSchedule["frequency"],
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_time_start: "08:00",
    scheduled_time_end: "17:00",
    template_kind: "matrix" as "matrix" | "standard",
    matrix_template_id: matrixTemplates[0]?.template_id || "TPL-HOURLY-002",
    template_id: "",
  });

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSelectMatrixTemplate = (tplId: string) => {
    const tpl = matrixTemplates.find((t) => t.template_id === tplId);
    if (tpl) {
      setForm((prev) => ({
        ...prev,
        matrix_template_id: tplId,
        title: `ตรวจ QC: ${tpl.title}`,
        zone: tpl.line_or_zone || prev.zone,
        machine_name: tpl.machine_type || prev.machine_name,
      }));
    }
  };

  const handleSave = () => {
    if (!form.title || !form.machine_name || !form.scheduled_date) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น (หัวข้อ, เครื่องจักร, วันที่)");
      return;
    }
    const officer = QC_OFFICER_MAP[form.assigned_to];
    const mTemplate = matrixTemplates.find((t) => t.template_id === form.matrix_template_id);

    const newSchedule: QCSchedule = {
      schedule_id: `QCS-${Date.now()}`,
      title: form.title,
      frequency: form.frequency,
      machine_name: form.machine_name,
      machine_id: form.machine_id || form.machine_name,
      zone: form.zone,
      assigned_to: form.assigned_to,
      assigned_to_name: officer?.name ?? form.assigned_to,
      scheduled_date: form.scheduled_date,
      scheduled_time_start: form.scheduled_time_start,
      scheduled_time_end: form.scheduled_time_end,
      status: "scheduled",
      matrix_template_id: form.template_kind === "matrix" ? form.matrix_template_id : undefined,
      template_name: form.template_kind === "matrix" ? mTemplate?.title : undefined,
      matrix_progress: form.template_kind === "matrix" ? { logged_slots: 0, total_slots: mTemplate?.columns.length || 24 } : undefined,
    };

    onSave(newSchedule);
    toast.success("สร้างกำหนดการตรวจ QC สำเร็จ");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border max-h-[90vh] overflow-y-auto animate-in fade-in">
        <div className="p-5 border-b sticky top-0 bg-card z-10">
          <h3 className="font-bold text-base">สร้างกำหนดการตรวจ QC ใหม่</h3>
          <p className="text-xs text-muted-foreground mt-0.5">เลือกแม่แบบตารางตรวจและกำหนดเครื่องจักร</p>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <Field label="รูปแบบแบบฟอร์มที่ใช้ตรวจ:">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => upd("template_kind", "matrix")}
                className={cn(
                  "p-2.5 rounded-lg border text-xs font-semibold text-center transition-all",
                  form.template_kind === "matrix" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border hover:bg-muted"
                )}
              >
                🏭 ตารางเมทริกซ์โรงงาน (Matrix)
              </button>
              <button
                type="button"
                onClick={() => upd("template_kind", "standard")}
                className={cn(
                  "p-2.5 rounded-lg border text-xs font-semibold text-center transition-all",
                  form.template_kind === "standard" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border hover:bg-muted"
                )}
              >
                📋 เช็คชีทมาตรฐานทั่วไป
              </button>
            </div>

            {form.template_kind === "matrix" ? (
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                value={form.matrix_template_id}
                onChange={(e) => handleSelectMatrixTemplate(e.target.value)}
              >
                {matrixTemplates.map((t) => (
                  <option key={t.template_id} value={t.template_id}>
                    {t.title} ({t.template_type === "hourly_matrix" ? "24 ชม." : "แยกกะ"}) — {t.line_or_zone || "โรงงาน"}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.template_id}
                onChange={(e) => upd("template_id", e.target.value)}
              >
                <option value="">— ไม่เลือก —</option>
                {MOCK_CHECKSHEET_TEMPLATES.map((t) => (
                  <option key={t.template_id} value={t.template_id}>{t.name}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="หัวข้อการตรวจ *">
            <Input placeholder="เช่น ตรวจสอบเครื่องคัดแยกและระบบสั่น 24 ชม." value={form.title} onChange={(e) => upd("title", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ชื่อเครื่องจักร / อุปกรณ์ *">
              <Input placeholder="เช่น SORT-VIB-01" value={form.machine_name} onChange={(e) => upd("machine_name", e.target.value)} />
            </Field>
            <Field label="Zone / สายการผลิต">
              <Input placeholder="เช่น Line คัดแยก หรือ Line C" value={form.zone} onChange={(e) => upd("zone", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ความถี่">
              <select className="h-9 w-full rounded-md border bg-background px-3 text-xs" value={form.frequency} onChange={(e) => upd("frequency", e.target.value)}>
                <option value="daily">รายวัน</option>
                <option value="monthly">รายเดือน</option>
              </select>
            </Field>
            <Field label="ผู้รับผิดชอบ">
              <select className="h-9 w-full rounded-md border bg-background px-3 text-xs" value={form.assigned_to} onChange={(e) => upd("assigned_to", e.target.value)}>
                {Object.values(QC_OFFICER_MAP).map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="วันที่ตรวจ *">
              <Input type="date" value={form.scheduled_date} onChange={(e) => upd("scheduled_date", e.target.value)} />
            </Field>
            <Field label="เวลาเริ่ม">
              <Input type="time" value={form.scheduled_time_start} onChange={(e) => upd("scheduled_time_start", e.target.value)} />
            </Field>
            <Field label="เวลาสิ้นสุด">
              <Input type="time" value={form.scheduled_time_end} onChange={(e) => upd("scheduled_time_end", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-card">
          <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
          <Button className="flex-1 bg-primary text-primary-foreground gap-1" onClick={handleSave}>
            <Plus className="h-4 w-4" /> สร้างกำหนดการ QC
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function ScheduleDetailDrawer({
  item,
  onClose,
  onCheckIn,
  onCheckOut,
  onViewRecord,
}: {
  item: QCSchedule;
  onClose: () => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onViewRecord: (id: string) => void;
}) {
  const s = STATUS_CONFIG[item.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-card w-full max-w-md h-full shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-200">
        <div className="p-5 border-b flex items-start justify-between">
          <div>
            <span className="font-mono text-xs text-primary font-bold">{item.schedule_id}</span>
            <h3 className="font-bold text-base mt-0.5">{item.title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><XCircle className="h-5 w-5" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border", s.cls)}>
            {s.icon}{s.label}
          </span>

          <div className="rounded-xl bg-muted/40 p-4 space-y-2 border">
            <div className="flex justify-between"><span className="text-muted-foreground">เครื่องจักร:</span><strong className="text-foreground">{item.machine_name}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Zone:</span><span>{item.zone || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ผู้รับผิดชอบ:</span><span>{item.assigned_to_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">วันที่:</span><span>{item.scheduled_date} ({item.scheduled_time_start} - {item.scheduled_time_end})</span></div>
          </div>

          {item.matrix_progress && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 space-y-1.5">
              <div className="flex justify-between font-bold text-blue-900">
                <span>ความคืบหน้าการลงเวลาตรวจ</span>
                <span>{item.matrix_progress.logged_slots} / {item.matrix_progress.total_slots} ช่อง</span>
              </div>
              <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.round((item.matrix_progress.logged_slots / item.matrix_progress.total_slots) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {item.findings && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <span className="font-bold block mb-1">สิ่งที่พบ:</span>
              {item.findings}
            </div>
          )}
        </div>

        <div className="p-4 border-t space-y-2 bg-card">
          <Button className="w-full bg-primary text-primary-foreground gap-1.5 py-5 font-bold" onClick={() => onViewRecord(item.schedule_id)}>
            <FileSpreadsheet className="h-4 w-4" /> เปิดตารางลงเวลาตรวจ (Open Matrix Record)
          </Button>

          {item.status === "scheduled" && (
            <Button variant="outline" className="w-full text-cyan-700 border-cyan-300 bg-cyan-50" onClick={() => onCheckIn(item.schedule_id)}>
              <Clock className="h-4 w-4 mr-1" /> เช็คอินเริ่มตรวจ (Check-in)
            </Button>
          )}

          {item.status === "in-progress" && (
            <Button variant="outline" className="w-full text-emerald-700 border-emerald-300 bg-emerald-50" onClick={() => onCheckOut(item.schedule_id)}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> สิ้นสุดการตรวจ (Check-out)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main QCDashboard Component (With Left Sidebar Layout) ────────────────────

export default function QCDashboard() {
  const navigate = useNavigate();

  // Sidebar toggle state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data State
  const [schedules, setSchedules] = useState<QCSchedule[]>(MOCK_QC_SCHEDULES);
  const [matrixTemplates, setMatrixTemplates] = useState<QCMatrixTemplate[]>(MOCK_QC_MATRIX_TEMPLATES);
  const [activeNav, setActiveNav] = useState<"schedule" | "templates" | "stats">("schedule");
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<QCSchedule | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QCScheduleStatus | "all">("all");
  const [freqFilter, setFreqFilter] = useState<"all" | "daily" | "monthly">("all");

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (freqFilter !== "all" && s.frequency !== freqFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.machine_name.toLowerCase().includes(q) ||
          s.assigned_to_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [schedules, statusFilter, freqFilter, search]);

  // KPIs
  const kpi = useMemo(() => {
    const total = schedules.length;
    const done = schedules.filter((s) => s.status === "done").length;
    const inProgress = schedules.filter((s) => s.status === "in-progress").length;
    const missed = schedules.filter((s) => s.status === "missed").length;
    const compliance = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, missed, compliance };
  }, [schedules]);

  const handleCheckIn = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.schedule_id === id ? { ...s, status: "in-progress", checked_in_at: new Date().toISOString() } : s))
    );
    toast.success("เช็คอินเริ่มการตรวจ QC เรียบร้อย");
  };

  const handleCheckOut = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.schedule_id === id ? { ...s, status: "done", checked_out_at: new Date().toISOString() } : s))
    );
    setSelectedSchedule(null);
    toast.success("บันทึกเสร็จสิ้นการตรวจ QC เรียบร้อย");
  };

  const NAV_ITEMS = [
    {
      key: "schedule" as const,
      label: "กำหนดการตรวจ QC",
      sublabel: "ตารางงานรายวัน & ลงเวลา",
      icon: <Calendar className="h-5 w-5" />,
      badge: schedules.filter((s) => s.status !== "done").length,
    },
    {
      key: "templates" as const,
      label: "แม่แบบฟอร์ม QC",
      sublabel: "ตาราง 24 ชม. & แม่แบบกะ",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      badge: matrixTemplates.length,
    },
    {
      key: "stats" as const,
      label: "รายงานและสถิติ",
      sublabel: "Compliance & ประสิทธิภาพ",
      icon: <BarChart3 className="h-5 w-5" />,
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
              <ClipboardCheck className="h-5 w-5 text-secondary-foreground" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">FixFlow CMMS</div>
              <h1 className="font-bold text-base sm:text-lg">ระบบควบคุมคุณภาพ (QC Center)</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Compliance {kpi.compliance}%
            </span>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 hidden md:inline-flex"
              onClick={() => setShowCreateTemplate(true)}
            >
              <Sparkles className="h-4 w-4" /> สร้างแม่แบบ QC
            </Button>
            <Button
              size="sm"
              className="bg-white text-primary hover:bg-white/90 gap-1.5 font-bold shadow-sm"
              onClick={() => setShowNewSchedule(true)}
            >
              <Plus className="h-4 w-4" /> สร้างกำหนดการ
            </Button>
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
              <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-secondary-foreground font-bold text-sm shrink-0">
                QC
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">ณัฐพงศ์ สุขใจ</p>
                <p className="text-xs text-sidebar-foreground/60">QC001 · Quality Control</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-3 py-2">
              เมนู QC
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveNav(item.key);
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
                        <span className="bg-primary/20 text-sidebar-primary-foreground border border-sidebar-primary/40 rounded-full text-[10px] font-bold px-1.5 py-0.2">
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

            <div className="pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-3 py-2">
                ระบบอื่น ๆ ในโรงงาน
              </p>
              <button
                onClick={() => navigate("/board")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <Wrench className="h-4 w-4" />
                <span>กระดานช่างซ่อม</span>
              </button>
              <button
                onClick={() => navigate("/spare-parts")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <Package className="h-4 w-4" />
                <span>ระบบคลังอะไหล่</span>
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </button>
            </div>
          </nav>

          {/* Mini KPI Summary in Sidebar */}
          <div className="p-3 border-t border-sidebar-border space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-1">สรุปด่วน QC</p>
            {[
              { label: "กำหนดการทั้งหมด", value: kpi.total, dot: "bg-primary" },
              { label: "กำลังตรวจ", value: kpi.inProgress, dot: "bg-cyan-500" },
              { label: "ตรวจเสร็จแล้ว", value: kpi.done, dot: "bg-emerald-500" },
              { label: "ไม่ได้ตรวจ", value: kpi.missed, dot: "bg-red-500" },
              { label: "Compliance", value: `${kpi.compliance}%`, dot: "bg-amber-500" },
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

          {/* Logout button */}
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
          {/* Sub Header / Action Bar */}
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {activeNav === "schedule" && "กำหนดการและตารางตรวจ QC"}
                {activeNav === "templates" && "คลังแม่แบบเอกสาร QC โรงงาน"}
                {activeNav === "stats" && "รายงานและสถิติการควบคุมคุณภาพ"}
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {activeNav === "schedule" && "ติดตามการตรวจเครื่องจักรประจำวันและลงเวลาตรวจ"}
                {activeNav === "templates" && "จัดการแม่แบบตาราง 24 ชม. และตารางพารามิเตอร์แยกตามกะ"}
                {activeNav === "stats" && "สรุปผลการตรวจรายบุคคลและอัตรา Compliance"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setShowCreateTemplate(true)}
              >
                <Sparkles className="h-4 w-4" /> สร้างแม่แบบ QC
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground gap-1.5 text-xs font-semibold"
                onClick={() => setShowNewSchedule(true)}
              >
                <Plus className="h-4 w-4" /> สร้างกำหนดการ
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
            {/* Top KPI Cards in Main View */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "กำหนดการทั้งหมด", value: kpi.total, cls: "border-l-primary" },
                { label: "กำลังตรวจ", value: kpi.inProgress, cls: "border-l-cyan-500" },
                { label: "ตรวจเสร็จแล้ว", value: kpi.done, cls: "border-l-emerald-500" },
                { label: "ไม่ได้ตรวจ", value: kpi.missed, cls: "border-l-red-500" },
                { label: "Compliance Rate", value: `${kpi.compliance}%`, cls: "border-l-amber-500" },
              ].map((k) => (
                <Card key={k.label} className={cn("p-4 border-l-4", k.cls)}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{k.value}</p>
                </Card>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* ─── SECTION 1: SCHEDULE ──────────────────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeNav === "schedule" && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <Card className="p-3.5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 h-9 text-xs"
                        placeholder="ค้นหาชื่อการตรวจ, เครื่องจักร, ผู้รับผิดชอบ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-xs"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <option value="all">ทุกสถานะ</option>
                      <option value="scheduled">กำหนดการ</option>
                      <option value="in-progress">กำลังตรวจ</option>
                      <option value="done">ตรวจแล้ว</option>
                      <option value="missed">ไม่ได้ตรวจ</option>
                    </select>
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-xs"
                      value={freqFilter}
                      onChange={(e) => setFreqFilter(e.target.value as any)}
                    >
                      <option value="all">ทุกความถี่</option>
                      <option value="daily">รายวัน</option>
                      <option value="monthly">รายเดือน</option>
                    </select>
                  </div>
                </Card>

                {/* Schedule list */}
                <div className="grid gap-3.5">
                  {filtered.map((item) => {
                    const s = STATUS_CONFIG[item.status];
                    const statusBorderColor =
                      item.status === "in-progress" ? "border-l-cyan-500" :
                      item.status === "done" ? "border-l-emerald-500" :
                      item.status === "missed" ? "border-l-red-500" : "border-l-blue-500";

                    return (
                      <Card
                        key={item.schedule_id}
                        className={cn(
                          "group p-4 sm:p-5 pl-5 sm:pl-6 hover:shadow-md transition-all border-l-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer",
                          statusBorderColor
                        )}
                        onClick={() => setSelectedSchedule(item)}
                      >
                        <div className="space-y-2.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 tracking-wide shrink-0">
                              {item.schedule_id}
                            </span>
                            <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                              {item.title}
                            </h3>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs shrink-0", s.cls)}>
                              {s.icon}{s.label}
                            </span>
                            {item.matrix_template_id && (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shrink-0">
                                {item.matrix_template_id.includes("HOURLY") ? "⏱️ ตาราง 24 ชม." : "🏭 ตารางกะ & จุดเครื่องจักร"}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-0.5">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="text-foreground/80 font-medium">{item.machine_name}</span>
                              <span className="text-muted-foreground">({item.zone || "-"})</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{item.scheduled_date}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{item.scheduled_time_start} - {item.scheduled_time_end}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{item.assigned_to_name}</span>
                            </span>
                          </div>

                          {item.matrix_progress && (
                            <div className="flex items-center gap-3 pt-1.5 max-w-sm">
                              <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/70 dark:border-slate-700">
                                <div
                                  className="h-full bg-blue-600 rounded-full transition-all"
                                  style={{ width: `${Math.round((item.matrix_progress.logged_slots / item.matrix_progress.total_slots) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground font-mono font-medium shrink-0">
                                ลงตรวจ {item.matrix_progress.logged_slots}/{item.matrix_progress.total_slots} รอบ
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0 pl-0 sm:pl-3" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold px-3.5 py-2 shadow-xs transition-all"
                            onClick={() => navigate(`/qc/record/${item.schedule_id}`)}
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" /> ลงเวลาตรวจ
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* ─── SECTION 2: TEMPLATES & BUILDER ───────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeNav === "templates" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
                  <div>
                    <h3 className="font-bold text-sm">คลังแม่แบบเอกสาร QC (Factory QC Templates)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      แม่แบบเอกสารตรวจสอบมาตรฐานโรงงาน รองรับตารางตรวจสอบ 24 ชั่วโมง และตารางพารามิเตอร์แยกตามกะ
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground gap-1.5 shadow-sm"
                    onClick={() => setShowCreateTemplate(true)}
                  >
                    <Plus className="h-4 w-4" /> สร้างแม่แบบใหม่
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matrixTemplates.map((tpl) => (
                    <Card key={tpl.template_id} className="p-5 flex flex-col justify-between space-y-4 border-l-4 border-l-primary">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{tpl.document_no || tpl.template_id}</span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
                            {tpl.template_type === "hourly_matrix" ? "⏱️ ตาราง 24 ชม." : "🏭 ตารางกะ & จุดเครื่องจักร"}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-foreground">{tpl.title}</h4>
                        <p className="text-xs text-muted-foreground">{tpl.company_name} — {tpl.line_or_zone}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-lg text-center text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">รายการตรวจ</span>
                          <strong className="text-sm">{tpl.rows.length}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            {tpl.template_type === "hourly_matrix" ? "ช่วงเวลา" : "จุดตรวจ"}
                          </span>
                          <strong className="text-sm">{tpl.columns.length}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">กะ/ผู้ตรวจ</span>
                          <strong className="text-sm">{tpl.shifts ? `${tpl.shifts.length} กะ` : "Millhand"}</strong>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs gap-1"
                          onClick={() => navigate(`/qc/record/QCS-2026-001`)}
                        >
                          <Eye className="h-3.5 w-3.5" /> ดูตัวอย่างแบบฟอร์ม
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-primary text-primary-foreground text-xs gap-1"
                          onClick={() => setShowNewSchedule(true)}
                        >
                          <Calendar className="h-3.5 w-3.5" /> นำไปสร้างตาราง
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* ─── SECTION 3: STATS ─────────────────────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeNav === "stats" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 space-y-3">
                  <h3 className="font-bold text-sm">ประสิทธิภาพการตรวจรายบุคคล</h3>
                  {Object.values(QC_OFFICER_MAP).map((officer) => (
                    <div key={officer.id} className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-sm block">{officer.name}</strong>
                        <span className="text-muted-foreground">{officer.id}</span>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        Compliance 100%
                      </span>
                    </div>
                  ))}
                </Card>

                <Card className="p-5 space-y-3">
                  <h3 className="font-bold text-sm">การเชื่อมต่อกับระบบซ่อมบำรุง</h3>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Wrench className="h-4 w-4 text-rose-600" /> ตรวจพบปัญหาและส่งซ่อมแล้ว 1 รายการ
                    </div>
                    <p className="text-rose-700">
                      หลอดไฟช่องคัดแยกดับ 1 หลอด — เชื่อมโยงใบแจ้งซ่อม <strong>REQ-20260422-001</strong> ไปยังฝ่ายช่างแล้ว
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals & Drawers */}
      {showCreateTemplate && (
        <CreateMatrixTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onSave={(tpl) => setMatrixTemplates((prev) => [tpl, ...prev])}
        />
      )}

      {showNewSchedule && (
        <NewScheduleModal
          matrixTemplates={matrixTemplates}
          onClose={() => setShowNewSchedule(false)}
          onSave={(s) => setSchedules((prev) => [s, ...prev])}
        />
      )}

      {selectedSchedule && (
        <ScheduleDetailDrawer
          item={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onViewRecord={(id) => navigate(`/qc/record/${id}`)}
        />
      )}
    </div>
  );
}
