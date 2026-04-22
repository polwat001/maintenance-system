import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MOCK_SPARE_PARTS,
  STATUS_LABEL,
  Status,
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
  Package,
  Plus,
  Save,
  ScanBarcode,
  Trash2,
  Wrench,
  MapPin,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface PartLine {
  part_id: string;
  name: string;
  quantity: number;
}

const AssessmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const all = useRequests();
  const request = useRequest(id) ?? all[0];

  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [rootCause, setRootCause] = useState("");
  const [solution, setSolution] = useState("");
  const [parts, setParts] = useState<PartLine[]>([]);
  const [cost, setCost] = useState<number>(0);
  const [manHour, setManHour] = useState<number>(2);
  const [status, setStatus] = useState<Status>("doing");

  const addPart = (partId: string) => {
    const sp = MOCK_SPARE_PARTS.find((p) => p.part_id === partId);
    if (!sp) return;
    if (parts.some((p) => p.part_id === partId)) {
      toast.info("รายการนี้มีอยู่แล้ว");
      return;
    }
    setParts((prev) => [...prev, { part_id: sp.part_id, name: sp.name, quantity: 1 }]);
  };

  const updateQty = (id: string, qty: number) =>
    setParts((prev) => prev.map((p) => (p.part_id === id ? { ...p, quantity: qty } : p)));

  const removePart = (id: string) =>
    setParts((prev) => prev.filter((p) => p.part_id !== id));

  const handleSave = () => {
    if (!rootCause || !solution) {
      toast.error("กรุณากรอกสาเหตุและวิธีการซ่อม");
      return;
    }
    const payload = {
      request_id: request.request_id,
      technician_id: "TECH001",
      action: "update_assessment",
      assessment: {
        estimate_date: { start: startDate, end: endDate },
        root_cause: rootCause,
        solution_details: solution,
        required_parts: parts,
        estimated_cost: cost,
        man_hour: manHour,
      },
      current_status: status,
    };
    console.log("[FixFlow] Save payload:", payload);
    requestStore.setStatus(request.request_id, status, "TECH001");
    toast.success("บันทึกข้อมูลการประเมินเรียบร้อย");
    setTimeout(() => navigate("/board"), 600);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="container py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10"
            onClick={() => navigate("/board")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70 font-mono">
              {request.request_id}
            </div>
            <h1 className="font-bold truncate">บันทึกการประเมินและซ่อมแซม</h1>
          </div>
          <PriorityBadge priority={request.priority} />
        </div>
      </header>

      <main className="container pt-6 grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Left: Job info (mobile = accordion) */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          {/* Mobile collapsible info */}
          <div className="lg:hidden">
            <Accordion type="single" collapsible defaultValue="info">
              <AccordionItem value="info" className="border rounded-lg bg-card px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span className="font-semibold">ข้อมูลการแจ้งซ่อม</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <JobInfo request={request} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Desktop info card */}
          <Card className="hidden lg:block p-5 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">ข้อมูลการแจ้งซ่อม</h2>
            </div>
            <JobInfo request={request} />
          </Card>
        </aside>

        {/* Right: Form */}
        <section className="space-y-4">
          {/* Mobile sections in accordion, Desktop flat */}
          <div className="lg:hidden">
            <Accordion type="multiple" defaultValue={["assess", "parts", "status"]} className="space-y-3">
              <SectionAccordion value="assess" icon={<ClipboardCheck className="h-4 w-4" />} title="ประเมินอาการและวิธีซ่อม">
                <AssessFields {...{ startDate, setStartDate, endDate, setEndDate, rootCause, setRootCause, solution, setSolution }} />
              </SectionAccordion>
              <SectionAccordion value="parts" icon={<Package className="h-4 w-4" />} title="เบิกอะไหล่">
                <PartsFields parts={parts} addPart={addPart} updateQty={updateQty} removePart={removePart} />
              </SectionAccordion>
              <SectionAccordion value="status" icon={<Save className="h-4 w-4" />} title="ต้นทุน & สถานะ">
                <CostStatusFields {...{ cost, setCost, manHour, setManHour, status, setStatus }} />
              </SectionAccordion>
            </Accordion>
          </div>

          <div className="hidden lg:block space-y-4">
            <SectionCard icon={<ClipboardCheck className="h-5 w-5" />} title="ประเมินอาการและวิธีซ่อม">
              <AssessFields {...{ startDate, setStartDate, endDate, setEndDate, rootCause, setRootCause, solution, setSolution }} />
            </SectionCard>
            <SectionCard icon={<Package className="h-5 w-5" />} title="เบิกอะไหล่">
              <PartsFields parts={parts} addPart={addPart} updateQty={updateQty} removePart={removePart} />
            </SectionCard>
            <SectionCard icon={<Save className="h-5 w-5" />} title="ต้นทุน & สถานะ">
              <CostStatusFields {...{ cost, setCost, manHour, setManHour, status, setStatus }} />
            </SectionCard>
          </div>
        </section>
      </main>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border shadow-elevated z-30">
        <div className="container py-3 flex items-center gap-3">
          <div className="flex-1 hidden sm:block text-sm text-muted-foreground">
            ข้อมูลทั้งหมดจะถูกบันทึกพร้อมเปลี่ยนสถานะเป็น{" "}
            <strong className="text-foreground">{STATUS_LABEL[status]}</strong>
          </div>
          <Button variant="outline" onClick={() => navigate("/board")} className="flex-1 sm:flex-initial">
            ยกเลิก
          </Button>
          <Button variant="industrial" size="lg" onClick={handleSave} className="flex-1 sm:flex-initial">
            <Save className="h-4 w-4 mr-1" /> บันทึกข้อมูล
          </Button>
        </div>
      </div>
    </div>
  );
};

