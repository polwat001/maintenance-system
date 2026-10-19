import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MOCK_SPARE_PARTS,
  type AssessmentReport,
  type RequestAttachment,
  type RequestDetails,
  STATUS_LABEL,
  type Status,
  type StatusTimelineEvent,
  timeAgo,
} from "@/lib/mockData";
import { requestStore, useRequest, useRequests } from "@/lib/requestStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  Clock,
  Camera,
  FileText,
  History,
  Image,
  Paperclip,
  Package,
  Plus,
  Save,
  ScanBarcode,
  ShieldAlert,
  Trash2,
  User,
  MapPin,
  Wrench,
  Factory,
  Gauge,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface PartLine {
  part_id: string;
  name: string;
  quantity: number;
}

type PriorityLevel = AssessmentReport["priority_level"];
type WorkStatus = AssessmentReport["work_status"];
type ImpactLevel = AssessmentReport["impact_while_waiting"];
type MachineState = AssessmentReport["machine_status_while_waiting"];

const TECHNICIAN_NAME = "สมศักดิ์ ช่างไฟ";

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

const ISSUE_SYMPTOM_LABEL: Record<RequestDetails["issue_symptom"], string> = {
  "not-working": "ไม่ทำงาน",
  noise: "เสียงดัง",
  vibration: "สั่น",
  error: "แจ้ง Error",
  other: "อื่น ๆ",
};

const ISSUE_FREQUENCY_LABEL: Record<RequestDetails["issue_frequency"], string> = {
  "first-time": "เกิดครั้งแรก",
  repeated: "เกิดซ้ำ",
  always: "เกิดตลอด",
};

const MACHINE_OPERABILITY_LABEL: Record<RequestDetails["machine_operability"], string> = {
  operable: "ยังใช้งานได้",
  inoperable: "ใช้งานไม่ได้",
};

const formatWorkCategory = (category: RequestDetails["job_type"]) => {
  const labels: Record<RequestDetails["job_type"], string> = {
    "electrical-control": "ไฟฟ้า / ระบบควบคุม",
    mechanical: "เครื่องกล",
    "pneumatic-hydraulic": "ระบบลม / ไฮดรอลิก",
    "lubrication-fluid": "ระบบหล่อลื่น / ของไหล",
    other: "อื่น ๆ",
    electrical: "ไฟฟ้า",
    facility: "อาคาร / สาธารณูปโภค",
    plumbing: "ประปา",
    it: "IT / ระบบสารสนเทศ",
  };

  return labels[category];
};

