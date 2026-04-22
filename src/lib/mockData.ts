export type Priority = "critical" | "high" | "medium" | "low";
export type Status = "open" | "assess" | "waiting" | "doing" | "done" | "qc1" | "qc2" | "complete";
export type WorkCategory =
  | "electrical-control"
  | "mechanical"
  | "pneumatic-hydraulic"
  | "lubrication-fluid"
  | "other"
  | "electrical"
  | "facility"
  | "plumbing"
  | "it";
export type SubStatus =
  | "reported"
  | "assessing"
  | "accepted"
  | "forwarded"
  | "in-progress"
  | "waiting-parts"
  | "closed"
  | "qc-round1"
  | "qc-round2"
  | "finished";
export type ActorRole = "technician" | "requester" | "system";

export interface RequestAttachment {
  attachment_id: string;
  name: string;
  url: string;
  mime_type?: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface RequestDetails {
  asset_id: string;
  asset_type: string;
  machine_number: string;
  machine_zone: string;
  location_building: string;
  location_floor: string;
  location_line: string;
  access_required: boolean;
  access_time_window: string;
  issue_message: string;
  issue_symptom: "not-working" | "noise" | "vibration" | "error" | "other";
  issue_frequency: "first-time" | "repeated" | "always";
  machine_operability: "running" | "degraded" | "stopped";
  reporter_name: string;
  reporter_emp_id?: string;
  reporter_department: string;
  job_type: WorkCategory;
  reported_date_from_qr?: string;
  reported_time_from_qr?: string;
  additional_note?: string;
}

export interface AssessmentReport {
  visit_date: string;
  priority_level: Priority;
  work_status: Status;
  repair_date_range: { start: string; end: string };
  impact_while_waiting: "low" | "medium" | "high";
  machine_status_while_waiting: "running" | "degraded" | "stopped";
  result_text: string;
  temp_measure: string;
  communication_log: string;
  internal_note: string;
  assessment_attachments: RequestAttachment[];
}

export interface RequestNotification {
  notification_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface StatusTimelineEvent {
  event_id: string;
  status: Status;
  updated_by: string;
  updated_by_role: ActorRole;
  updated_at: string;
  note?: string;
}

export interface SparePart {
  part_id: string;
  name: string;
  stock: number;
  unit: string;
}

export interface WorkRequest {
  request_id: string;
  asset_name: string;
  asset_location: string;
  issue_summary: string;
  priority: Priority;
  status: Status;
  sub_status: SubStatus;
  reported_time: string;
  reported_by: string;
  reported_by_id?: string;
  reported_by_department?: string;
  category: WorkCategory;
  assigned_to?: string | null;
  attachments: RequestAttachment[];
  request_details?: RequestDetails;
  assessment_report?: AssessmentReport;
  status_timeline: StatusTimelineEvent[];
  requester_notifications: RequestNotification[];
}

export const MOCK_REQUESTS: WorkRequest[] = [
  {
    request_id: "REQ-20260422-002",
    asset_name: "ELC-DB-5510",
    asset_location: "ตู้ควบคุมไฟ อาคาร B ชั้น 2",
    issue_summary: "เบรกเกอร์ทริปบ่อย มีกลิ่นไหม้",
    priority: "critical",
    status: "open",
    sub_status: "reported",
    reported_time: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    reported_by: "นภดล (ฝ่ายผลิต)",
    reported_by_id: "REQ042",
    reported_by_department: "ฝ่ายผลิต",
    category: "electrical",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260422-001",
    asset_name: "MCH-PR-2041",
    asset_location: "Hydraulic Press Line 3",
    issue_summary: "กระบอกสูบไฮดรอลิกมีน้ำมันรั่วซึม",
    priority: "high",
    status: "open",
    sub_status: "reported",
    reported_time: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    reported_by: "ประยุทธ์ (Line Leader)",
    reported_by_id: "REQ021",
    reported_by_department: "Line Production",
    category: "mechanical",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260422-003",
    asset_name: "AC-OFF-019",
    asset_location: "แอร์ห้องประชุมใหญ่",
    issue_summary: "แอร์ไม่เย็น มีน้ำหยดจากเครื่อง",
    priority: "medium",
    status: "open",
    sub_status: "reported",
    reported_time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reported_by: "วราภรณ์ (HR)",
    reported_by_id: "REQ099",
    reported_by_department: "HR",
    category: "facility",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260421-014",
    asset_name: "CNV-ASSY-08",
    asset_location: "สายพานลำเลียง Assembly 8",
    issue_summary: "เสียงดังผิดปกติบริเวณมอเตอร์",
    priority: "high",
    status: "doing",
    sub_status: "in-progress",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    reported_by: "สมชาย (Foreman)",
    reported_by_id: "REQ058",
    reported_by_department: "Production",
    category: "mechanical",
    assigned_to: "TECH001",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260421-009",
    asset_name: "PLB-WC-302",
    asset_location: "ห้องน้ำชาย ชั้น 3",
    issue_summary: "ก๊อกน้ำหยดตลอดเวลา",
    priority: "low",
    status: "open",
    sub_status: "reported",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    reported_by: "แม่บ้าน",
    reported_by_id: "REQ077",
    reported_by_department: "Housekeeping",
    category: "plumbing",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260421-022",
    asset_name: "MCH-CNC-12",
    asset_location: "CNC Machine #12",
    issue_summary: "รอชิ้นส่วนใบมีดทดแทน คาดว่าได้พรุ่งนี้",
    priority: "high",
    status: "waiting",
    sub_status: "waiting-parts",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    reported_by: "อนันต์",
    reported_by_id: "REQ080",
    reported_by_department: "Warehouse",
    category: "mechanical",
    assigned_to: "TECH001",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260420-031",
    asset_name: "IT-SRV-RACK2",
    asset_location: "Server Room",
    issue_summary: "พัดลม UPS เสียงดัง",
    priority: "medium",
    status: "open",
    sub_status: "reported",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    reported_by: "ทีม IT",
    reported_by_id: "REQ090",
    reported_by_department: "IT",
    category: "it",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
];

const genEventId = () => `evt-${Math.random().toString(36).slice(2, 10)}`;

export const MOCK_REQUESTS_WITH_TIMELINE: WorkRequest[] = MOCK_REQUESTS.map((request) => {
  const timeline: StatusTimelineEvent[] = [
    {
      event_id: genEventId(),
      status: "open",
      updated_by: request.reported_by,
      updated_by_role: "requester",
      updated_at: request.reported_time,
      note: "เปิดงาน",
    },
  ];

  if (request.status !== "open") {
    timeline.push({
      event_id: genEventId(),
      status: request.status,
      updated_by: request.assigned_to ?? "TECH001",
      updated_by_role: "technician",
      updated_at: new Date(new Date(request.reported_time).getTime() + 1000 * 60 * 30).toISOString(),
      note:
        request.status === "waiting"
          ? "รออะไหล่"
          : request.status === "assess"
          ? "ประเมินงาน"
          : request.status === "qc1"
          ? "รอตรวจครั้งที่ 1"
          : request.status === "qc2"
          ? "รอตรวจครั้งที่ 2"
          : request.status === "complete"
          ? "เสร็จสิ้น"
          : "ช่างเริ่มงาน",
    });
  }

  return {
    ...request,
    status_timeline: timeline,
  };
});

export const MOCK_SPARE_PARTS: SparePart[] = [
  { part_id: "SP-HYD-004", name: "ซีลยางกันน้ำมัน 50mm", stock: 24, unit: "ชิ้น" },
  { part_id: "SP-ELC-112", name: "เบรกเกอร์ 3P 100A", stock: 6, unit: "ตัว" },
  { part_id: "SP-BRG-201", name: "ตลับลูกปืน 6204ZZ", stock: 18, unit: "ลูก" },
  { part_id: "SP-FIL-088", name: "ไส้กรองอากาศแอร์", stock: 12, unit: "ชุด" },
  { part_id: "SP-BLT-045", name: "สายพาน V-Belt A-42", stock: 9, unit: "เส้น" },
];

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "วิกฤติ",
  high: "สูง",
  medium: "ปานกลาง",
  low: "ต่ำ",
};

export const STATUS_LABEL: Record<Status, string> = {
  open: "เปิดงาน",
  assess: "ประเมินงาน",
  waiting: "รออะไหล่",
  doing: "กำลังซ่อม",
  done: "ปิดงาน",
  qc1: "รอตรวจครั้งที่ 1",
  qc2: "รอตรวจครั้งที่ 2",
  complete: "เสร็จสิ้น",
};

export const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  reported: "แจ้งงานแล้ว",
  assessing: "กำลังประเมินงาน",
  accepted: "ช่างรับงานแล้ว",
  forwarded: "ส่งต่อ",
  "in-progress": "กำลังดำเนินการ",
  "waiting-parts": "รออะไหล่",
  closed: "ปิดงาน",
  "qc-round1": "รอตรวจครั้งที่ 1",
  "qc-round2": "รอตรวจครั้งที่ 2",
  finished: "เสร็จสิ้น",
};

export const CATEGORY_LABEL: Record<WorkCategory, string> = {
  "electrical-control": "ไฟฟ้า / ระบบควบคุม",
  electrical: "ไฟฟ้า",
  mechanical: "เครื่องกล",
  "pneumatic-hydraulic": "ระบบลม / ไฮดรอลิก",
  "lubrication-fluid": "ระบบหล่อลื่น / ของไหล",
  other: "อื่น ๆ",
  facility: "อาคาร/สิ่งอำนวย",
  plumbing: "ประปา",
  it: "ไอที",
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

export const PRIORITY_RANK: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
