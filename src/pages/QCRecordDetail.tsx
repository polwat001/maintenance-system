import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Clock, CheckCircle2, XCircle,
  AlertTriangle, Wrench, MapPin, User, Calendar,
  FileText, ExternalLink, Printer, Plus, Check,
  AlertCircle, ShieldCheck, ChevronRight, PenTool,
  Save, Sparkles, Filter, RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MOCK_QC_SCHEDULES,
  MOCK_QC_MATRIX_TEMPLATES,
  MOCK_QC_MATRIX_RECORDS,
  MOCK_REQUESTS,
  QCSchedule,
  QCMatrixTemplate,
  QCMatrixRecordData,
  QCMatrixCellValue,
  QCCellStatus,
  QCMatrixRow,
  QCMatrixColumn,
  WorkRequest,
} from "@/lib/mockData";
import { toast } from "sonner";

// ─── Symbols & Helpers ────────────────────────────────────────────────────────

const STATUS_ICONS: Record<QCCellStatus, { symbol: string; label: string; cls: string; bg: string }> = {
  normal:        { symbol: "✓", label: "ปกติ",         cls: "text-emerald-700 font-bold", bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
  abnormal:      { symbol: "O", label: "ผิดปกติ",      cls: "text-amber-700 font-bold",   bg: "bg-amber-50 hover:bg-amber-100 border-amber-200" },
  repair_needed: { symbol: "✗", label: "ต้องซ่อม",     cls: "text-rose-700 font-bold",    bg: "bg-rose-50 hover:bg-rose-100 border-rose-200" },
  inactive:      { symbol: "-", label: "ไม่เปิดใช้งาน", cls: "text-slate-500 font-bold",   bg: "bg-slate-100 hover:bg-slate-200 border-slate-200" },
  na:            { symbol: "",  label: "ไม่ต้องตรวจ",   cls: "text-transparent",           bg: "bg-muted/40" },
};

export default function QCRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from === "templates") {
      navigate("/qc/dashboard?tab=templates");
    } else if (from === "schedule") {
      navigate("/qc/dashboard?tab=schedule");
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/qc/dashboard");
    }
  };

  // Schedule lookup
  const schedule = id ? MOCK_QC_SCHEDULES.find((s) => s.schedule_id === id) : undefined;

  // Active matrix template lookup (fallback to hourly preset if not matched)
  const template = useMemo<QCMatrixTemplate | undefined>(() => {
    if (!schedule) return undefined;
    const match = MOCK_QC_MATRIX_TEMPLATES.find((t) => t.template_id === schedule.matrix_template_id);
    if (match) return match;
    return MOCK_QC_MATRIX_TEMPLATES[0]; // fallback
  }, [schedule]);

  // Record data state
  const [recordData, setRecordData] = useState<QCMatrixRecordData>(() => {
    if (id && MOCK_QC_MATRIX_RECORDS[id]) {
      return JSON.parse(JSON.stringify(MOCK_QC_MATRIX_RECORDS[id]));
    }
    return {
      record_id: `MAT-REC-${Date.now()}`,
      schedule_id: id || "QCS-DEFAULT",
      template_id: template?.template_id || "TPL-HOURLY-002",
      date: new Date().toISOString().split("T")[0],
      cells: {},
      column_signoffs: {},
      shift_signoffs: {},
      supervisor_approval: { status: "pending" },
    };
  });

  // Modal / Drawer states
  const [editingCell, setEditingCell] = useState<{
    key: string;
    shiftId?: string;
    row: QCMatrixRow;
    col: QCMatrixColumn;
    cellData: QCMatrixCellValue;
  } | null>(null);

  const [quickSlotModal, setQuickSlotModal] = useState<{ colId: string; colLabel: string } | null>(null);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorName, setSupervisorName] = useState(recordData.supervisor_approval?.approved_by || "สมบัติ รัตนวงศ์ (หัวหน้าแผนก)");
  const [supervisorComment, setSupervisorComment] = useState(recordData.supervisor_approval?.comment || "");

  if (!schedule || !template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-lg font-semibold">ไม่พบบันทึก QC หรือไม่พบรูปแบบเอกสาร</p>
        <p className="text-sm text-muted-foreground text-center">Schedule ID: {id}</p>
        <Button onClick={handleBack}>กลับ QC Dashboard</Button>
      </div>
    );
  }

  // ─── Cell Helpers ────────────────────────────────────────────────────────────

  const getCellKey = (shiftId: string | undefined, rowId: string, colId: string) => {
    return `${shiftId || "default"}_${rowId}_${colId}`;
  };

  const getCellData = (shiftId: string | undefined, rowId: string, colId: string): QCMatrixCellValue => {
    const key = getCellKey(shiftId, rowId, colId);
    return recordData.cells[key] || {};
  };

  const isCellDisabled = (row: QCMatrixRow, col: QCMatrixColumn) => {
    if (col.disabled_for_items?.includes(row.row_id)) return true;
    if (row.applicable_columns && !row.applicable_columns.includes(col.col_id)) return true;
    return false;
  };

  // ─── Cell Edit Handlers ──────────────────────────────────────────────────────

  const handleOpenCell = (row: QCMatrixRow, col: QCMatrixColumn, shiftId?: string) => {
    if (isCellDisabled(row, col)) return;
    const key = getCellKey(shiftId, row.row_id, col.col_id);
    const cellData = getCellData(shiftId, row.row_id, col.col_id);
    setEditingCell({
      key,
      shiftId,
      row,
      col,
      cellData: { ...cellData },
    });
  };

  const handleSaveCell = (newCellData: QCMatrixCellValue) => {
    if (!editingCell) return;
    const updated = {
      ...newCellData,
      logged_at: newCellData.logged_at || new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      logged_by: newCellData.logged_by || "วิชัย ป. (Millhand)",
    };

    setRecordData((prev) => ({
      ...prev,
      cells: {
        ...prev.cells,
        [editingCell.key]: updated,
      },
    }));

    toast.success(`บันทึกข้อมูล ${editingCell.row.title} (${editingCell.col.label}) เรียบร้อย`);
    setEditingCell(null);
  };

  const handleCreateWorkRequest = (row: QCMatrixRow, col: QCMatrixColumn, note?: string) => {
    const reqId = `REQ-${Date.now().toString().slice(-8)}`;
    const newReq: WorkRequest = {
      request_id: reqId,
      asset_name: schedule.machine_name,
      asset_location: schedule.zone || "ฝ่ายผลิต",
      issue_summary: `QC ตรวจพบปัญหา: ${row.title} [รอบ/จุด: ${col.label}] ${note ? `(${note})` : ""}`,
      priority: "high",
      status: "open",
      sub_status: "reported",
      reported_time: new Date().toISOString(),
      reported_by: "เจ้าหน้าที่ QC (จากแบบฟอร์มตรวจสอบ)",
      reported_by_department: "ฝ่ายควบคุมคุณภาพ (QC)",
      category: "mechanical",
      attachments: [],
      status_timeline: [
        {
          event_id: `EV-${Date.now()}`,
          status: "open",
          updated_by: "QC Inspector",
          updated_by_role: "system",
          updated_at: new Date().toISOString(),
          note: "สร้างคำขออัตโนมัติจากใบตรวจสอบ QC",
        },
      ],
      requester_notifications: [],
    };

    MOCK_REQUESTS.unshift(newReq);

    if (editingCell) {
      setEditingCell((prev) => prev ? {
        ...prev,
        cellData: {
          ...prev.cellData,
          status: "repair_needed",
          work_request_id: reqId,
          note: note || prev.cellData.note,
        },
      } : null);
    }

    toast.success(`สร้างใบแจ้งซ่อม ${reqId} เรียบร้อยแล้ว`, {
      description: "ส่งงานไปยังกระดานช่างซ่อมบำรุงแล้ว",
      action: {
        label: "ดูกระดานช่าง",
        onClick: () => navigate("/board"),
      },
    });
  };

  // ─── Slot Quick Actions (Hourly Mode) ────────────────────────────────────────

  const handleMarkAllNormal = (colId: string) => {
    setRecordData((prev) => {
      const nextCells = { ...prev.cells };
      template.rows.forEach((r) => {
        const col = template.columns.find((c) => c.col_id === colId);
        if (!col || isCellDisabled(r, col)) return;
        const key = getCellKey(undefined, r.row_id, colId);
        if (r.input_type === "status_symbol") {
          nextCells[key] = {
            status: "normal",
            logged_at: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
            logged_by: "วิชัย ป. (Millhand)",
          };
        }
      });

      const nextSignoffs = {
        ...prev.column_signoffs,
        [`default_${colId}`]: {
          inspector_name: "วิชัย ป.",
          inspector_time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          verifier_name: prev.column_signoffs?.[`default_${colId}`]?.verifier_name || "ธีรเดช ส.",
          verifier_time: prev.column_signoffs?.[`default_${colId}`]?.verifier_time || new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        },
      };

      return {
        ...prev,
        cells: nextCells,
        column_signoffs: nextSignoffs,
      };
    });

    toast.success(`บันทึกผ่านปกติทุกรายการสำหรับรอบเวลา ${template.columns.find((c) => c.col_id === colId)?.label}`);
    setQuickSlotModal(null);
  };

  const handleSignSlot = (colId: string, role: "inspector" | "verifier") => {
    const timeNow = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const key = `default_${colId}`;
    setRecordData((prev) => ({
      ...prev,
      column_signoffs: {
        ...prev.column_signoffs,
        [key]: {
          ...prev.column_signoffs?.[key],
          [role === "inspector" ? "inspector_name" : "verifier_name"]: role === "inspector" ? "วิชัย ป." : "ธีรเดช ส.",
          [role === "inspector" ? "inspector_time" : "verifier_time"]: timeNow,
        },
      },
    }));
    toast.success(`ลงลายมือชื่อ ${role === "inspector" ? "ผู้ตรวจสอบ (Millhand)" : "ผู้ทวนสอบ (Miller)"} เรียบร้อย`);
  };

  // ─── Shift Signoff (Shift Parameter Mode) ────────────────────────────────────

  const handleSignShift = (shiftId: string) => {
    const timeNow = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setRecordData((prev) => ({
      ...prev,
      shift_signoffs: {
        ...prev.shift_signoffs,
        [shiftId]: {
          inspector_name: "มานะ วงศ์ไทย",
          inspector_time: timeNow,
          verifier_name: "ณัฐพงศ์ QC",
          verifier_time: timeNow,
        },
      },
    }));
    toast.success(`ลงลายมือชื่อตรวจกะเรียบร้อยแล้ว`);
  };

  // ─── Supervisor Approval ─────────────────────────────────────────────────────

  const handleApproveSupervisor = () => {
    setRecordData((prev) => ({
      ...prev,
      supervisor_approval: {
        approved_by: supervisorName,
        approved_at: new Date().toISOString(),
        status: "approved",
        comment: supervisorComment,
      },
    }));
    setShowSupervisorModal(false);
    toast.success("หัวหน้าแผนกลงนามอนุมัติเอกสารเรียบร้อย");
  };

  // ─── Stats calculation ───────────────────────────────────────────────────────

  const totalCellsCount = Object.keys(recordData.cells).length;
  const repairNeededCount = Object.values(recordData.cells).filter((c) => c.status === "repair_needed").length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-800 w-full max-w-full overflow-x-clip md:overflow-x-visible">
      {/* ─── Web Header (Hidden during print) ────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground shadow-md print:hidden">
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/10 shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-primary-foreground/70 font-mono shrink-0">
                  {schedule.schedule_id}
                </span>
                <span className="bg-white/20 text-white text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium truncate max-w-[130px] sm:max-w-none">
                  {template.template_type === "hourly_matrix" ? "⏱️ 24 ชม." : "🏭 ตารางกะ & จุดเครื่องจักร"}
                </span>
              </div>
              <h1 className="font-bold text-xs sm:text-lg truncate max-w-full">{template.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {template.template_type === "hourly_matrix" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm hidden sm:inline-flex"
                onClick={() => setQuickSlotModal({ colId: "08_00", colLabel: "08.00" })}
              >
                <Clock className="h-4 w-4" /> ลงเวลาตรวจรอบนี้
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1 sm:gap-1.5 h-8 sm:h-9 px-2 sm:px-3 text-xs shrink-0"
              onClick={() => window.print()}
              title="พิมพ์เอกสาร"
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>พิมพ์</span><span className="hidden sm:inline">เอกสาร</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Canvas ─────────────────────────────────────────────── */}
      <main className="flex-1 p-2 sm:p-6 max-w-7xl mx-auto w-full space-y-3 sm:space-y-4 print:p-0 print:m-0 print:max-w-none min-w-0">

        {/* ─── Quick Summary Bar (Web only) ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border shadow-sm print:hidden">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {template.line_or_zone || schedule.zone || "สายการผลิต"}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" /> วันที่: <strong>{schedule.scheduled_date}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-4 w-4 text-primary" /> ผู้รับผิดชอบ QC: <strong>{schedule.assigned_to_name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border">
              บันทึกแล้ว {totalCellsCount} เซลล์
            </span>
            {repairNeededCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold border border-rose-200 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> พบต้องซ่อม {repairNeededCount} จุด
              </span>
            )}
            {recordData.supervisor_approval?.status === "approved" ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> หัวหน้าอนุมัติแล้ว
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                onClick={() => setShowSupervisorModal(true)}
              >
                <PenTool className="h-3 w-3" /> รอหัวหน้าลงนาม
              </Button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ─── OFFICIAL PRINT-PERFECT SHEET CONTAINER ─────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border rounded-xl shadow-md p-2.5 sm:p-6 print:border-none print:shadow-none print:p-2 print:rounded-none">
          
          {/* ── Official Document Header ── */}
          <div className="border-b-2 border-slate-800 pb-3 mb-4 space-y-1">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                  {template.company_name || "บริษัท เพรซิเดนท์ฟลาวมิลล์ จำกัด"}
                </h2>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-wider uppercase mt-1 break-words">
                  {template.title}
                </h3>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono shrink-0">
                <div>{template.page_info || "หน้า 1"}</div>
                {template.document_no && <div className="text-slate-500 font-bold">{template.document_no}</div>}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center text-xs pt-1 text-slate-700 font-medium gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="truncate max-w-[200px] sm:max-w-none">POSITION PRODUCTION: ............................................</span>
                <span>MACHINE: <strong className="text-slate-900">{schedule.machine_name}</strong></span>
              </div>
              <div>
                <span>LINE: <strong className="text-slate-900">{template.line_or_zone || "ROLLERMILL Line C"}</strong></span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ─── CASE A: HOURLY MATRIX (Image 2 style) ─────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {template.template_type === "hourly_matrix" && (
            <div className="overflow-x-auto overscroll-x-contain border border-slate-700 rounded-lg pb-1 bg-white">
              <table className="w-full qc-matrix-table-desktop text-xs border-collapse">
                <thead>
                  {/* Top header row */}
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-700">
                    <th
                      rowSpan={2}
                      className="p-1.5 sm:p-2.5 text-center font-bold border-r border-slate-700 w-[125px] sm:w-[160px] md:w-[260px] min-w-[125px] sm:min-w-[160px] md:min-w-[240px] max-w-[125px] sm:max-w-[160px] md:max-w-[280px] sticky left-0 bg-slate-100 z-20"
                    >
                      รายการตรวจสอบ
                    </th>
                    <th
                      colSpan={template.columns.length}
                      className="p-1.5 text-center font-bold tracking-wider border-r border-slate-700 uppercase"
                    >
                      เวลาตรวจสอบ
                    </th>
                    <th rowSpan={2} className="p-2 text-center font-bold min-w-[100px] sm:min-w-[120px]">
                      หมายเหตุ
                    </th>
                  </tr>

                  {/* Sub header row: hourly time slots */}
                  <tr className="bg-slate-50 border-b border-slate-700 text-slate-800">
                    {template.columns.map((col) => (
                      <th
                        key={col.col_id}
                        onClick={() => setQuickSlotModal({ colId: col.col_id, colLabel: col.label })}
                        className="p-1.5 text-center font-bold border-r border-slate-300 min-w-[46px] cursor-pointer hover:bg-blue-50 transition-colors select-none group"
                        title="คลิกเพื่อลงตรวจรอบเวลานี้"
                      >
                        <div className="group-hover:text-primary transition-colors">{col.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {template.rows.map((row, rIdx) => (
                    <tr
                      key={row.row_id}
                      className={cn(
                        "border-b border-slate-300 transition-colors hover:bg-slate-100",
                        rIdx % 2 === 1 ? "bg-slate-50" : "bg-white"
                      )}
                    >
                      {/* Row Title */}
                      <td className={cn(
                        "p-1.5 sm:p-2 border-r border-slate-700 font-medium text-slate-800 sticky left-0 z-10 text-[11px] leading-snug",
                        "w-[125px] sm:w-[160px] md:w-[260px] min-w-[125px] sm:min-w-[160px] md:min-w-[240px] max-w-[125px] sm:max-w-[160px] md:max-w-[280px]",
                        rIdx % 2 === 1 ? "bg-slate-50" : "bg-white"
                      )}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="line-clamp-2 md:line-clamp-none md:whitespace-nowrap leading-tight">{row.title}</span>
                          {row.unit && (
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                              ({row.unit})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cell columns */}
                      {template.columns.map((col) => {
                        const disabled = isCellDisabled(row, col);
                        const cell = getCellData(undefined, row.row_id, col.col_id);

                        if (disabled) {
                          return (
                            <td
                              key={col.col_id}
                              className="border-r border-slate-300 text-center p-0 h-8 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_4px,#e2e8f0_4px,#e2e8f0_8px)] cursor-not-allowed"
                              title="ไม่ต้องตรวจสอบในรอบเวลานี้"
                            />
                          );
                        }

                        const statusStyle = cell.status ? STATUS_ICONS[cell.status] : null;

                        return (
                          <td
                            key={col.col_id}
                            onClick={() => handleOpenCell(row, col)}
                            className={cn(
                              "border-r border-slate-300 text-center p-1 h-8 cursor-pointer transition-all select-none",
                              statusStyle ? statusStyle.bg : "hover:bg-blue-50/50",
                              cell.work_request_id && "ring-1 ring-rose-500 font-bold"
                            )}
                            title={cell.note ? `หมายเหตุ: ${cell.note}` : "คลิกเพื่อบันทึก/แก้ไข"}
                          >
                            {row.input_type === "status_symbol" ? (
                              <span className={cn("text-xs", statusStyle?.cls)}>
                                {statusStyle ? statusStyle.symbol : "·"}
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  "text-[11px] font-mono",
                                  cell.numeric_value !== undefined ? "font-semibold text-slate-900" : "text-slate-300",
                                  row.min_value && cell.numeric_value !== undefined && cell.numeric_value < row.min_value && "text-rose-600 font-bold underline",
                                  row.max_value && cell.numeric_value !== undefined && cell.numeric_value > row.max_value && "text-rose-600 font-bold underline"
                                )}
                              >
                                {cell.numeric_value !== undefined ? cell.numeric_value : "·"}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Note */}
                      <td className="p-1.5 text-[11px] text-muted-foreground border-l border-slate-300">
                        {row.note || "ปกติ"}
                      </td>
                    </tr>
                  ))}

                  {/* ─── Signoff Rows ─── */}
                  {/* Row: Millhand */}
                  <tr className="bg-amber-50/40 border-t-2 border-slate-700 text-[11px]">
                    <td className="p-1.5 sm:p-2 font-bold text-slate-800 border-r border-slate-700 sticky left-0 bg-amber-50 z-10 w-[125px] sm:w-[160px] md:w-[260px] min-w-[125px] sm:min-w-[160px] md:min-w-[240px] max-w-[125px] sm:max-w-[160px] md:max-w-[280px]">
                      <div>ผู้ตรวจสอบ</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Millhand</div>
                    </td>
                    {template.columns.map((col) => {
                      const sign = recordData.column_signoffs?.[`default_${col.col_id}`];
                      return (
                        <td
                          key={col.col_id}
                          onClick={() => handleSignSlot(col.col_id, "inspector")}
                          className="border-r border-slate-300 text-center p-1 cursor-pointer hover:bg-amber-100 transition-colors"
                          title="คลิกเพื่อลงลายมือชื่อผู้ตรวจสอบ"
                        >
                          {sign?.inspector_name ? (
                            <span className="font-medium text-emerald-800 text-[10px] block leading-tight">
                              {sign.inspector_name.slice(0, 5)}
                              <span className="block text-[8px] text-slate-500">{sign.inspector_time}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px]">ลงชื่อ</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-1.5 text-[10px] text-muted-foreground">พนักงานระดับ Millhand ขึ้นไป</td>
                  </tr>

                  {/* Row: Miller */}
                  <tr className="bg-blue-50/30 border-t border-slate-300 text-[11px]">
                    <td className="p-1.5 sm:p-2 font-bold text-slate-800 border-r border-slate-700 sticky left-0 bg-blue-50 z-10 w-[125px] sm:w-[160px] md:w-[260px] min-w-[125px] sm:min-w-[160px] md:min-w-[240px] max-w-[125px] sm:max-w-[160px] md:max-w-[280px]">
                      <div>ผู้ทวนสอบ</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Miller</div>
                    </td>
                    {template.columns.map((col) => {
                      const sign = recordData.column_signoffs?.[`default_${col.col_id}`];
                      return (
                        <td
                          key={col.col_id}
                          onClick={() => handleSignSlot(col.col_id, "verifier")}
                          className="border-r border-slate-300 text-center p-1 cursor-pointer hover:bg-blue-100 transition-colors"
                          title="คลิกเพื่อลงลายมือชื่อผู้ทวนสอบ"
                        >
                          {sign?.verifier_name ? (
                            <span className="font-medium text-blue-900 text-[10px] block leading-tight">
                              {sign.verifier_name.slice(0, 5)}
                              <span className="block text-[8px] text-slate-500">{sign.verifier_time}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px]">ทวนสอบ</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-1.5 text-[10px] text-muted-foreground">หัวหน้ากะ / Miller</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ─── CASE B: SHIFT & MACHINE PARAMETERS (Image 1 style) ────────────── */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {template.template_type === "shift_parameter_matrix" && (
            <div className="overflow-x-auto overscroll-x-contain border border-slate-700 rounded-lg pb-1 bg-white">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-700">
                    <th rowSpan={2} className="p-1 sm:p-2 text-center font-bold border-r border-slate-700 w-12 sm:w-16 min-w-[48px] sm:min-w-[64px] text-[11px] sm:text-xs">
                      SHIFT
                    </th>
                    <th rowSpan={2} className="p-1.5 sm:p-2.5 text-center font-bold border-r border-slate-700 w-[115px] sm:w-[150px] md:w-auto min-w-[115px] sm:min-w-[150px] md:min-w-[160px] max-w-[115px] sm:max-w-[150px] md:max-w-none text-[11px] sm:text-xs">
                      PARAMETERS
                    </th>
                    <th
                      colSpan={template.columns.filter((c) => c.col_id !== "inspector").length}
                      className="p-1.5 text-center font-bold border-r border-slate-700 uppercase"
                    >
                      {template.line_or_zone || "ROLLERMILL Line C"}
                    </th>
                    <th rowSpan={2} className="p-2 text-center font-bold min-w-[70px]">
                      ผู้ตรวจ
                    </th>
                  </tr>

                  {/* Machine columns: B1B2, B3, B4... C10 */}
                  <tr className="bg-slate-50 border-b border-slate-700 text-slate-800">
                    {template.columns.filter((c) => c.col_id !== "inspector").map((col) => (
                      <th
                        key={col.col_id}
                        className="p-1.5 text-center font-bold border-r border-slate-300 min-w-[48px]"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {template.shifts?.map((shift) => {
                    const shiftSign = recordData.shift_signoffs?.[shift.shift_id];

                    return template.rows.map((row, rIdx) => {
                      const isFirstRowOfShift = rIdx === 0;

                      return (
                        <tr
                          key={`${shift.shift_id}_${row.row_id}`}
                          className={cn(
                            "border-b border-slate-300 hover:bg-slate-50/70 transition-colors",
                            rIdx === template.rows.length - 1 && "border-b-2 border-slate-800"
                          )}
                        >
                          {/* Shift Label (Spanned across rows) */}
                          {isFirstRowOfShift && (
                            <td
                              rowSpan={template.rows.length}
                              className="p-1 sm:p-2 text-center font-black text-xs sm:text-sm border-r-2 border-slate-700 bg-slate-100 text-slate-900 select-none align-middle w-12 sm:w-16 min-w-[48px] sm:min-w-[64px]"
                            >
                              <div className="font-bold text-sm sm:text-base">{shift.name.replace("SHIFT ", "")}</div>
                              <div className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 sm:mt-1">{shift.time_range}</div>
                            </td>
                          )}

                          {/* Parameter Title */}
                          <td className="p-1.5 sm:p-2 border-r border-slate-700 font-medium text-slate-800 text-[10px] sm:text-[11px] w-[115px] sm:w-[150px] md:w-auto min-w-[115px] sm:min-w-[150px] md:min-w-[160px] max-w-[115px] sm:max-w-[150px] md:max-w-none">
                            <div className="flex items-center justify-between gap-1">
                              <span className="line-clamp-2 md:line-clamp-none">{row.title}</span>
                              {row.unit && <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono shrink-0">({row.unit})</span>}
                            </div>
                          </td>

                          {/* Machine point columns */}
                          {template.columns.filter((c) => c.col_id !== "inspector").map((col) => {
                            const disabled = isCellDisabled(row, col);
                            const cell = getCellData(shift.shift_id, row.row_id, col.col_id);

                            if (disabled) {
                              return (
                                <td
                                  key={col.col_id}
                                  className="border-r border-slate-300 text-center p-0 h-8 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_4px,#e2e8f0_4px,#e2e8f0_8px)] cursor-not-allowed"
                                  title="จุดนี้ไม่มีการตรวจพารามิเตอร์นี้"
                                />
                              );
                            }

                            const statusStyle = cell.status ? STATUS_ICONS[cell.status] : null;

                            return (
                              <td
                                key={col.col_id}
                                onClick={() => handleOpenCell(row, col, shift.shift_id)}
                                className={cn(
                                  "border-r border-slate-300 text-center p-1 h-8 cursor-pointer transition-all select-none",
                                  statusStyle ? statusStyle.bg : "hover:bg-blue-50/50"
                                )}
                                title={cell.note || "คลิกเพื่อแก้ไข"}
                              >
                                {row.input_type === "status_symbol" ? (
                                  <span className={cn("text-xs font-bold", statusStyle?.cls)}>
                                    {statusStyle ? statusStyle.symbol : "·"}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-mono text-slate-900 font-medium">
                                    {cell.numeric_value !== undefined ? cell.numeric_value : (cell.text_value || "·")}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Inspector column for this shift */}
                          {isFirstRowOfShift && (
                            <td
                              rowSpan={template.rows.length}
                              onClick={() => handleSignShift(shift.shift_id)}
                              className="p-2 text-center border-l border-slate-700 bg-amber-50/30 hover:bg-amber-100 cursor-pointer align-middle transition-colors"
                              title="คลิกเพื่อลงลายมือชื่อผู้ตรวจประจำกะ"
                            >
                              {shiftSign?.inspector_name ? (
                                <div className="space-y-0.5">
                                  <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                  <span className="font-bold text-emerald-900 text-[10px] block">{shiftSign.inspector_name}</span>
                                  <span className="text-[9px] text-slate-500 font-mono block">{shiftSign.inspector_time}</span>
                                </div>
                              ) : (
                                <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                                  <PenTool className="h-3.5 w-3.5" />
                                  <span>ลงชื่อ</span>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Official Document Footer & Guidelines ── */}
          <div className="mt-4 pt-3 border-t border-slate-400 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
            {/* Guidelines */}
            <div className="md:col-span-2 space-y-1">
              <span className="font-bold text-slate-900 block">หมายเหตุ:</span>
              <ul className="space-y-0.5 text-[11px] text-slate-700">
                {template.notes_guidelines?.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>

              {/* Status Symbol Legend */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px]">
                <span className="font-bold">สัญลักษณ์:</span>
                <span className="inline-flex items-center gap-1"><span className="text-emerald-700 font-bold border px-1 rounded bg-emerald-50">✓</span> ปกติ</span>
                <span className="inline-flex items-center gap-1"><span className="text-amber-700 font-bold border px-1 rounded bg-amber-50">O</span> ผิดปกติ</span>
                <span className="inline-flex items-center gap-1"><span className="text-rose-700 font-bold border px-1 rounded bg-rose-50">✗</span> ต้องซ่อม</span>
                <span className="inline-flex items-center gap-1"><span className="text-slate-600 font-bold border px-1 rounded bg-slate-100">-</span> ไม่เปิดใช้งาน</span>
              </div>
            </div>

            {/* Supervisor Signature Stamp Box */}
            <div className="border border-slate-700 rounded-lg p-3 text-center flex flex-col justify-between bg-slate-50/50">
              <div className="text-[11px] font-bold text-slate-900">หัวหน้าแผนก (Supervisor Approval)</div>
              
              <div className="py-2">
                {recordData.supervisor_approval?.status === "approved" ? (
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" /> อนุมัติแล้ว
                    </span>
                    <p className="text-xs font-bold text-slate-900">{recordData.supervisor_approval.approved_by}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(recordData.supervisor_approval.approved_at || "").toLocaleDateString("th-TH")}
                    </p>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-1">
                    ............................................................
                    <div className="text-[10px] text-slate-500 mt-1">วันที่ ......./......./.......</div>
                  </div>
                )}
              </div>

              {recordData.supervisor_approval?.status !== "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-7 border-slate-400 hover:bg-slate-200 print:hidden"
                  onClick={() => setShowSupervisorModal(true)}
                >
                  <PenTool className="h-3 w-3 mr-1" /> ลงนามอนุมัติ
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Related Work Requests Card (Web Only) ── */}
        {repairNeededCount > 0 && (
          <Card className="p-4 border-rose-200 bg-rose-50/40 print:hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h4 className="font-bold text-sm text-rose-950">รายการที่ต้องแจ้งซ่อมจากการตรวจ QC</h4>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1 border-rose-300 text-rose-700" onClick={() => navigate("/board")}>
                <ExternalLink className="h-3 w-3" /> ไปที่ Technician Board
              </Button>
            </div>
            <p className="text-xs text-rose-800">
              พบ {repairNeededCount} จุดที่ถูกระบุว่า "ต้องซ่อม (✗)" — ระบบได้เชื่อมโยงการแจ้งซ่อมเข้าสู่ระบบหลักแล้ว
            </p>
          </Card>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 1: EDIT CELL VALUE ────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setEditingCell(null)} aria-hidden="true" />
          <div className="relative z-10 bg-card rounded-2xl shadow-2xl w-full max-w-md border overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b bg-muted/40 flex justify-between items-center">
              <div>
                <p className="text-xs font-mono text-primary uppercase">{editingCell.col.label}</p>
                <h3 className="font-bold text-sm text-foreground">{editingCell.row.title}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingCell(null)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type: Status Symbol */}
              {editingCell.row.input_type === "status_symbol" ? (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">เลือกสถานะ:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["normal", "abnormal", "repair_needed", "inactive"] as QCCellStatus[]).map((st) => {
                      const cfg = STATUS_ICONS[st];
                      const isSelected = editingCell.cellData.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() =>
                            setEditingCell((prev) =>
                              prev ? { ...prev, cellData: { ...prev.cellData, status: st } } : null
                            )
                          }
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all",
                            isSelected
                              ? `${cfg.bg} border-primary ring-2 ring-primary/30`
                              : "hover:bg-muted border-border"
                          )}
                        >
                          <span className={cn("text-base", cfg.cls)}>{cfg.symbol}</span>
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Type: Number or Text */
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    ค่าที่วัดได้ ({editingCell.row.unit || "-"}):
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="เช่น 6.2"
                    value={editingCell.cellData.numeric_value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setEditingCell((prev) =>
                        prev ? { ...prev, cellData: { ...prev.cellData, numeric_value: val } } : null
                      );
                    }}
                    className="font-mono text-lg font-bold"
                  />
                  {(editingCell.row.min_value !== undefined || editingCell.row.max_value !== undefined) && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      เกณฑ์มาตรฐาน: {editingCell.row.min_value ?? "-"} ถึง {editingCell.row.max_value ?? "-"} {editingCell.row.unit}
                    </p>
                  )}
                </div>
              )}

              {/* Note input */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">หมายเหตุเฉพาะจุด:</label>
                <Input
                  placeholder="เช่น หลอดไฟดับ, มีเสียงดังเล็กน้อย"
                  value={editingCell.cellData.note ?? ""}
                  onChange={(e) =>
                    setEditingCell((prev) =>
                      prev ? { ...prev, cellData: { ...prev.cellData, note: e.target.value } } : null
                    )
                  }
                />
              </div>

              {/* Trigger create work request */}
              {(editingCell.cellData.status === "repair_needed" || editingCell.cellData.status === "abnormal") && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    ต้องการแจ้งฝ่ายช่างซ่อมบำรุงทันทีหรือไม่?
                  </div>
                  {editingCell.cellData.work_request_id ? (
                    <p className="text-xs text-rose-700 font-mono">
                      ✓ เชื่อมต่อกับใบแจ้งซ่อม: <strong>{editingCell.cellData.work_request_id}</strong>
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1"
                      onClick={() => handleCreateWorkRequest(editingCell.row, editingCell.col, editingCell.cellData.note)}
                    >
                      <Wrench className="h-3.5 w-3.5" /> ส่งแจ้งซ่อมทันที (Create Work Request)
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-muted/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingCell(null)}>ยกเลิก</Button>
              <Button size="sm" className="bg-primary text-primary-foreground gap-1" onClick={() => handleSaveCell(editingCell.cellData)}>
                <Save className="h-4 w-4" /> บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 2: QUICK SLOT INSPECTION (All Normal shortcut) ───────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {quickSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setQuickSlotModal(null)} aria-hidden="true" />
          <div className="relative z-10 bg-card rounded-2xl shadow-2xl w-full max-w-sm border overflow-hidden animate-in fade-in">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-bold text-sm">ลงเวลาตรวจรอบเวลา {quickSlotModal.colLabel}</h3>
              <p className="text-xs text-muted-foreground">บันทึกผลการตรวจและลายมือชื่อด่วน</p>
            </div>
            <div className="p-5 space-y-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 py-5"
                onClick={() => handleMarkAllNormal(quickSlotModal.colId)}
              >
                <CheckCircle2 className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-bold text-xs">บันทึก "ปกติ" ทุกรายการในรอบนี้</div>
                  <div className="text-[10px] text-emerald-100">พร้อมลงชื่อ Millhand & Miller อัตโนมัติ</div>
                </div>
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    handleSignSlot(quickSlotModal.colId, "inspector");
                    setQuickSlotModal(null);
                  }}
                >
                  ลงชื่อ Millhand
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    handleSignSlot(quickSlotModal.colId, "verifier");
                    setQuickSlotModal(null);
                  }}
                >
                  ลงชื่อ Miller
                </Button>
              </div>
            </div>
            <div className="p-3 border-t bg-muted/10 text-right">
              <Button variant="ghost" size="sm" onClick={() => setQuickSlotModal(null)}>ปิด</Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 3: SUPERVISOR APPROVAL ────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showSupervisorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setShowSupervisorModal(false)} aria-hidden="true" />
          <div className="relative z-10 bg-card rounded-2xl shadow-2xl w-full max-w-md border overflow-hidden animate-in fade-in">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-bold text-sm">ลงนามอนุมัติ (หัวหน้าแผนก)</h3>
              <p className="text-xs text-muted-foreground">ตรวจรับรองความถูกต้องของเอกสารตรวจ QC</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">ชื่อ-นามสกุล หัวหน้าแผนก:</label>
                <Input value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">ความเห็น / ข้อสั่งการ:</label>
                <Input
                  placeholder="เช่น เรียบร้อยดี หรือ กำชับติดตามจุดซ่อมบำรุง"
                  value={supervisorComment}
                  onChange={(e) => setSupervisorComment(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 border-t bg-muted/20 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowSupervisorModal(false)}>ยกเลิก</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={handleApproveSupervisor}>
                <ShieldCheck className="h-4 w-4" /> ยืนยันการลงนามอนุมัติ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