const today = new Date().toISOString().slice(0, 10);
const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const AssessmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const allRequests = useRequests();
  const request = useRequest(id) ?? allRequests[0];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visitDate, setVisitDate] = useState(
    request.request_details?.access_required
      ? request.request_details.reported_date_from_qr
      : today,
  );
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>("warm");
  const [workStatus, setWorkStatus] = useState<WorkStatus>("repairable");
  const [repairStartDate, setRepairStartDate] = useState(today);
  const [repairEndDate, setRepairEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [impact, setImpact] = useState<ImpactLevel>("no-impact");
  const [machineState, setMachineState] = useState<MachineState>("temporary-operable");
  const [resultText, setResultText] = useState("");
  const [temporaryMeasure, setTemporaryMeasure] = useState("");
  const [communicationLog, setCommunicationLog] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [parts, setParts] = useState<PartLine[]>([]);
  const [cost, setCost] = useState<number>(0);
  const [manHour, setManHour] = useState<number>(2);
  const [status, setStatus] = useState<Status>("doing");
  const [assessmentPhotos, setAssessmentPhotos] = useState<RequestAttachment[]>([]);

  const timeline = useMemo(
    () => [...request.status_timeline].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [request.status_timeline],
  );

  const details: RequestDetails | undefined = request.request_details;

  const handlePhotoPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextFiles = Array.from(files).slice(0, 10 - assessmentPhotos.length);
    const mapped = await Promise.all(
      nextFiles.map(async (file) => ({
        attachment_id: `assess-${Math.random().toString(36).slice(2, 10)}`,
        name: file.name,
        url: await toDataUrl(file),
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
        uploaded_by: TECHNICIAN_NAME,
      })),
    );
    setAssessmentPhotos((prev) => [...prev, ...mapped].slice(0, 10));
  };

  const removeAssessmentPhoto = (attachmentId: string) =>
    setAssessmentPhotos((prev) => prev.filter((item) => item.attachment_id !== attachmentId));

  const addPart = (partId: string) => {
    const sp = MOCK_SPARE_PARTS.find((p) => p.part_id === partId);
    if (!sp) return;
    if (parts.some((p) => p.part_id === partId)) {
      toast.info("รายการนี้มีอยู่แล้ว");
      return;
    }
    setParts((prev) => [...prev, { part_id: sp.part_id, name: sp.name, quantity: 1 }]);
  };

  const updateQty = (partId: string, qty: number) =>
    setParts((prev) => prev.map((p) => (p.part_id === partId ? { ...p, quantity: qty } : p)));

  const removePart = (partId: string) =>
    setParts((prev) => prev.filter((p) => p.part_id !== partId));

  const applyStatusAction = (nextStatus: Status, actionLabel: string) => {
    requestStore.setStatus(request.request_id, nextStatus, "TECH001", {
      actorName: TECHNICIAN_NAME,
      note: `อัปเดตสถานะผ่านปุ่ม ${actionLabel}`,
      notifyRequester: true,
    });
    setStatus(nextStatus);
    toast.success(`อัปเดตสถานะเป็น ${STATUS_LABEL[nextStatus]}`);
  };

  const handleSave = () => {
    if (!request) return;
    if (!resultText.trim()) {
      toast.error("กรุณากรอกผลการประเมินหน้างาน");
      return;
    }

    const report: AssessmentReport = {
      visit_date: visitDate,
      priority_level: priorityLevel,
      work_status: workStatus,
      repair_date_range: { start: repairStartDate, end: repairEndDate },
      impact_while_waiting: impact,
      machine_status_while_waiting: machineState,
      result_text: resultText.trim(),
      temp_measure: temporaryMeasure.trim(),
      communication_log: communicationLog.trim(),
      internal_note: internalNote.trim(),
      assessment_attachments: assessmentPhotos,
    };

    requestStore.setAssessmentReport(request.request_id, report);
    requestStore.setStatus(request.request_id, workStatus === "waiting-parts" ? "waiting" : "doing", "TECH001", {
      actorName: TECHNICIAN_NAME,
      note: "บันทึกผลการประเมินหน้างาน",
      notifyRequester: true,
    });
    requestStore.update(request.request_id, {
      // keep current save payload available on the request snapshot
      assessment_report: report,
    });
    toast.success("บันทึกข้อมูลการประเมินเรียบร้อย");
    setTimeout(() => navigate("/board"), 600);
  };

  if (!request) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Card className="p-6 text-center space-y-3">
          <div className="font-semibold">ไม่พบรายการแจ้งซ่อม</div>
          <Button onClick={() => navigate("/board")}>กลับไปที่กระดานงาน</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <header className="sticky top-0 z-20 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="container py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => navigate("/board")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70 font-mono">
              {request.request_id}
            </div>
            <h1 className="font-bold truncate">ประเมินหน้างานและบันทึกผล</h1>
          </div>
          <PriorityBadge priority={request.priority} />
        </div>
      </header>

      <main className="container pt-6 grid lg:grid-cols-[380px_1fr] gap-6">
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <Card className="p-5 bg-gradient-card shadow-card space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">ข้อมูลการแจ้งซ่อม</h2>
            </div>
            <JobInfo request={request} />

            <div className="h-px bg-border" />
            <Accordion
              type="multiple"
              defaultValue={details ? ["qr", "attachments", "note"] : ["attachments"]}
              className="space-y-2"
            >
              {details && (
                <AccordionItem value="qr" className="rounded-lg border bg-card/60 px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-primary">
                      <ClipboardCheck className="h-4 w-4" />
                      <span className="font-semibold text-sm">ข้อมูลจาก QR / หน้างาน</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <DetailGroup title="ข้อมูลเครื่อง" icon={<Factory className="h-3.5 w-3.5" />}>
                      <KeyValue label="รหัสทรัพย์สิน" value={details.asset_id} />
                      <KeyValue label="ประเภทเครื่อง" value={details.asset_type} />
                      <KeyValue label="เลขเครื่อง" value={details.machine_number} />
                      <KeyValue label="โซนเครื่อง" value={details.machine_zone} />
                      <KeyValue label="ที่ตั้งเครื่อง" value={`${details.location_building} / ${details.location_floor} / ${details.location_line}`} />
                      <KeyValue label="ประเภทงานซ่อม" value={formatWorkCategory(details.job_type)} />
                      <KeyValue label="ข้อจำกัดการเข้าพื้นที่" value={details.access_required ? "ต้องขออนุญาต" : "ไม่จำกัด"} />
                      <KeyValue label="เวลาเข้าได้" value={details.access_time_window || "-"} />
                      <KeyValue label="วันที่แจ้งซ่อม" value={details.reported_date_from_qr || "-"} />
                      <KeyValue label="เวลาแจ้งซ่อม" value={details.reported_time_from_qr || "-"} />
                    </DetailGroup>

                    <DetailGroup title="ข้อมูลผู้แจ้ง" icon={<User className="h-3.5 w-3.5" />}>
                      <KeyValue label="ผู้แจ้ง" value={details.reporter_name || request.reported_by} />
                      <KeyValue label="รหัสผู้แจ้ง" value={details.reporter_emp_id || request.reported_by_id || "-"} />
                      <KeyValue label="หน่วยงาน" value={details.reporter_department || "-"} />
                    </DetailGroup>

                    <DetailGroup title="รายละเอียดอาการ" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                      <KeyValue label="ข้อความแจ้งซ่อม" value={details.issue_message || request.issue_summary} />
                      <KeyValue label="อาการที่พบ" value={ISSUE_SYMPTOM_LABEL[details.issue_symptom]} />
                      <KeyValue label="ความถี่" value={ISSUE_FREQUENCY_LABEL[details.issue_frequency]} />
                      <KeyValue label="สภาพเครื่อง" value={MACHINE_OPERABILITY_LABEL[details.machine_operability]} />
                    </DetailGroup>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="attachments" className="rounded-lg border bg-card/60 px-3">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-primary">
                    <Image className="h-4 w-4" />
                    <span className="font-semibold text-sm">รูป/เอกสารที่แนบจากผู้แจ้ง</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  {request.attachments.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {request.attachments.map((attachment) => (
                        <a key={attachment.attachment_id} href={attachment.url} target="_blank" rel="noreferrer" className="block rounded-md overflow-hidden border bg-muted/20">
                          {attachment.mime_type?.startsWith("image/") || attachment.url.startsWith("data:image") ? (
                            <img src={attachment.url} alt={attachment.name} className="h-24 w-full object-cover" />
                          ) : (
                            <div className="h-24 w-full grid place-items-center px-2 text-center text-xs text-muted-foreground">
                              <FileText className="h-4 w-4 mx-auto mb-1" />
                              {attachment.name}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                      ยังไม่มีไฟล์แนบจากผู้แจ้ง
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {details?.additional_note && (
                <AccordionItem value="note" className="rounded-lg border bg-card/60 px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-4 w-4" />
                      <span className="font-semibold text-sm">หมายเหตุจากผู้แจ้ง</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed">
                      {details.additional_note}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </Card>
        </aside>

        <section className="space-y-4">
          <div className="lg:hidden">
            <Accordion type="multiple" defaultValue={["visit", "assess", "parts", "status", "timeline"]} className="space-y-3">
              <SectionAccordion value="visit" icon={<Calendar className="h-4 w-4" />} title="วันเข้าประเมิน / ระดับความสำคัญ">
                <AssessmentVisitFields
                  visitDate={visitDate}
                  setVisitDate={setVisitDate}
                  locked={!!details?.access_required}
                  accessDateSource={details?.reported_date_from_qr}
                  priorityLevel={priorityLevel}
                  setPriorityLevel={setPriorityLevel}
                />
              </SectionAccordion>
              <SectionAccordion value="assess" icon={<ClipboardCheck className="h-4 w-4" />} title="ผลการประเมินหน้างาน">
                <OnSiteAssessmentFields
                  workStatus={workStatus}
                  setWorkStatus={setWorkStatus}
                  repairStartDate={repairStartDate}
                  setRepairStartDate={setRepairStartDate}
                  repairEndDate={repairEndDate}
                  setRepairEndDate={setRepairEndDate}
                  impact={impact}
                  setImpact={setImpact}
                  machineState={machineState}
                  setMachineState={setMachineState}
                  resultText={resultText}
                  setResultText={setResultText}
                  temporaryMeasure={temporaryMeasure}
                  setTemporaryMeasure={setTemporaryMeasure}
                />
              </SectionAccordion>
              <SectionAccordion value="parts" icon={<Package className="h-4 w-4" />} title="เบิกอะไหล่">
                <PartsFields parts={parts} addPart={addPart} updateQty={updateQty} removePart={removePart} />
              </SectionAccordion>
              <SectionAccordion value="status" icon={<Save className="h-4 w-4" />} title="ต้นทุน / การสื่อสาร / หมายเหตุ">
                <CommunicationFields
                  cost={cost}
                  setCost={setCost}
                  manHour={manHour}
                  setManHour={setManHour}
                  communicationLog={communicationLog}
                  setCommunicationLog={setCommunicationLog}
                  internalNote={internalNote}
                  setInternalNote={setInternalNote}
                />
              </SectionAccordion>
              <SectionAccordion value="timeline" icon={<History className="h-4 w-4" />} title="Timeline สถานะงาน">
                <TimelineList timeline={timeline} />
              </SectionAccordion>
              <SectionAccordion value="photos" icon={<Image className="h-4 w-4" />} title="รูปประกอบการประเมิน">
                <AssessmentPhotoPicker
                  photos={assessmentPhotos}
                  handlePhotoPick={handlePhotoPick}
                  removeAssessmentPhoto={removeAssessmentPhoto}
                  fileInputRef={fileInputRef}
                />
              </SectionAccordion>
            </Accordion>
          </div>

          <div className="hidden lg:block space-y-4">
            <SectionCard icon={<Calendar className="h-5 w-5" />} title="วันเข้าประเมิน / ระดับความสำคัญ">
              <AssessmentVisitFields
                visitDate={visitDate}
                setVisitDate={setVisitDate}
                locked={!!details?.access_required}
                accessDateSource={details?.reported_date_from_qr}
                priorityLevel={priorityLevel}
                setPriorityLevel={setPriorityLevel}
              />
            </SectionCard>
            <SectionCard icon={<ClipboardCheck className="h-5 w-5" />} title="ผลการประเมินหน้างาน">
              <OnSiteAssessmentFields
                workStatus={workStatus}
                setWorkStatus={setWorkStatus}
                repairStartDate={repairStartDate}
                setRepairStartDate={setRepairStartDate}
                repairEndDate={repairEndDate}
                setRepairEndDate={setRepairEndDate}
                impact={impact}
                setImpact={setImpact}
                machineState={machineState}
                setMachineState={setMachineState}
                resultText={resultText}
                setResultText={setResultText}
                temporaryMeasure={temporaryMeasure}
                setTemporaryMeasure={setTemporaryMeasure}
              />
            </SectionCard>
            <SectionCard icon={<Package className="h-5 w-5" />} title="เบิกอะไหล่">
              <PartsFields parts={parts} addPart={addPart} updateQty={updateQty} removePart={removePart} />
            </SectionCard>
            <SectionCard icon={<Save className="h-5 w-5" />} title="ต้นทุน / การสื่อสาร / หมายเหตุ">
              <CommunicationFields
                cost={cost}
                setCost={setCost}
                manHour={manHour}
                setManHour={setManHour}
                communicationLog={communicationLog}
                setCommunicationLog={setCommunicationLog}
                internalNote={internalNote}
                setInternalNote={setInternalNote}
              />
            </SectionCard>
            <SectionCard icon={<History className="h-5 w-5" />} title="Timeline สถานะงาน">
              <TimelineList timeline={timeline} />
            </SectionCard>
            <SectionCard icon={<Image className="h-5 w-5" />} title="รูปประกอบการประเมิน">
              <AssessmentPhotoPicker
                photos={assessmentPhotos}
                handlePhotoPick={handlePhotoPick}
                removeAssessmentPhoto={removeAssessmentPhoto}
                fileInputRef={fileInputRef}
              />
            </SectionCard>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border shadow-elevated z-30">
        <div className="container py-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 hidden sm:block text-sm text-muted-foreground">
            บันทึกพร้อมสถานะงาน <strong className="text-foreground">{STATUS_LABEL[status]}</strong>
          </div>
          <Button variant="outline" className="hidden md:inline-flex" onClick={() => applyStatusAction("assess", "ประเมินงาน") }>
            ประเมินงาน
          </Button>
          <Button variant="outline" className="hidden md:inline-flex" onClick={() => applyStatusAction("waiting", "รออะไหล่")}>
            รออะไหล่
          </Button>
          <Button variant="outline" className="hidden md:inline-flex" onClick={() => applyStatusAction("done", "ปิดงาน")}>
            ปิดงาน
          </Button>
          <Button variant="outline" onClick={() => navigate("/board")} className="flex-1 sm:flex-initial">
            ยกเลิก
          </Button>
          <Button variant="industrial" size="lg" onClick={handleSave} className="flex-1 sm:flex-initial">
            <Save className="h-4 w-4 mr-1" /> บันทึกผลประเมิน
          </Button>
        </div>
      </div>
    </div>
  );
};

function JobInfo({ request }: { request: import("@/lib/mockData").WorkRequest }) {
  const details = request.request_details;
  const machineDisplay = details
    ? `${details.asset_id} · ${details.asset_type}${details.machine_number ? ` (${details.machine_number})` : ""}`
    : request.asset_name;
  const locationDisplay = details
    ? `${details.location_building} / ${details.location_floor} / ${details.location_line}`
    : request.asset_location;
  const reporterName = details?.reporter_name || request.reported_by;
  const reporterId = details?.reporter_emp_id || request.reported_by_id || "-";
  const reporterDepartment = details?.reporter_department || request.reported_by_department || "-";
  const issueMessage = details?.issue_message || request.issue_summary;

  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">เครื่องจักร / พื้นที่</div>
        <div className="font-semibold">{machineDisplay}</div>
      </div>
      <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="ตำแหน่ง" value={locationDisplay} />
      <InfoRow icon={<User className="h-3.5 w-3.5" />} label="ผู้แจ้ง" value={reporterName} />
      <InfoRow icon={<User className="h-3.5 w-3.5" />} label="รหัสผู้แจ้ง" value={reporterId} />
      <InfoRow icon={<User className="h-3.5 w-3.5" />} label="หน่วยงาน" value={reporterDepartment} />
      <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="เวลาที่แจ้ง" value={timeAgo(request.reported_time)} />
      {details && <InfoRow icon={<Wrench className="h-3.5 w-3.5" />} label="ประเภทงานซ่อม" value={formatWorkCategory(details.job_type)} />}
      {details?.access_required && <InfoRow icon={<ShieldAlert className="h-3.5 w-3.5" />} label="ข้อจำกัด" value="ต้องขออนุญาตก่อนเข้า" />}
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">อาการที่แจ้ง</div>
        <p className="bg-muted/60 rounded-md p-3 leading-relaxed">{issueMessage}</p>
      </div>
      {details && (
        <div className="grid grid-cols-3 gap-2">
          <MiniBadge label="อาการ" value={ISSUE_SYMPTOM_LABEL[details.issue_symptom]} />
          <MiniBadge label="ความถี่" value={ISSUE_FREQUENCY_LABEL[details.issue_frequency]} />
          <MiniBadge label="สภาพเครื่อง" value={MACHINE_OPERABILITY_LABEL[details.machine_operability]} />
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <StatusBadge status={request.status} />
      </div>
    </div>
  );
}

function MiniBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-medium leading-snug">{value}</div>
    </div>
  );
}

function TimelineList({ timeline }: { timeline: StatusTimelineEvent[] }) {
  if (timeline.length === 0) {
    return <div className="text-sm text-muted-foreground">ยังไม่มีประวัติการเปลี่ยนสถานะ</div>;
  }

  return (
    <ol className="space-y-3">
      {timeline.map((event) => (
        <li key={event.event_id} className="rounded-md border border-border p-3 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={event.status} />
            <span className="text-[11px] text-muted-foreground">{formatDateTime(event.updated_at)}</span>
          </div>
          <div className="mt-1 text-sm">
            โดย <span className="font-medium">{event.updated_by}</span>
          </div>
          {event.note && <div className="text-xs text-muted-foreground mt-0.5">{event.note}</div>}
        </li>
      ))}
    </ol>
  );
}

function AssessmentVisitFields({
  visitDate,
  setVisitDate,
  locked,
  accessDateSource,
  priorityLevel,
  setPriorityLevel,
}: {
  visitDate: string;
  setVisitDate: (v: string) => void;
  locked: boolean;
  accessDateSource?: string;
  priorityLevel: PriorityLevel;
  setPriorityLevel: (v: PriorityLevel) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" /> วันที่เข้าประเมินหน้างาน</Label>
          <Input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            disabled={locked}
          />
          {locked && <p className="text-[11px] text-muted-foreground">ล็อกวันที่จากคำขอเดิม: {accessDateSource || visitDate}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">ระดับความสำคัญของงาน</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "critical", label: "Critical" },
              { value: "hot", label: "Hot" },
              { value: "warm", label: "Warm" },
              { value: "cold", label: "Cold" },
            ].map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={priorityLevel === item.value ? "default" : "outline"}
                onClick={() => setPriorityLevel(item.value as PriorityLevel)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OnSiteAssessmentFields({
  workStatus,
  setWorkStatus,
  repairStartDate,
  setRepairStartDate,
  repairEndDate,
  setRepairEndDate,
  impact,
  setImpact,
  machineState,
  setMachineState,
  resultText,
  setResultText,
  temporaryMeasure,
  setTemporaryMeasure,
}: {
  workStatus: WorkStatus;
  setWorkStatus: (v: WorkStatus) => void;
  repairStartDate: string;
  setRepairStartDate: (v: string) => void;
  repairEndDate: string;
  setRepairEndDate: (v: string) => void;
  impact: ImpactLevel;
  setImpact: (v: ImpactLevel) => void;
  machineState: MachineState;
  setMachineState: (v: MachineState) => void;
  resultText: string;
  setResultText: (v: string) => void;
  temporaryMeasure: string;
  setTemporaryMeasure: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">สถานะงาน</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={workStatus === "waiting-parts" ? "default" : "outline"} onClick={() => setWorkStatus("waiting-parts")}>
              รออะไหล่
            </Button>
            <Button type="button" variant={workStatus === "repairable" ? "default" : "outline"} onClick={() => setWorkStatus("repairable")}>
              ดำเนินการซ่อมได้
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">ผลกระทบระหว่างรอ</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button type="button" variant={impact === "no-impact" ? "default" : "outline"} onClick={() => setImpact("no-impact")}>ไม่กระทบการผลิต</Button>
            <Button type="button" variant={impact === "partial-impact" ? "default" : "outline"} onClick={() => setImpact("partial-impact")}>กระทบบางส่วน</Button>
            <Button type="button" variant={impact === "full-impact" ? "default" : "outline"} onClick={() => setImpact("full-impact")}>กระทบทั้งหมด</Button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">สถานะเครื่องขณะรอ</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button type="button" variant={machineState === "temporary-operable" ? "default" : "outline"} onClick={() => setMachineState("temporary-operable")}>ใช้งานได้ (ชั่วคราว)</Button>
            <Button type="button" variant={machineState === "stopped" ? "default" : "outline"} onClick={() => setMachineState("stopped")}>หยุดใช้งาน</Button>
            <Button type="button" variant={machineState === "limited-condition" ? "default" : "outline"} onClick={() => setMachineState("limited-condition")}>ใช้งานแบบจำกัดเงื่อนไข</Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">จำนวนวันซ่อม</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">เริ่ม</Label>
              <Input type="date" value={repairStartDate} onChange={(e) => setRepairStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">สิ้นสุด</Label>
              <Input type="date" value={repairEndDate} onChange={(e) => setRepairEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">ผลการประเมินหน้างาน</Label>
        <Textarea rows={4} value={resultText} onChange={(e) => setResultText(e.target.value)} placeholder="สรุปผลการตรวจสอบ สาเหตุหลัก และข้อเสนอแนะ" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">มาตรการชั่วคราว</Label>
        <Textarea rows={3} value={temporaryMeasure} onChange={(e) => setTemporaryMeasure(e.target.value)} placeholder="มาตรการแก้ไขเฉพาะหน้า หรือแนวทางลดผลกระทบ" />
      </div>
    </div>
  );
}

function CommunicationFields({
  cost,
  setCost,
  manHour,
  setManHour,
  communicationLog,
  setCommunicationLog,
  internalNote,
  setInternalNote,
}: {
  cost: number;
  setCost: (v: number) => void;
  manHour: number;
  setManHour: (v: number) => void;
  communicationLog: string;
  setCommunicationLog: (v: string) => void;
  internalNote: string;
  setInternalNote: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">ต้นทุนประมาณการ (บาท)</Label>
          <Input type="number" min={0} value={cost} onChange={(e) => setCost(+e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Man-Hour (ชั่วโมง)</Label>
          <Input type="number" min={0} step={0.5} value={manHour} onChange={(e) => setManHour(+e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><MessageSquare className="h-3 w-3" /> บันทึกการสื่อสาร</Label>
        <Textarea rows={3} value={communicationLog} onChange={(e) => setCommunicationLog(e.target.value)} placeholder="ติดต่อใคร ประสานงานกับหน่วยงานใด วันที่/เวลาประชุม/โทรแจ้ง" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> หมายเหตุภายใน</Label>
        <Textarea rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="แสดงเฉพาะทีมซ่อมบำรุง" />
      </div>
    </div>
  );
}

function AssessmentPhotoPicker({
  photos,
  handlePhotoPick,
  removeAssessmentPhoto,
  fileInputRef,
}: {
  photos: RequestAttachment[];
  handlePhotoPick: (files: FileList | null) => Promise<void>;
  removeAssessmentPhoto: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 p-3 rounded-md border-2 border-dashed border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Camera className="h-4 w-4" />
          รูปประกอบการประเมิน (ไม่เกิน 10 รูป)
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void handlePhotoPick(e.target.files)} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Image className="h-4 w-4 mr-1" />
          เลือกรูป
        </Button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <div key={photo.attachment_id} className="relative rounded-md overflow-hidden border group">
              <img src={photo.url} alt={photo.name} className="h-28 w-full object-cover" />
              <button type="button" onClick={() => removeAssessmentPhoto(photo.attachment_id)} className="absolute top-1 right-1 rounded bg-black/70 text-white text-[10px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                ลบ
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
          <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-30" />
          ยังไม่มีรูปประกอบการประเมิน
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium leading-snug break-words">{value}</div>
    </div>
  );
}

function DetailGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5 rounded-lg border border-primary/20 bg-muted/20 p-3">
      <div className="flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-primary">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 bg-gradient-card shadow-card">
      <header className="flex items-center gap-2 mb-4 text-primary">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </header>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function SectionAccordion({
  value,
  icon,
  title,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="border rounded-lg bg-card px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <span className="font-semibold text-foreground">{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">{children}</AccordionContent>
    </AccordionItem>
  );
}

function PartsFields({
  parts,
  addPart,
  updateQty,
  removePart,
}: {
  parts: PartLine[];
  addPart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  removePart: (id: string) => void;
}) {
  return (
    <>
      <div className="flex gap-2">
        <Select onValueChange={addPart}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="ค้นหาและเพิ่มอะไหล่..." />
          </SelectTrigger>
          <SelectContent>
            {MOCK_SPARE_PARTS.map((p) => (
              <SelectItem key={p.part_id} value={p.part_id}>
                <div className="flex items-center justify-between gap-3 w-full">
                  <span>{p.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    คงเหลือ {p.stock} {p.unit}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="amber" type="button" onClick={() => toast.info("เปิดกล้องเพื่อสแกนบาร์โค้ด (เดโม)")}>
          <ScanBarcode className="h-4 w-4 mr-1" />
          สแกน
        </Button>
      </div>

      {parts.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
          ยังไม่มีรายการอะไหล่
        </div>
      ) : (
        <ul className="space-y-2">
          {parts.map((p) => (
            <li key={p.part_id} className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{p.part_id}</div>
              </div>
              <Input
                type="number"
                min={1}
                value={p.quantity}
                onChange={(e) => updateQty(p.part_id, Math.max(1, +e.target.value))}
                className="w-20 h-9"
              />
              <Button variant="ghost" size="icon" onClick={() => removePart(p.part_id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" size="sm" type="button" className="w-full" onClick={() => toast.info("เลือกอะไหล่จาก dropdown ด้านบน")}>
        <Plus className="h-4 w-4 mr-1" /> เพิ่มอะไหล่
      </Button>
    </>
  );
}

export default AssessmentForm;