function JobInfo({ request }: { request: import("@/lib/mockData").WorkRequest }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">เครื่องจักร / พื้นที่</div>
        <div className="font-semibold">{request.asset_name}</div>
      </div>
      <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="ตำแหน่ง" value={request.asset_location} />
      <InfoRow icon={<User className="h-3.5 w-3.5" />} label="ผู้แจ้ง" value={request.reported_by} />
      <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="เวลาที่แจ้ง" value={timeAgo(request.reported_time)} />
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">อาการที่แจ้ง</div>
        <p className="bg-muted/60 rounded-md p-3 leading-relaxed">{request.issue_summary}</p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <StatusBadge status={request.status} />
      </div>
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

function AssessFields(props: {
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  rootCause: string;
  setRootCause: (v: string) => void;
  solution: string;
  setSolution: (v: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" /> เริ่มงาน
          </Label>
          <Input type="date" value={props.startDate} onChange={(e) => props.setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" /> คาดเสร็จ
          </Label>
          <Input type="date" value={props.endDate} onChange={(e) => props.setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">สาเหตุของปัญหา (Root Cause) <span className="text-destructive">*</span></Label>
        <Textarea
          rows={3}
          value={props.rootCause}
          onChange={(e) => props.setRootCause(e.target.value)}
          placeholder="เช่น ซีลยางเสื่อมสภาพตามอายุการใช้งาน..."
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">วิธีการซ่อม / แก้ไข <span className="text-destructive">*</span></Label>
        <Textarea
          rows={4}
          value={props.solution}
          onChange={(e) => props.setSolution(e.target.value)}
          placeholder="ลำดับขั้นตอนการซ่อม การทดสอบ และมาตรการป้องกันการเกิดซ้ำ"
        />
      </div>
    </>
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
            <li
              key={p.part_id}
              className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/30"
            >
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

      <Button
        variant="outline"
        size="sm"
        type="button"
        className="w-full"
        onClick={() => toast.info("เลือกอะไหล่จาก dropdown ด้านบน")}
      >
        <Plus className="h-4 w-4 mr-1" /> เพิ่มอะไหล่
      </Button>
    </>
  );
}

function CostStatusFields(props: {
  cost: number;
  setCost: (v: number) => void;
  manHour: number;
  setManHour: (v: number) => void;
  status: Status;
  setStatus: (v: Status) => void;
}) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">ต้นทุนประมาณการ (บาท)</Label>
        <Input
          type="number"
          min={0}
          value={props.cost}
          onChange={(e) => props.setCost(+e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Man-Hour (ชั่วโมง)</Label>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={props.manHour}
          onChange={(e) => props.setManHour(+e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">อัปเดตสถานะ</Label>
        <Select value={props.status} onValueChange={(v) => props.setStatus(v as Status)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="doing">กำลังซ่อม</SelectItem>
            <SelectItem value="waiting">รออะไหล่</SelectItem>
            <SelectItem value="done">เสร็จสิ้น</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default AssessmentForm;
