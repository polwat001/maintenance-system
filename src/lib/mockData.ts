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
    assigned_to: "TECH002",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
    category: "other"
  },
  {
    request_id: "REQ-20260422-003",
    asset_name: "AC-OFF-019",
    asset_location: "แอร์ห้องประชุมใหญ่",
    issue_summary: "แอร์ไม่เย็น มีน้ำหยดจากเครื่อง",
    priority: "medium",
    status: "doing",
    sub_status: "in-progress",
    reported_time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reported_by: "วราภรณ์ (HR)",
    reported_by_id: "REQ099",
    reported_by_department: "HR",
    category: "facility",
    assigned_to: "TECH004",
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
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    reported_by: "แม่บ้าน",
    reported_by_id: "REQ077",
    reported_by_department: "Housekeeping",
    category: "plumbing",
    assigned_to: "TECH003",
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
    assigned_to: "TECH005",
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
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    reported_by: "ทีม IT",
    reported_by_id: "REQ090",
    reported_by_department: "IT",
    category: "it",
    assigned_to: "TECH006",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260420-019",
    asset_name: "PMP-WTR-01",
    asset_location: "ห้องปั๊มน้ำ ชั้นใต้ดิน",
    issue_summary: "เปลี่ยนซีลปั๊มน้ำหล่อเย็นเสร็จสิ้น",
    priority: "medium",
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    reported_by: "สุรศักดิ์ (Facility)",
    reported_by_id: "REQ045",
    reported_by_department: "Facility",
    category: "mechanical",
    assigned_to: "TECH002",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260419-008",
    asset_name: "HVAC-CHL-02",
    asset_location: "ดาดฟ้า อาคาร A",
    issue_summary: "ล้างฟิลเตอร์และตรวจเช็กระบบทำความเย็น",
    priority: "low",
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reported_by: "สมพร (HR)",
    reported_by_id: "REQ033",
    reported_by_department: "HR",
    category: "facility",
    assigned_to: "TECH004",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260419-012",
    asset_name: "STR-PLT-03",
    asset_location: "คลังสินค้า โซน C",
    issue_summary: "ซ่อมจุดเชื่อมโครงสร้างแท่นวางสินค้า",
    priority: "medium",
    status: "doing",
    sub_status: "in-progress",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    reported_by: "วิชัย (Warehouse)",
    reported_by_id: "REQ088",
    reported_by_department: "Warehouse",
    category: "facility",
    assigned_to: "TECH006",
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

// ─── Spare Parts Extended ─────────────────────────────────────────────────────

export type SparePartCategory =
  | "hydraulic"
  | "electrical"
  | "bearing"
  | "belt"
  | "filter"
  | "pneumatic"
  | "lubricant"
  | "fastener"
  | "sensor"
  | "other";

export const SPARE_PART_CATEGORY_LABEL: Record<SparePartCategory, string> = {
  hydraulic: "ไฮดรอลิก",
  electrical: "ไฟฟ้า",
  bearing: "ตลับลูกปืน",
  belt: "สายพาน",
  filter: "ไส้กรอง",
  pneumatic: "ระบบลม",
  lubricant: "น้ำมัน/สารหล่อลื่น",
  fastener: "น็อต/สกรู",
  sensor: "เซ็นเซอร์",
  other: "อื่น ๆ",
};

export interface SparePartExtended {
  part_id: string;
  name: string;
  category: SparePartCategory;
  stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  location: string;
  unit_price: number;
  supplier: string;
  last_updated: string;
  compatible_assets: string[];
}

export interface SparePartTransaction {
  tx_id: string;
  part_id: string;
  part_name: string;
  type: "issue" | "receive" | "adjust";
  quantity: number;
  related_request_id?: string;
  performed_by: string;
  note: string;
  timestamp: string;
}

const _now = Date.now();
const _d = (hoursBack: number) => new Date(_now - hoursBack * 3_600_000).toISOString();

export const MOCK_SPARE_PARTS_EXTENDED: SparePartExtended[] = [
  {
    part_id: "SP-HYD-004",
    name: "ซีลยางกันน้ำมัน 50mm",
    category: "hydraulic",
    stock: 24,
    min_stock: 10,
    max_stock: 50,
    unit: "ชิ้น",
    location: "ชั้น A-03",
    unit_price: 85,
    supplier: "Thai Seal Co., Ltd.",
    last_updated: _d(2),
    compatible_assets: ["MCH-PR-2041", "MCH-HYD-005"],
  },
  {
    part_id: "SP-ELC-112",
    name: "เบรกเกอร์ 3P 100A",
    category: "electrical",
    stock: 3,
    min_stock: 4,
    max_stock: 20,
    unit: "ตัว",
    location: "ชั้น B-01",
    unit_price: 1250,
    supplier: "Schneider Electric TH",
    last_updated: _d(5),
    compatible_assets: ["ELC-DB-5510", "ELC-DB-5520"],
  },
  {
    part_id: "SP-BRG-201",
    name: "ตลับลูกปืน 6204ZZ",
    category: "bearing",
    stock: 18,
    min_stock: 8,
    max_stock: 40,
    unit: "ลูก",
    location: "ชั้น A-05",
    unit_price: 320,
    supplier: "NSK Thailand",
    last_updated: _d(1),
    compatible_assets: ["CNV-ASSY-08", "MCH-MTR-110"],
  },
  {
    part_id: "SP-FIL-088",
    name: "ไส้กรองอากาศแอร์",
    category: "filter",
    stock: 12,
    min_stock: 6,
    max_stock: 30,
    unit: "ชุด",
    location: "ชั้น C-02",
    unit_price: 450,
    supplier: "Daikin Service TH",
    last_updated: _d(10),
    compatible_assets: ["AC-OFF-019", "AC-PROD-022"],
  },
  {
    part_id: "SP-BLT-045",
    name: "สายพาน V-Belt A-42",
    category: "belt",
    stock: 2,
    min_stock: 5,
    max_stock: 20,
    unit: "เส้น",
    location: "ชั้น A-04",
    unit_price: 780,
    supplier: "Gates Corporation TH",
    last_updated: _d(8),
    compatible_assets: ["CNV-ASSY-08", "MCH-PUMP-033"],
  },
  {
    part_id: "SP-PNM-017",
    name: "วาล์วลม 5/2 (สปริงกลับ)",
    category: "pneumatic",
    stock: 8,
    min_stock: 4,
    max_stock: 20,
    unit: "ตัว",
    location: "ชั้น B-03",
    unit_price: 1100,
    supplier: "SMC Thailand Co., Ltd.",
    last_updated: _d(3),
    compatible_assets: ["MCH-PR-2041", "ASSY-PNM-09"],
  },
  {
    part_id: "SP-LUB-055",
    name: "น้ำมันไฮดรอลิก ISO 46 (20L)",
    category: "lubricant",
    stock: 6,
    min_stock: 3,
    max_stock: 15,
    unit: "ถัง",
    location: "ชั้น D-01",
    unit_price: 2200,
    supplier: "PTT Lubricants",
    last_updated: _d(24),
    compatible_assets: ["MCH-PR-2041", "MCH-HYD-005", "MCH-CNC-12"],
  },
  {
    part_id: "SP-ELC-220",
    name: "คอนแทคเตอร์ 3P 40A",
    category: "electrical",
    stock: 0,
    min_stock: 3,
    max_stock: 12,
    unit: "ตัว",
    location: "ชั้น B-01",
    unit_price: 890,
    supplier: "Schneider Electric TH",
    last_updated: _d(48),
    compatible_assets: ["ELC-DB-5510", "CNV-ASSY-08"],
  },
  {
    part_id: "SP-SNS-099",
    name: "เซ็นเซอร์ Proximity Inductive 12mm",
    category: "sensor",
    stock: 5,
    min_stock: 3,
    max_stock: 15,
    unit: "ตัว",
    location: "ชั้น B-04",
    unit_price: 1650,
    supplier: "Omron Thailand",
    last_updated: _d(6),
    compatible_assets: ["MCH-CNC-12", "CNV-ASSY-08"],
  },
  {
    part_id: "SP-BRG-315",
    name: "ตลับลูกปืน 6306-2RS",
    category: "bearing",
    stock: 10,
    min_stock: 5,
    max_stock: 25,
    unit: "ลูก",
    location: "ชั้น A-05",
    unit_price: 580,
    supplier: "SKF Thailand",
    last_updated: _d(12),
    compatible_assets: ["MCH-PUMP-033", "MCH-MTR-110"],
  },
  {
    part_id: "SP-FST-011",
    name: "โบลต์ M12×50 สแตนเลส (แพ็ค 50)",
    category: "fastener",
    stock: 15,
    min_stock: 5,
    max_stock: 30,
    unit: "แพ็ค",
    location: "ชั้น C-05",
    unit_price: 280,
    supplier: "Thai Fastener Supply",
    last_updated: _d(72),
    compatible_assets: [],
  },
  {
    part_id: "SP-HYD-022",
    name: "ท่อไฮดรอลิก HP 3/8\" (1m)",
    category: "hydraulic",
    stock: 1,
    min_stock: 4,
    max_stock: 20,
    unit: "เมตร",
    location: "ชั้น A-03",
    unit_price: 950,
    supplier: "Parker Hannifin TH",
    last_updated: _d(4),
    compatible_assets: ["MCH-PR-2041", "MCH-HYD-005"],
  },
];

export const MOCK_SPARE_PART_TRANSACTIONS: SparePartTransaction[] = [
  {
    tx_id: "TX-20260922-001",
    part_id: "SP-HYD-004",
    part_name: "ซีลยางกันน้ำมัน 50mm",
    type: "issue",
    quantity: 4,
    related_request_id: "REQ-20260422-001",
    performed_by: "สมศักดิ์ ช่างไฟ",
    note: "เปลี่ยนซีลกระบอกสูบ Hydraulic Press Line 3",
    timestamp: _d(1.5),
  },
  {
    tx_id: "TX-20260922-002",
    part_id: "SP-ELC-112",
    part_name: "เบรกเกอร์ 3P 100A",
    type: "issue",
    quantity: 1,
    related_request_id: "REQ-20260422-002",
    performed_by: "สมศักดิ์ ช่างไฟ",
    note: "เปลี่ยนเบรกเกอร์ตู้ควบคุม ELC-DB-5510",
    timestamp: _d(0.5),
  },
  {
    tx_id: "TX-20260921-003",
    part_id: "SP-BRG-201",
    part_name: "ตลับลูกปืน 6204ZZ",
    type: "receive",
    quantity: 10,
    performed_by: "วิษณุ ช่างกล",
    note: "รับเข้าจาก PO-2026-0489",
    timestamp: _d(28),
  },
  {
    tx_id: "TX-20260921-004",
    part_id: "SP-BLT-045",
    part_name: "สายพาน V-Belt A-42",
    type: "issue",
    quantity: 3,
    related_request_id: "REQ-20260421-014",
    performed_by: "วิษณุ ช่างกล",
    note: "เปลี่ยนสายพานมอเตอร์ CNV-ASSY-08",
    timestamp: _d(5),
  },
  {
    tx_id: "TX-20260920-005",
    part_id: "SP-LUB-055",
    part_name: "น้ำมันไฮดรอลิก ISO 46 (20L)",
    type: "receive",
    quantity: 4,
    performed_by: "วิษณุ ช่างกล",
    note: "รับเข้าสต็อก",
    timestamp: _d(50),
  },
  {
    tx_id: "TX-20260920-006",
    part_id: "SP-ELC-220",
    part_name: "คอนแทคเตอร์ 3P 40A",
    type: "issue",
    quantity: 2,
    related_request_id: "REQ-20260421-014",
    performed_by: "สมศักดิ์ ช่างไฟ",
    note: "เปลี่ยนคอนแทคเตอร์มอเตอร์สายพานลำเลียง",
    timestamp: _d(52),
  },
  {
    tx_id: "TX-20260919-007",
    part_id: "SP-HYD-022",
    part_name: "ท่อไฮดรอลิก HP 3/8\" (1m)",
    type: "issue",
    quantity: 3,
    related_request_id: "REQ-20260422-001",
    performed_by: "วิษณุ ช่างกล",
    note: "เปลี่ยนท่อไฮดรอลิกที่รั่ว",
    timestamp: _d(75),
  },
  {
    tx_id: "TX-20260919-008",
    part_id: "SP-SNS-099",
    part_name: "เซ็นเซอร์ Proximity Inductive 12mm",
    type: "receive",
    quantity: 5,
    performed_by: "สมศักดิ์ ช่างไฟ",
    note: "รับเข้าจาก PO-2026-0495",
    timestamp: _d(80),
  },
];

// ─── Checksheet System ─────────────────────────────────────────────────────────

export type ChecksheetColumnType =
  | "checkbox"
  | "pass_fail"
  | "number"
  | "text"
  | "dropdown"
  | "rating";

export interface ChecksheetColumn {
  col_id: string;
  label: string;
  type: ChecksheetColumnType;
  options?: string[]; // for dropdown
  required: boolean;
  width?: "sm" | "md" | "lg";
}

export interface ChecksheetItem {
  item_id: string;
  order: number;
  topic: string;
  description?: string;
  group?: string;
}

export interface ChecksheetTemplate {
  template_id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "per_shift";
  machine_type?: string;
  items: ChecksheetItem[];
  columns: ChecksheetColumn[];
  created_by: string;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface ChecksheetCellValue {
  item_id: string;
  col_id: string;
  value: string | boolean | number;
}

export interface ChecksheetRecord {
  record_id: string;
  template_id: string;
  template_name: string;
  completed_by: string;
  department: string;
  shift?: "A" | "B" | "C";
  machine_id?: string;
  values: ChecksheetCellValue[];
  note?: string;
  submitted_at: string;
  status: "complete" | "partial" | "flagged";
}

export const MOCK_CHECKSHEET_TEMPLATES: ChecksheetTemplate[] = [
  {
    template_id: "CS-TPL-001",
    name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
    description: "เช็คชีทตรวจสอบสภาพเครื่องจักรก่อนเริ่มกะผลิต",
    frequency: "daily",
    machine_type: "เครื่องจักรทั่วไป",
    created_by: "สมศักดิ์ ช่างไฟ",
    created_at: new Date(_now - 30 * 24 * 3600_000).toISOString(),
    updated_at: _d(48),
    active: true,
    columns: [
      { col_id: "c1", label: "ผล", type: "pass_fail", required: true, width: "sm" },
      { col_id: "c2", label: "ค่าที่วัดได้", type: "text", required: false, width: "md" },
      { col_id: "c3", label: "หมายเหตุ", type: "text", required: false, width: "lg" },
    ],
    items: [
      { item_id: "i1", order: 1, topic: "ระดับน้ำมันไฮดรอลิก", group: "ระบบไฮดรอลิก" },
      { item_id: "i2", order: 2, topic: "ตรวจรอยรั่วท่อไฮดรอลิก", group: "ระบบไฮดรอลิก" },
      { item_id: "i3", order: 3, topic: "แรงดันลม (ปกติ 6-7 bar)", group: "ระบบลม" },
      { item_id: "i4", order: 4, topic: "วาล์วลม — ไม่มีรอยรั่ว", group: "ระบบลม" },
      { item_id: "i5", order: 5, topic: "อุณหภูมิมอเตอร์ (<60°C)", group: "ระบบไฟฟ้า" },
      { item_id: "i6", order: 6, topic: "สัญญาณไฟ Alarm — ปกติ", group: "ระบบไฟฟ้า" },
      { item_id: "i7", order: 7, topic: "สายพาน — ไม่หย่อน/ไม่แตก", group: "กลไก" },
      { item_id: "i8", order: 8, topic: "เสียงผิดปกติ — ไม่พบ", group: "กลไก" },
      { item_id: "i9", order: 9, topic: "ทำความสะอาดรอบเครื่อง", group: "สุขลักษณะ" },
      { item_id: "i10", order: 10, topic: "ตรวจอุปกรณ์ Safety Guard", group: "ความปลอดภัย" },
    ],
  },
  {
    template_id: "CS-TPL-002",
    name: "PM รายสัปดาห์ — Hydraulic Press",
    description: "บำรุงรักษาเชิงป้องกันรายสัปดาห์สำหรับ Hydraulic Press",
    frequency: "weekly",
    machine_type: "Hydraulic Press",
    created_by: "วิษณุ ช่างกล",
    created_at: new Date(_now - 60 * 24 * 3600_000).toISOString(),
    updated_at: _d(72),
    active: true,
    columns: [
      { col_id: "c1", label: "สถานะ", type: "pass_fail", required: true, width: "sm" },
      { col_id: "c2", label: "ค่าที่วัด", type: "number", required: false, width: "sm" },
      { col_id: "c3", label: "หน่วย", type: "dropdown", options: ["bar", "°C", "mm", "A", "-"], required: false, width: "sm" },
      { col_id: "c4", label: "หมายเหตุ/Action", type: "text", required: false, width: "lg" },
    ],
    items: [
      { item_id: "i1", order: 1, topic: "ตรวจสอบแรงดันระบบ (ปกติ 180-200 bar)", group: "ระบบไฮดรอลิก" },
      { item_id: "i2", order: 2, topic: "เติมน้ำมันไฮดรอลิก (ถ้าต่ำกว่า Min)", group: "ระบบไฮดรอลิก" },
      { item_id: "i3", order: 3, topic: "ตรวจสอบซีลกระบอกสูบ", group: "ระบบไฮดรอลิก" },
      { item_id: "i4", order: 4, topic: "ทำความสะอาด Oil Filter", group: "ระบบไฮดรอลิก" },
      { item_id: "i5", order: 5, topic: "ตรวจ Proximity Sensor ตำแหน่ง", group: "ระบบไฟฟ้า" },
      { item_id: "i6", order: 6, topic: "วัดกระแสมอเตอร์ปั๊มไฮดรอลิก", group: "ระบบไฟฟ้า" },
      { item_id: "i7", order: 7, topic: "อัดจาระบีแกนลูกสูบ", group: "การหล่อลื่น" },
      { item_id: "i8", order: 8, topic: "ทดสอบการทำงานครบ 5 cycle", group: "ทดสอบการทำงาน" },
    ],
  },
  {
    template_id: "CS-TPL-003",
    name: "ตรวจสอบความปลอดภัยประจำเดือน",
    description: "เช็คชีทความปลอดภัยสำหรับผู้จัดการหรือหัวหน้างาน",
    frequency: "monthly",
    created_by: "ผู้จัดการฝ่ายซ่อมบำรุง",
    created_at: new Date(_now - 90 * 24 * 3600_000).toISOString(),
    updated_at: _d(168),
    active: true,
    columns: [
      { col_id: "c1", label: "ผ่าน/ไม่ผ่าน", type: "pass_fail", required: true, width: "sm" },
      { col_id: "c2", label: "คะแนน (1-5)", type: "rating", required: false, width: "sm" },
      { col_id: "c3", label: "ข้อสังเกต", type: "text", required: false, width: "lg" },
      { col_id: "c4", label: "ผู้รับผิดชอบ", type: "text", required: false, width: "md" },
    ],
    items: [
      { item_id: "i1", order: 1, topic: "ป้ายความปลอดภัยครบถ้วน", group: "อุปกรณ์ความปลอดภัย" },
      { item_id: "i2", order: 2, topic: "ถังดับเพลิงอยู่ในตำแหน่งและอยู่ในอายุการใช้งาน", group: "อุปกรณ์ความปลอดภัย" },
      { item_id: "i3", order: 3, topic: "Safety Guard ครบทุกเครื่อง", group: "อุปกรณ์ความปลอดภัย" },
      { item_id: "i4", order: 4, topic: "Emergency Stop ทำงานได้ปกติ", group: "ระบบ Emergency" },
      { item_id: "i5", order: 5, topic: "Lock-out / Tag-out อุปกรณ์ครบ", group: "ระบบ Emergency" },
      { item_id: "i6", order: 6, topic: "ทางหนีไฟไม่มีสิ่งกีดขวาง", group: "อาคาร/สถานที่" },
      { item_id: "i7", order: 7, topic: "แสงสว่างในพื้นที่เพียงพอ", group: "อาคาร/สถานที่" },
      { item_id: "i8", order: 8, topic: "พื้นไม่ลื่น / ไม่มีน้ำมันหก", group: "อาคาร/สถานที่" },
      { item_id: "i9", order: 9, topic: "พนักงานสวม PPE ครบ", group: "บุคลากร" },
      { item_id: "i10", order: 10, topic: "บันทึกการฝึกอบรมความปลอดภัยล่าสุด", group: "บุคลากร" },
    ],
  },
];

export const MOCK_CHECKSHEET_RECORDS: ChecksheetRecord[] = [
  {
    record_id: "REC-20260922-001",
    template_id: "CS-TPL-001",
    template_name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
    completed_by: "สมศักดิ์ ช่างไฟ",
    department: "ฝ่ายซ่อมบำรุง",
    shift: "A",
    submitted_at: _d(4),
    status: "flagged",
    values: [
      { item_id: "i1", col_id: "c1", value: true },
      { item_id: "i2", col_id: "c1", value: false },
      { item_id: "i3", col_id: "c1", value: true },
      { item_id: "i3", col_id: "c2", value: "6.5" },
      { item_id: "i4", col_id: "c1", value: true },
      { item_id: "i5", col_id: "c1", value: false },
      { item_id: "i5", col_id: "c2", value: "72" },
      { item_id: "i5", col_id: "c3", value: "อุณหภูมิสูงกว่าปกติ ต้องติดตาม" },
      { item_id: "i6", col_id: "c1", value: true },
      { item_id: "i7", col_id: "c1", value: true },
      { item_id: "i8", col_id: "c1", value: true },
      { item_id: "i9", col_id: "c1", value: true },
      { item_id: "i10", col_id: "c1", value: true },
    ],
    note: "พบอุณหภูมิมอเตอร์สูง และรอยรั่วไฮดรอลิกเล็กน้อย แจ้งซ่อมแล้ว",
  },
  {
    record_id: "REC-20260921-002",
    template_id: "CS-TPL-001",
    template_name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
    completed_by: "วิษณุ ช่างกล",
    department: "ฝ่ายซ่อมบำรุง",
    shift: "A",
    submitted_at: _d(28),
    status: "complete",
    values: [],
    note: "",
  },
  {
    record_id: "REC-20260920-003",
    template_id: "CS-TPL-002",
    template_name: "PM รายสัปดาห์ — Hydraulic Press",
    completed_by: "วิษณุ ช่างกล",
    department: "ฝ่ายซ่อมบำรุง",
    machine_id: "MCH-PR-2041",
    submitted_at: _d(48),
    status: "complete",
    values: [],
  },
  {
    record_id: "REC-20260915-004",
    template_id: "CS-TPL-003",
    template_name: "ตรวจสอบความปลอดภัยประจำเดือน",
    completed_by: "ผู้จัดการฝ่ายซ่อมบำรุง",
    department: "Management",
    submitted_at: _d(168),
    status: "complete",
    values: [],
  },
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

export interface Technician {
  technician_id: string;
  name: string;
  department: string;
}

export const TECHNICIAN_MAP: Record<string, Technician> = {
  TECH001: {
    technician_id: "TECH001",
    name: "สมศักดิ์ ช่างไฟ",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH002: {
    technician_id: "TECH002",
    name: "วิษณุ ช่างกล",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH003: {
    technician_id: "TECH003",
    name: "สุรพล ช่างประปา",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH004: {
    technician_id: "TECH004",
    name: "อานนท์ ช่างแอร์ (HVAC)",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH005: {
    technician_id: "TECH005",
    name: "นครินทร์ ช่างอิเล็กทรอนิกส์ & PLC",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH006: {
    technician_id: "TECH006",
    name: "เกรียงไกร ช่างเชื่อม & โครงสร้าง",
    department: "งานโครงสร้างและโลหะ",
  },
  TECH007: { technician_id: "TECH007", name: "ไพศาล ช่างทั่วไป", department: "งานบริการอาคาร" },
  TECH008: { technician_id: "TECH008", name: "ธนวัฒน์ ช่างเครื่องจักร", department: "งานซ่อมบำรุงเครื่องจักร" },
  TECH009: { technician_id: "TECH009", name: "ชัยวัฒน์ ช่างก่อสร้าง", department: "งานโยธาและก่อสร้าง" },
  TECH010: { technician_id: "TECH010", name: "วินัย ช่างสี", department: "งานสีและเคลือบผิว" },
  TECH011: { technician_id: "TECH011", name: "กิตติศักดิ์ ช่างยนต์", department: "งานยานพาหนะและโฟล์กลิฟต์" },
  TECH012: { technician_id: "TECH012", name: "ประเสริฐ ช่างไฮดรอลิก", department: "งานระบบไฮดรอลิก" },
  TECH013: { technician_id: "TECH013", name: "ธีรพงษ์ ช่างนิวแมติกส์", department: "งานระบบนิวแมติกส์" },
  TECH014: { technician_id: "TECH014", name: "ชาญชัย ช่างแอร์", department: "งานระบบปรับอากาศ" },
  TECH015: { technician_id: "TECH015", name: "อนุรักษ์ ช่างเครื่องเสียง", department: "งานระบบสื่อสาร" },
  TECH016: { technician_id: "TECH016", name: "วีระ ช่างไฟฟ้ากำลัง", department: "งานระบบไฟฟ้า" },
  TECH017: { technician_id: "TECH017", name: "ภานุวัฒน์ ช่างกลโรงงาน", department: "งานระบบเครื่องกล" },
  TECH018: { technician_id: "TECH018", name: "อุดม ช่างบำรุงรักษา", department: "งานบำรุงรักษาเชิงป้องกัน" },
  TECH019: { technician_id: "TECH019", name: "ศักดิ์ดา ช่างโลหะ", department: "งานโครงสร้างและโลหะ" },
  TECH020: { technician_id: "TECH020", name: "นเรศ ช่างเครน & ลิฟต์", department: "งานระบบลำเลียง" },
  TECH021: { technician_id: "TECH021", name: "สมคิด ช่างเน็ตเวิร์ก", department: "งานระบบเทคโนโลยี" },
  TECH022: { technician_id: "TECH022", name: "ทรงพล ช่าง PLC", department: "งานระบบอัตโนมัติ" },
  TECH023: { technician_id: "TECH023", name: "ยุทธนา ช่างระบบบำบัด", department: "งานระบบสุขาภิบาล" },
  TECH024: { technician_id: "TECH024", name: "พิพัฒน์ ช่างความปลอดภัย", department: "งานความปลอดภัย" },
};

export * from "./teamMockData.ts";

export function addTechnician(tech: Technician) {
  TECHNICIAN_MAP[tech.technician_id] = tech;
}

export function getTechnicianName(technicianId: string | null | undefined): string {
  if (!technicianId) return "-";
  return TECHNICIAN_MAP[technicianId]?.name || technicianId;
}

export function getTechnicianDepartment(technicianId: string | null | undefined): string {
  if (!technicianId) return "-";
  return TECHNICIAN_MAP[technicianId]?.department || "-";
}

// ─── Spare Part Request (ช่างขออะไหล่) ───────────────────────────────────────

export type SparePartRequestStatus = "pending" | "approved" | "rejected" | "ordered" | "received";

export interface SparePartRequest {
  sr_id: string;
  request_id: string;        // เชื่อมกับ WorkRequest
  asset_name: string;
  part_id: string;
  part_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  requested_by: string;      // technician_id
  requested_by_name: string;
  requested_at: string;
  status: SparePartRequestStatus;
  urgency: "normal" | "urgent" | "critical";
  reason: string;
  approved_by?: string;
  approved_at?: string;
  po_number?: string;
  reject_reason?: string;
}

export const MOCK_SPARE_PART_REQUESTS: SparePartRequest[] = [
  {
    sr_id: "SR-2026-001",
    request_id: "REQ-20260421-022",
    asset_name: "MCH-CNC-12",
    part_id: "SP-ELC-220",
    part_name: "คอนแทคเตอร์ 3P 40A",
    quantity: 2,
    unit: "ตัว",
    unit_price: 890,
    requested_by: "TECH001",
    requested_by_name: "สมศักดิ์ ช่างไฟ",
    requested_at: _d(10),
    status: "pending",
    urgency: "urgent",
    reason: "คอนแทคเตอร์ไหม้ ต้องเปลี่ยนเพื่อให้เครื่องกลับมาทำงานได้",
  },
  {
    sr_id: "SR-2026-002",
    request_id: "REQ-20260422-001",
    asset_name: "MCH-PR-2041",
    part_id: "SP-HYD-022",
    part_name: "ท่อไฮดรอลิก HP 3/8\" (1m)",
    quantity: 3,
    unit: "เมตร",
    unit_price: 950,
    requested_by: "TECH002",
    requested_by_name: "วิษณุ ช่างกล",
    requested_at: _d(8),
    status: "approved",
    urgency: "urgent",
    reason: "ท่อรั่วซึม กระทบการผลิต Line 3",
    approved_by: "ADMIN001",
    approved_at: _d(6),
    po_number: "PO-2026-0512",
  },
  {
    sr_id: "SR-2026-003",
    request_id: "REQ-20260421-014",
    asset_name: "CNV-ASSY-08",
    part_id: "SP-BLT-045",
    part_name: "สายพาน V-Belt A-42",
    quantity: 5,
    unit: "เส้น",
    unit_price: 780,
    requested_by: "TECH002",
    requested_by_name: "วิษณุ ช่างกล",
    requested_at: _d(30),
    status: "received",
    urgency: "normal",
    reason: "สายพานเก่าเริ่มหย่อน ควรเปลี่ยนก่อนขาด",
    approved_by: "ADMIN001",
    approved_at: _d(28),
    po_number: "PO-2026-0489",
  },
  {
    sr_id: "SR-2026-004",
    request_id: "REQ-20260422-002",
    asset_name: "ELC-DB-5510",
    part_id: "SP-ELC-112",
    part_name: "เบรกเกอร์ 3P 100A",
    quantity: 2,
    unit: "ตัว",
    unit_price: 1250,
    requested_by: "TECH001",
    requested_by_name: "สมศักดิ์ ช่างไฟ",
    requested_at: _d(2),
    status: "pending",
    urgency: "critical",
    reason: "เบรกเกอร์ทริปบ่อย มีกลิ่นไหม้ ต้องเปลี่ยนทันที",
  },
  {
    sr_id: "SR-2026-005",
    request_id: "REQ-20260421-014",
    asset_name: "CNV-ASSY-08",
    part_id: "SP-SNS-099",
    part_name: "เซ็นเซอร์ Proximity Inductive 12mm",
    quantity: 1,
    unit: "ตัว",
    unit_price: 1650,
    requested_by: "TECH001",
    requested_by_name: "สมศักดิ์ ช่างไฟ",
    requested_at: _d(5),
    status: "ordered",
    urgency: "normal",
    reason: "เซ็นเซอร์ตรวจจับตำแหน่งเสีย ส่งผลให้สายพานหยุดทำงาน",
    approved_by: "ADMIN001",
    approved_at: _d(4),
    po_number: "PO-2026-0510",
  },
];

// ─── Purchase Order ────────────────────────────────────────────────────────────

export type POStatus = "pending" | "approved" | "rejected" | "ordered";

export interface PurchaseOrder {
  po_id: string;
  sr_ids: string[];
  items: { part_name: string; quantity: number; unit: string; unit_price: number }[];
  total_amount: number;
  requested_by: string;
  requested_by_name: string;
  requested_at: string;
  status: POStatus;
  approved_by?: string;
  approved_at?: string;
  reject_reason?: string;
  supplier?: string;
  note?: string;
}

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    po_id: "PO-2026-0515",
    sr_ids: ["SR-2026-001", "SR-2026-004"],
    items: [
      { part_name: "คอนแทคเตอร์ 3P 40A", quantity: 2, unit: "ตัว", unit_price: 890 },
      { part_name: "เบรกเกอร์ 3P 100A", quantity: 2, unit: "ตัว", unit_price: 1250 },
    ],
    total_amount: 4280,
    requested_by: "ADMIN001",
    requested_by_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    requested_at: _d(1),
    status: "pending",
    supplier: "Schneider Electric TH",
    note: "งานวิกฤติ ต้องการเร่งด่วน",
  },
  {
    po_id: "PO-2026-0512",
    sr_ids: ["SR-2026-002"],
    items: [
      { part_name: "ท่อไฮดรอลิก HP 3/8\" (1m)", quantity: 3, unit: "เมตร", unit_price: 950 },
    ],
    total_amount: 2850,
    requested_by: "ADMIN001",
    requested_by_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    requested_at: _d(6),
    status: "approved",
    approved_by: "EXEC001",
    approved_at: _d(5),
    supplier: "Parker Hannifin TH",
  },
  {
    po_id: "PO-2026-0489",
    sr_ids: ["SR-2026-003"],
    items: [
      { part_name: "สายพาน V-Belt A-42", quantity: 5, unit: "เส้น", unit_price: 780 },
    ],
    total_amount: 3900,
    requested_by: "ADMIN001",
    requested_by_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    requested_at: _d(29),
    status: "ordered",
    approved_by: "EXEC001",
    approved_at: _d(28),
    supplier: "Gates Corporation TH",
  },
];

// ─── QC Schedule ──────────────────────────────────────────────────────────────

export type QCScheduleStatus = "scheduled" | "in-progress" | "done" | "missed";

export interface QCSchedule {
  schedule_id: string;
  title: string;
  frequency: "daily" | "monthly";
  machine_name: string;
  machine_id: string;
  zone: string;
  assigned_to: string;
  assigned_to_name: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  checked_in_at?: string;
  checked_out_at?: string;
  status: QCScheduleStatus;
  template_id?: string;
  template_name?: string;
  matrix_template_id?: string;
  matrix_progress?: { logged_slots: number; total_slots: number };
  record_id?: string;
  findings?: string;
  work_request_id?: string;
}

export const QC_OFFICER_MAP: Record<string, { id: string; name: string }> = {
  QC001: { id: "QC001", name: "ณัฐพงศ์ QC" },
  QC002: { id: "QC002", name: "สุภาพร QC" },
};

const _today = new Date();
const _dateStr = (daysOffset: number) => {
  const d = new Date(_today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
};

export const MOCK_QC_SCHEDULES: QCSchedule[] = [
  {
    schedule_id: "QCS-2026-001",
    title: "ตรวจเครื่องคัดแยกและระบบสั่น 24 ชม.",
    frequency: "daily",
    machine_name: "SORT-VIB-01 (เครื่องคัดแยกและถาดสั่น)",
    machine_id: "SORT-VIB-01",
    zone: "Line คัดแยกข้าวสาร",
    assigned_to: "QC001",
    assigned_to_name: "ณัฐพงศ์ QC",
    scheduled_date: _dateStr(0),
    scheduled_time_start: "08:00",
    scheduled_time_end: "08:00",
    checked_in_at: new Date(_today.getFullYear(), _today.getMonth(), _today.getDate(), 8, 0).toISOString(),
    status: "in-progress",
    template_id: "CS-TPL-001",
    matrix_template_id: "TPL-HOURLY-002",
    template_name: "รายการตรวจสอบเครื่องคัดแยกและระบบสั่น 24 ชั่วโมง",
    matrix_progress: { logged_slots: 7, total_slots: 24 },
    record_id: "REC-20260922-001",
    findings: "หลอดไฟช่องคัดแยกดับ 1 หลอด ดำเนินการแจ้งซ่อมแล้ว",
    work_request_id: "REQ-20260422-001",
  },
  {
    schedule_id: "QCS-2026-002",
    title: "ROLLERMILL PARAMETERS — Line C",
    frequency: "daily",
    machine_name: "ROLLERMILL Line C (B1-C10)",
    machine_id: "ROLLER-LINE-C",
    zone: "อาคารโม่แป้ง Line C",
    assigned_to: "QC002",
    assigned_to_name: "สุภาพร QC",
    scheduled_date: _dateStr(0),
    scheduled_time_start: "08:00",
    scheduled_time_end: "16:00",
    checked_in_at: new Date(_today.getFullYear(), _today.getMonth(), _today.getDate(), 8, 15).toISOString(),
    status: "in-progress",
    matrix_template_id: "TPL-ROLLERMILL-001",
    template_name: "ROLLERMILL PARAMETERS (Line C)",
    matrix_progress: { logged_slots: 1, total_slots: 3 },
  },
  {
    schedule_id: "QCS-2026-003",
    title: "PM รายสัปดาห์ — Hydraulic System",
    frequency: "daily",
    machine_name: "MCH-HYD-005",
    machine_id: "MCH-HYD-005",
    zone: "Line B",
    assigned_to: "QC001",
    assigned_to_name: "ณัฐพงศ์ QC",
    scheduled_date: _dateStr(1),
    scheduled_time_start: "13:00",
    scheduled_time_end: "15:00",
    status: "scheduled",
    template_id: "CS-TPL-002",
    template_name: "PM รายสัปดาห์ — Hydraulic Press",
  },
  {
    schedule_id: "QCS-2026-004",
    title: "ตรวจ QC ตู้ไฟฟ้า",
    frequency: "daily",
    machine_name: "ELC-DB-5510",
    machine_id: "ELC-DB-5510",
    zone: "อาคาร B ชั้น 2",
    assigned_to: "QC002",
    assigned_to_name: "สุภาพร QC",
    scheduled_date: _dateStr(-1),
    scheduled_time_start: "14:00",
    scheduled_time_end: "15:00",
    status: "missed",
    template_id: "CS-TPL-001",
    template_name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
  },
  {
    schedule_id: "QCS-2026-005",
    title: "ตรวจสอบความปลอดภัยประจำเดือน",
    frequency: "monthly",
    machine_name: "ทุกพื้นที่",
    machine_id: "ALL",
    zone: "ทั้งโรงงาน",
    assigned_to: "QC001",
    assigned_to_name: "ณัฐพงศ์ QC",
    scheduled_date: _dateStr(5),
    scheduled_time_start: "09:00",
    scheduled_time_end: "12:00",
    status: "scheduled",
    template_id: "CS-TPL-003",
    template_name: "ตรวจสอบความปลอดภัยประจำเดือน",
  },
  {
    schedule_id: "QCS-2026-006",
    title: "ตรวจ QC เครื่อง CNC",
    frequency: "daily",
    machine_name: "MCH-CNC-12",
    machine_id: "MCH-CNC-12",
    zone: "CNC Area",
    assigned_to: "QC002",
    assigned_to_name: "สุภาพร QC",
    scheduled_date: _dateStr(-2),
    scheduled_time_start: "08:00",
    scheduled_time_end: "09:00",
    checked_in_at: new Date(_today.getFullYear(), _today.getMonth(), _today.getDate() - 2, 8, 10).toISOString(),
    checked_out_at: new Date(_today.getFullYear(), _today.getMonth(), _today.getDate() - 2, 9, 0).toISOString(),
    status: "done",
    template_id: "CS-TPL-001",
    template_name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
    record_id: "REC-20260921-002",
  },
];

// ─── User Approval Request ────────────────────────────────────────────────────

export type UserRole = "technician" | "qc" | "admin" | "executive" | "requester" | "superadmin";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface UserApprovalRequest {
  approval_id: string;
  name: string;
  emp_id: string;
  department: string;
  position: string;
  role_requested: UserRole;
  requested_at: string;
  status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  reject_reason?: string;
  note?: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  technician: "ช่างซ่อมบำรุง",
  qc: "เจ้าหน้าที่ QC",
  admin: "ผู้ดูแลระบบ",
  executive: "ผู้บริหาร",
  requester: "ผู้แจ้งซ่อม",
  superadmin: "Superadmin",
};

export const MOCK_USER_APPROVAL_REQUESTS: UserApprovalRequest[] = [
  {
    approval_id: "APV-2026-001",
    name: "ชาญณรงค์ มั่นคง",
    emp_id: "EMP-1045",
    department: "ฝ่ายซ่อมบำรุง",
    position: "ช่างไฟฟ้า",
    role_requested: "technician",
    requested_at: _d(2),
    status: "pending",
    note: "โอนย้ายมาจากสาขาอยุธยา",
  },
  {
    approval_id: "APV-2026-002",
    name: "พิมพ์ชนก เจริญสุข",
    emp_id: "EMP-1052",
    department: "ฝ่ายควบคุมคุณภาพ",
    position: "วิศวกร QC",
    role_requested: "qc",
    requested_at: _d(5),
    status: "approved",
    approved_by: "ผู้บริหาร",
    approved_at: _d(4),
  },
  {
    approval_id: "APV-2026-003",
    name: "ธนกฤต วิทยากร",
    emp_id: "EMP-0892",
    department: "ฝ่ายซ่อมบำรุง",
    position: "หัวหน้าช่าง",
    role_requested: "admin",
    requested_at: _d(7),
    status: "pending",
    note: "ขอสิทธิ์ Admin เพิ่มเพื่อจัดการตาราง PM",
  },
  {
    approval_id: "APV-2026-004",
    name: "วรรณิศา ทองดี",
    emp_id: "EMP-1100",
    department: "ฝ่ายผลิต",
    position: "พนักงานผลิต",
    role_requested: "requester",
    requested_at: _d(1),
    status: "approved",
    approved_by: "ผู้บริหาร",
    approved_at: _d(0.5),
  },
  {
    approval_id: "APV-2026-005",
    name: "อภิวัฒน์ สมหวัง",
    emp_id: "EMP-0750",
    department: "ฝ่ายซ่อมบำรุง",
    position: "ช่างกล",
    role_requested: "technician",
    requested_at: _d(14),
    status: "rejected",
    reject_reason: "ยังไม่ผ่านการอบรมภายใน",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ─── QC Matrix System (Industrial Checksheets & Hourly Inspection) ───────────
// ══════════════════════════════════════════════════════════════════════════════

export type QCTemplateType = "standard" | "hourly_matrix" | "shift_parameter_matrix";
export type QCCellStatus = "normal" | "abnormal" | "repair_needed" | "inactive" | "na";

export interface QCMatrixColumn {
  col_id: string;
  label: string;
  sub_label?: string;
  group?: string;
  disabled_for_items?: string[]; // IDs of rows disabled for this column (e.g. hatched cells)
}

export interface QCMatrixRow {
  row_id: string;
  order: number;
  title: string;
  input_type: "status_symbol" | "number" | "text";
  unit?: string;
  min_value?: number;
  max_value?: number;
  standard_value?: string;
  applicable_columns?: string[];
  note?: string;
}

export interface QCMatrixShift {
  shift_id: string;
  name: string;
  time_range: string;
}

export interface QCMatrixSignoffRole {
  role_id: string;
  title: string;
}

export interface QCMatrixTemplate {
  template_id: string;
  template_type: QCTemplateType;
  title: string;
  company_name?: string;
  document_no?: string;
  line_or_zone?: string;
  machine_type?: string;
  page_info?: string;
  notes_guidelines?: string[];
  columns: QCMatrixColumn[];
  rows: QCMatrixRow[];
  shifts?: QCMatrixShift[];
  signoff_roles?: QCMatrixSignoffRole[];
  created_by: string;
  created_at: string;
  active: boolean;
}

export interface QCMatrixCellValue {
  status?: QCCellStatus;
  numeric_value?: number;
  text_value?: string;
  logged_at?: string;
  logged_by?: string;
  note?: string;
  work_request_id?: string;
}

export interface QCMatrixRecordData {
  record_id: string;
  schedule_id: string;
  template_id: string;
  date: string;
  cells: Record<string, QCMatrixCellValue>; // key: `${shift_id || 'default'}_${row_id}_${col_id}`
  column_signoffs?: Record<string, { inspector_name?: string; inspector_time?: string; verifier_name?: string; verifier_time?: string }>; // key: `${shift_id || 'default'}_${col_id}`
  shift_signoffs?: Record<string, { inspector_name?: string; inspector_time?: string; verifier_name?: string; verifier_time?: string }>; // key: shift_id
  supervisor_approval?: {
    approved_by?: string;
    approved_at?: string;
    status: "pending" | "approved";
    comment?: string;
  };
}

// ─── Matrix Presets ──────────────────────────────────────────────────────────

export const MOCK_QC_MATRIX_TEMPLATES: QCMatrixTemplate[] = [
  {
    template_id: "TPL-HOURLY-002",
    template_type: "hourly_matrix",
    title: "รายการตรวจสอบเครื่องคัดแยกและระบบสั่น 24 ชั่วโมง",
    company_name: "บริษัท เพรซิเดนท์ฟลาวมิลล์ จำกัด",
    document_no: "QC-SRT-24H",
    line_or_zone: "Line คัดแยกข้าวสาร / ระบบสั่น",
    machine_type: "เครื่องคัดแยกและถาดสั่น",
    page_info: "หน้า 1/1",
    created_by: "สุภาพร QC",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    active: true,
    signoff_roles: [
      { role_id: "millhand", title: "ผู้ตรวจสอบ: Millhand" },
      { role_id: "miller", title: "ผู้ทวนสอบ: Miller" },
    ],
    notes_guidelines: [
      "1. ให้ตรวจสอบเครื่องจักรทุก 2 ชั่วโมง",
      "2. รายการที่ 7, 8, 9, 10 ให้ใส่ค่าที่อ่านได้ ถ้าไม่อยู่ในค่าที่กำหนดให้แจ้งหัวหน้างาน",
      "3. ผู้ตรวจสอบคือพนักงาน MILLHAND ขึ้นไป",
      "4. พบปัญหาการทำงานของเครื่องจักรแจ้งหัวหน้างานทันที",
    ],
    columns: [
      { col_id: "08_00", label: "8.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "09_00", label: "9.00" },
      { col_id: "10_00", label: "10.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "11_00", label: "11.00" },
      { col_id: "12_00", label: "12.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "13_00", label: "13.00" },
      { col_id: "14_00", label: "14.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "15_00", label: "15.00" },
      { col_id: "16_00", label: "16.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "17_00", label: "17.00" },
      { col_id: "18_00", label: "18.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "19_00", label: "19.00" },
      { col_id: "20_00", label: "20.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "21_00", label: "21.00" },
      { col_id: "22_00", label: "22.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "23_00", label: "23.00" },
      { col_id: "24_00", label: "24.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "01_00", label: "1.00" },
      { col_id: "02_00", label: "2.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "03_00", label: "3.00" },
      { col_id: "04_00", label: "4.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "05_00", label: "5.00" },
      { col_id: "06_00", label: "6.00", disabled_for_items: ["color_defect", "spot_defect"] },
      { col_id: "07_00", label: "7.00" },
    ],
    rows: [
      { row_id: "ch_sorter", order: 1, title: "1.) ช่องคัดข้าวไม่ได้คุณภาพมีข้าวติดปนหรือไม่", input_type: "status_symbol" },
      { row_id: "vib_1", order: 2, title: "2.) ระบบสั่นถาดที่ 1 ทำงานหรือไม่", input_type: "status_symbol" },
      { row_id: "vib_2", order: 3, title: "3.) ระบบสั่นถาดที่ 2 ทำงานหรือไม่", input_type: "status_symbol" },
      { row_id: "vib_3", order: 4, title: "4.) ระบบสั่นถาดที่ 3 ทำงานหรือไม่", input_type: "status_symbol" },
      { row_id: "vib_4", order: 5, title: "5.) ระบบสั่นถาดที่ 4 ทำงานหรือไม่", input_type: "status_symbol" },
      { row_id: "lamps", order: 6, title: "6.) หลอดไฟทำงานทุกหลอดหรือไม่", input_type: "status_symbol" },
      { row_id: "ejector_rates", order: 7, title: "7.) EJECTOR RATES", input_type: "number", unit: "%", min_value: 5, max_value: 20 },
      { row_id: "color_defect", order: 8, title: "8.) COLOUR DEFECT", input_type: "number", unit: "%", min_value: 0, max_value: 0.5, note: "ตรวจเฉพาะชั่วโมงคี่" },
      { row_id: "spot_defect", order: 9, title: "9.) SPOT DEFECT", input_type: "number", unit: "%", min_value: 0, max_value: 0.3, note: "ตรวจเฉพาะชั่วโมงคี่" },
      { row_id: "pressure_gauge", order: 10, title: "10.) ค่าแรงดันลมที่ PRESSURE GAUGE", input_type: "number", unit: "bar", min_value: 5.5, max_value: 7.0 },
      { row_id: "machine_oper", order: 11, title: "11.) การทำงานของเครื่องจักร", input_type: "status_symbol" },
    ],
  },
  {
    template_id: "TPL-ROLLERMILL-001",
    template_type: "shift_parameter_matrix",
    title: "ROLLERMILL PARAMETERS",
    company_name: "บริษัท เพรซิเดนท์ฟลาวมิลล์ จำกัด",
    document_no: "QC-RML-LineC",
    line_or_zone: "ROLLERMILL Line C",
    machine_type: "เครื่องโม่แป้ง Rollermill",
    page_info: "หน้า 1",
    created_by: "ณัฐพงศ์ QC",
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    active: true,
    shifts: [
      { shift_id: "shift_a", name: "SHIFT A", time_range: "08:00 - 16:00" },
      { shift_id: "shift_b", name: "SHIFT B", time_range: "16:00 - 24:00" },
      { shift_id: "shift_c", name: "SHIFT C", time_range: "00:00 - 08:00" },
    ],
    notes_guidelines: [
      "1. ทวนสอบทุกครั้งที่เปลี่ยนกะ",
      "2. ช่อง BREAK RELEASE เช็คเฉพาะ B1, B2 และ B3 เท่านั้น",
      "3. ช่อง Roller ใส่เครื่องหมายแทนค่า ดังนี้: [✓] ปกติ  [✗] ขาด/หัวฉีกขาด",
      "4. แจ้งหัวหน้างานทันทีเมื่อพบสิ่งผิดปกติ",
    ],
    columns: [
      { col_id: "B1B2", label: "B1B2", group: "ROLLERMILL Line C" },
      { col_id: "B3", label: "B3", group: "ROLLERMILL Line C" },
      { col_id: "B4", label: "B4", group: "ROLLERMILL Line C" },
      { col_id: "B5", label: "B5", group: "ROLLERMILL Line C" },
      { col_id: "C1AC1A_I", label: "C1AC1A I", group: "ROLLERMILL Line C" },
      { col_id: "C1AC1A_II", label: "C1AC1A II", group: "ROLLERMILL Line C" },
      { col_id: "C1BC2B", label: "C1BC2B", group: "ROLLERMILL Line C" },
      { col_id: "C3", label: "C3", group: "ROLLERMILL Line C" },
      { col_id: "C4", label: "C4", group: "ROLLERMILL Line C" },
      { col_id: "C5", label: "C5", group: "ROLLERMILL Line C" },
      { col_id: "C6", label: "C6", group: "ROLLERMILL Line C" },
      { col_id: "C7", label: "C7", group: "ROLLERMILL Line C" },
      { col_id: "C8", label: "C8", group: "ROLLERMILL Line C" },
      { col_id: "C10", label: "C10", group: "ROLLERMILL Line C" },
      { col_id: "inspector", label: "ผู้ตรวจ", sub_label: "ลายมือชื่อ" },
    ],
    rows: [
      { row_id: "motor_a", order: 1, title: "MOTOR (A)", input_type: "number", unit: "A", min_value: 15, max_value: 38 },
      { row_id: "2f1g_max", order: 2, title: "2F1G MAX", input_type: "number", min_value: 20, max_value: 45 },
      { row_id: "2f1g_min", order: 3, title: "2F1G MIN", input_type: "number", min_value: 10, max_value: 25 },
      { row_id: "level", order: 4, title: "LEVEL", input_type: "text", standard_value: "ปกติ" },
      { row_id: "level_min", order: 5, title: "LEVEL MIN", input_type: "text", standard_value: "ปกติ" },
      { row_id: "clock_l", order: 6, title: "CLOCK (L)", input_type: "number", unit: "mm" },
      { row_id: "clock_r", order: 7, title: "CLOCK (R)", input_type: "number", unit: "mm" },
      { row_id: "break_release", order: 8, title: "BREAK RELEASE", input_type: "status_symbol", applicable_columns: ["B1B2", "B3", "B4", "B5"], note: "เช็คเฉพาะ B1, B2 และ B3 เท่านั้น" },
      { row_id: "roller", order: 9, title: "ROLLER", input_type: "status_symbol", note: "ใส่ [✓] ปกติ, [✗] ขาด/หัวฉีกขาด" },
    ],
  },
];

// ─── Initial Mock Matrix Records ─────────────────────────────────────────────

export const MOCK_QC_MATRIX_RECORDS: Record<string, QCMatrixRecordData> = {
  "QCS-2026-001": {
    record_id: "MAT-REC-2026-001",
    schedule_id: "QCS-2026-001",
    template_id: "TPL-HOURLY-002",
    date: new Date().toISOString().split("T")[0],
    cells: {
      // 08:00 slot
      "default_ch_sorter_08_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "08:05" },
      "default_vib_1_08_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "08:05" },
      "default_vib_2_08_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "08:05" },
      "default_vib_3_08_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "08:05" },
      "default_vib_4_08_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "08:05" },
      "default_lamps_08_00": { status: "repair_needed", logged_by: "วิชัย (Millhand)", logged_at: "08:06", note: "หลอดไฟช่องคัดดับ 1 ดวง", work_request_id: "REQ-20260422-001" },
      "default_ejector_rates_08_00": { numeric_value: 12.4, logged_by: "วิชัย (Millhand)", logged_at: "08:07" },
      "default_pressure_gauge_08_00": { numeric_value: 6.2, logged_by: "วิชัย (Millhand)", logged_at: "08:08" },
      "default_machine_oper_08_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "08:08" },

      // 09:00 slot
      "default_ch_sorter_09_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "09:02" },
      "default_vib_1_09_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "09:02" },
      "default_vib_2_09_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "09:02" },
      "default_vib_3_09_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "09:02" },
      "default_vib_4_09_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "09:02" },
      "default_lamps_09_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "09:03" },
      "default_ejector_rates_09_00": { numeric_value: 12.5, logged_by: "วิชัย (Millhand)", logged_at: "09:04" },
      "default_color_defect_09_00": { numeric_value: 0.15, logged_by: "วิชัย (Millhand)", logged_at: "09:04" },
      "default_spot_defect_09_00": { numeric_value: 0.08, logged_by: "วิชัย (Millhand)", logged_at: "09:05" },
      "default_pressure_gauge_09_00": { numeric_value: 6.3, logged_by: "วิชัย (Millhand)", logged_at: "09:05" },
      "default_machine_oper_09_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "09:06" },

      // 10:00 slot
      "default_ch_sorter_10_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "10:05" },
      "default_vib_1_10_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "10:05" },
      "default_vib_2_10_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "10:05" },
      "default_vib_3_10_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "10:05" },
      "default_vib_4_10_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "10:05" },
      "default_lamps_10_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "10:05" },
      "default_ejector_rates_10_00": { numeric_value: 12.3, logged_by: "วิชัย (Millhand)", logged_at: "10:06" },
      "default_pressure_gauge_10_00": { numeric_value: 6.2, logged_by: "วิชัย (Millhand)", logged_at: "10:06" },
      "default_machine_oper_10_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "10:07" },

      // 11:00 slot
      "default_ch_sorter_11_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "11:01" },
      "default_vib_1_11_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "11:01" },
      "default_vib_2_11_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "11:01" },
      "default_vib_3_11_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "11:01" },
      "default_vib_4_11_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "11:01" },
      "default_lamps_11_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "11:02" },
      "default_ejector_rates_11_00": { numeric_value: 12.4, logged_by: "วิชัย (Millhand)", logged_at: "11:03" },
      "default_color_defect_11_00": { numeric_value: 0.12, logged_by: "วิชัย (Millhand)", logged_at: "11:03" },
      "default_spot_defect_11_00": { numeric_value: 0.05, logged_by: "วิชัย (Millhand)", logged_at: "11:04" },
      "default_pressure_gauge_11_00": { numeric_value: 6.2, logged_by: "วิชัย (Millhand)", logged_at: "11:04" },
      "default_machine_oper_11_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "11:05" },

      // 12:00 slot
      "default_ch_sorter_12_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "12:00" },
      "default_vib_1_12_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "12:00" },
      "default_vib_2_12_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "12:00" },
      "default_vib_3_12_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "12:00" },
      "default_vib_4_12_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "12:00" },
      "default_lamps_12_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "12:01" },
      "default_ejector_rates_12_00": { numeric_value: 12.5, logged_by: "วิชัย (Millhand)", logged_at: "12:01" },
      "default_pressure_gauge_12_00": { numeric_value: 6.1, logged_by: "วิชัย (Millhand)", logged_at: "12:02" },
      "default_machine_oper_12_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "12:02" },

      // 13:00 slot
      "default_ch_sorter_13_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "13:00" },
      "default_vib_1_13_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "13:00" },
      "default_vib_2_13_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "13:00" },
      "default_vib_3_13_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "13:00" },
      "default_vib_4_13_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "13:00" },
      "default_lamps_13_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "13:01" },
      "default_ejector_rates_13_00": { numeric_value: 12.4, logged_by: "วิชัย (Millhand)", logged_at: "13:02" },
      "default_color_defect_13_00": { numeric_value: 0.18, logged_by: "วิชัย (Millhand)", logged_at: "13:02" },
      "default_spot_defect_13_00": { numeric_value: 0.09, logged_by: "วิชัย (Millhand)", logged_at: "13:03" },
      "default_pressure_gauge_13_00": { numeric_value: 6.2, logged_by: "วิชัย (Millhand)", logged_at: "13:03" },
      "default_machine_oper_13_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "13:04" },

      // 14:00 slot
      "default_ch_sorter_14_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "14:05" },
      "default_vib_1_14_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "14:05" },
      "default_vib_2_14_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "14:05" },
      "default_vib_3_14_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "14:05" },
      "default_vib_4_14_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "14:05" },
      "default_lamps_14_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "14:06" },
      "default_ejector_rates_14_00": { numeric_value: 12.3, logged_by: "วิชัย (Millhand)", logged_at: "14:06" },
      "default_pressure_gauge_14_00": { numeric_value: 6.3, logged_by: "วิชัย (Millhand)", logged_at: "14:07" },
      "default_machine_oper_14_00": { status: "normal", logged_by: "วิชัย (Millhand)", logged_at: "14:07" },
    },
    column_signoffs: {
      "default_08_00": { inspector_name: "วิชัย ป.", inspector_time: "08:10", verifier_name: "ธีรเดช ส.", verifier_time: "08:15" },
      "default_09_00": { inspector_name: "วิชัย ป.", inspector_time: "09:07", verifier_name: "ธีรเดช ส.", verifier_time: "09:12" },
      "default_10_00": { inspector_name: "วิชัย ป.", inspector_time: "10:08", verifier_name: "ธีรเดช ส.", verifier_time: "10:15" },
      "default_11_00": { inspector_name: "วิชัย ป.", inspector_time: "11:06", verifier_name: "ธีรเดช ส.", verifier_time: "11:10" },
      "default_12_00": { inspector_name: "วิชัย ป.", inspector_time: "12:05", verifier_name: "ธีรเดช ส.", verifier_time: "12:15" },
      "default_13_00": { inspector_name: "วิชัย ป.", inspector_time: "13:05", verifier_name: "ธีรเดช ส.", verifier_time: "13:10" },
      "default_14_00": { inspector_name: "วิชัย ป.", inspector_time: "14:08", verifier_name: "ธีรเดช ส.", verifier_time: "14:15" },
    },
    supervisor_approval: {
      approved_by: "สมบัติ รัตนวงศ์ (หัวหน้าแผนก)",
      approved_at: new Date().toISOString(),
      status: "pending",
      comment: "รอบตรวจช่วงเช้าเรียบร้อย รอดำเนินการเปลี่ยนหลอดไฟตามที่แจ้งซ่อม",
    },
  },

  "QCS-2026-002": {
    record_id: "MAT-REC-2026-002",
    schedule_id: "QCS-2026-002",
    template_id: "TPL-ROLLERMILL-001",
    date: new Date().toISOString().split("T")[0],
    cells: {
      // Shift A data
      "shift_a_motor_a_B1B2": { numeric_value: 24.5, logged_by: "มานะ (กะ A)", logged_at: "08:30" },
      "shift_a_motor_a_B3": { numeric_value: 26.2, logged_by: "มานะ (กะ A)", logged_at: "08:30" },
      "shift_a_motor_a_B4": { numeric_value: 25.0, logged_by: "มานะ (กะ A)", logged_at: "08:31" },
      "shift_a_motor_a_B5": { numeric_value: 27.1, logged_by: "มานะ (กะ A)", logged_at: "08:31" },
      "shift_a_motor_a_C1AC1A_I": { numeric_value: 28.3, logged_by: "มานะ (กะ A)", logged_at: "08:32" },
      "shift_a_motor_a_C1AC1A_II": { numeric_value: 28.0, logged_by: "มานะ (กะ A)", logged_at: "08:32" },
      "shift_a_motor_a_C1BC2B": { numeric_value: 29.1, logged_by: "มานะ (กะ A)", logged_at: "08:33" },
      "shift_a_motor_a_C3": { numeric_value: 24.0, logged_by: "มานะ (กะ A)", logged_at: "08:33" },
      "shift_a_motor_a_C4": { numeric_value: 25.2, logged_by: "มานะ (กะ A)", logged_at: "08:34" },
      "shift_a_motor_a_C5": { numeric_value: 26.1, logged_by: "มานะ (กะ A)", logged_at: "08:34" },
      "shift_a_motor_a_C6": { numeric_value: 24.8, logged_by: "มานะ (กะ A)", logged_at: "08:35" },
      "shift_a_motor_a_C7": { numeric_value: 25.5, logged_by: "มานะ (กะ A)", logged_at: "08:35" },
      "shift_a_motor_a_C8": { numeric_value: 26.0, logged_by: "มานะ (กะ A)", logged_at: "08:36" },
      "shift_a_motor_a_C10": { numeric_value: 27.4, logged_by: "มานะ (กะ A)", logged_at: "08:36" },

      "shift_a_2f1g_max_B1B2": { numeric_value: 32.0 },
      "shift_a_2f1g_max_B3": { numeric_value: 34.0 },
      "shift_a_2f1g_min_B1B2": { numeric_value: 18.0 },
      "shift_a_2f1g_min_B3": { numeric_value: 17.5 },

      "shift_a_break_release_B1B2": { status: "normal" },
      "shift_a_break_release_B3": { status: "normal" },
      "shift_a_break_release_B4": { status: "normal" },
      "shift_a_break_release_B5": { status: "normal" },

      "shift_a_roller_B1B2": { status: "normal" },
      "shift_a_roller_B3": { status: "normal" },
      "shift_a_roller_B4": { status: "normal" },
      "shift_a_roller_B5": { status: "normal" },
      "shift_a_roller_C1AC1A_I": { status: "normal" },
      "shift_a_roller_C1AC1A_II": { status: "normal" },
      "shift_a_roller_C1BC2B": { status: "normal" },
      "shift_a_roller_C3": { status: "normal" },
      "shift_a_roller_C4": { status: "normal" },
      "shift_a_roller_C5": { status: "normal" },
      "shift_a_roller_C6": { status: "normal" },
      "shift_a_roller_C7": { status: "normal" },
      "shift_a_roller_C8": { status: "normal" },
      "shift_a_roller_C10": { status: "normal" },
    },
    shift_signoffs: {
      "shift_a": { inspector_name: "มานะ วงศ์ไทย", inspector_time: "15:45", verifier_name: "ณัฐพงศ์ QC", verifier_time: "15:55" },
    },
    supervisor_approval: {
      status: "pending",
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ─── System Users (Superadmin User Management) ───────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export type UserStatus = "active" | "inactive" | "suspended";

export interface SystemUser {
  user_id: string;
  emp_id: string;
  name: string;
  username: string;
  department: string;
  position: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone: string;
  created_at: string;
  last_login: string;
  skills?: string[];
}

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  active: "ใช้งาน",
  inactive: "ไม่ได้ใช้งาน",
  suspended: "ระงับ",
};

export const MOCK_SYSTEM_USERS: SystemUser[] = [
  {
    user_id: "USR-001",
    emp_id: "SA001",
    name: "ระบบ Superadmin",
    username: "superadmin",
    department: "IT",
    position: "System Administrator",
    role: "superadmin",
    status: "active",
    email: "superadmin@fixflow.co.th",
    phone: "081-000-0000",
    created_at: "2026-01-01T00:00:00.000Z",
    last_login: _d(0.1),
  },
  {
    user_id: "USR-002",
    emp_id: "TECH001",
    name: "สมศักดิ์ ช่างไฟ",
    username: "somsak.t",
    department: "Maintenance",
    position: "ช่างไฟฟ้า",
    role: "technician",
    status: "active",
    email: "somsak.t@fixflow.co.th",
    phone: "081-111-1111",
    created_at: "2026-02-15T08:00:00.000Z",
    last_login: _d(0.2),
    skills: ["electrical", "facility"],
  },
  {
    user_id: "USR-003",
    emp_id: "TECH002",
    name: "ชาญชัย เครื่องกล",
    username: "chanchai.k",
    department: "Maintenance",
    position: "ช่างกล",
    role: "technician",
    status: "active",
    email: "chanchai.k@fixflow.co.th",
    phone: "081-222-2222",
    created_at: "2026-02-20T08:00:00.000Z",
    last_login: _d(0.5),
    skills: ["mechanical", "pneumatic-hydraulic"],
  },
  {
    user_id: "USR-004",
    emp_id: "TECH003",
    name: "วิชัย หล่อลื่น",
    username: "wichai.l",
    department: "Maintenance",
    position: "ช่างหล่อลื่น",
    role: "technician",
    status: "active",
    email: "wichai.l@fixflow.co.th",
    phone: "081-333-3333",
    created_at: "2026-03-01T08:00:00.000Z",
    last_login: _d(1),
    skills: ["lubrication-fluid", "mechanical"],
  },
  {
    user_id: "USR-005",
    emp_id: "REQ042",
    name: "นภดล ฝ่ายผลิต",
    username: "nophon.r",
    department: "ฝ่ายผลิต",
    position: "พนักงานผลิต",
    role: "requester",
    status: "active",
    email: "nophon.r@fixflow.co.th",
    phone: "081-444-4444",
    created_at: "2026-03-10T08:00:00.000Z",
    last_login: _d(0.3),
  },
  {
    user_id: "USR-006",
    emp_id: "ADMIN001",
    name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    username: "admin",
    department: "Management",
    position: "ผู้จัดการฝ่าย",
    role: "admin",
    status: "active",
    email: "admin@fixflow.co.th",
    phone: "081-555-5555",
    created_at: "2026-01-15T08:00:00.000Z",
    last_login: _d(0.1),
  },
  {
    user_id: "USR-007",
    emp_id: "QC001",
    name: "ณัฐพงศ์ QC",
    username: "qc",
    department: "ฝ่ายควบคุมคุณภาพ",
    position: "หัวหน้า QC",
    role: "qc",
    status: "active",
    email: "natthapong.qc@fixflow.co.th",
    phone: "081-666-6666",
    created_at: "2026-01-20T08:00:00.000Z",
    last_login: _d(0.4),
  },
  {
    user_id: "USR-008",
    emp_id: "EXEC001",
    name: "ผู้บริหาร",
    username: "executive",
    department: "Executive",
    position: "ผู้อำนวยการโรงงาน",
    role: "executive",
    status: "active",
    email: "exec@fixflow.co.th",
    phone: "081-777-7777",
    created_at: "2026-01-10T08:00:00.000Z",
    last_login: _d(0.2),
  },
  {
    user_id: "USR-009",
    emp_id: "EMP-0750",
    name: "อภิวัฒน์ สมหวัง",
    username: "aphiwat.s",
    department: "ฝ่ายซ่อมบำรุง",
    position: "ช่างกล",
    role: "technician",
    status: "suspended",
    email: "aphiwat.s@fixflow.co.th",
    phone: "081-888-8888",
    created_at: "2025-11-01T08:00:00.000Z",
    last_login: _d(14),
    skills: ["mechanical"],
  },
  {
    user_id: "USR-010",
    emp_id: "EMP-1200",
    name: "สมพร พักผ่อน",
    username: "somporn.p",
    department: "ฝ่ายผลิต",
    position: "พนักงานผลิต",
    role: "requester",
    status: "inactive",
    email: "somporn.p@fixflow.co.th",
    phone: "081-999-9999",
    created_at: "2025-08-01T08:00:00.000Z",
    last_login: _d(60),
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ─── Superadmin Audit Logs & Master Data ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "OVERRIDE" | "APPROVE" | "REJECT" | "LOGIN" | "STOCK_ADJUST";
export type AuditEntity = "WORK_REQUEST" | "USER" | "SPARE_PART" | "PO" | "USER_APPROVAL" | "SYSTEM_SETTING";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: UserRole;
  action: AuditAction;
  entity: AuditEntity;
  entity_id: string;
  details: string;
  ip_address: string;
}

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "LOG-1029",
    timestamp: _d(0.05),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "LOGIN",
    entity: "USER",
    entity_id: "USR-001",
    details: "เข้าสู่ระบบผ่าน Web Console (IP: 192.168.1.184)",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1028",
    timestamp: _d(0.3),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "OVERRIDE",
    entity: "WORK_REQUEST",
    entity_id: "WR-2026-004",
    details: "Force Assign งานให้ช่าง: เกรียงไกร ช่างเชื่อม (TECH002) และปรับสถานะเป็น doing",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1027",
    timestamp: _d(0.8),
    user_name: "ผู้บริหาร",
    user_role: "executive",
    action: "APPROVE",
    entity: "PO",
    entity_id: "PO-2026-088",
    details: "อนุมัติใบสั่งซื้อลูกปืน SKF 6205-2RSH จำนวน 10 ชิ้น ยอดเงิน 18,500 บาท",
    ip_address: "192.168.1.45",
  },
  {
    id: "LOG-1026",
    timestamp: _d(1.2),
    user_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    user_role: "admin",
    action: "UPDATE",
    entity: "SPARE_PART",
    entity_id: "SP-002",
    details: "เบิกจ่ายอะไหล่ ซีลกันน้ำมัน Viton 35x50x8 จำนวน 2 ชิ้น งาน WR-2026-001",
    ip_address: "192.168.1.102",
  },
  {
    id: "LOG-1025",
    timestamp: _d(1.9),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "STOCK_ADJUST",
    entity: "SPARE_PART",
    entity_id: "SP-001",
    details: "ปรับยอดตรวจนับคงคลังประจำสัปดาห์ จาก 8 เป็น 14 ชิ้น (เหตุผล: ตรวจนับสต็อกจริง)",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1024",
    timestamp: _d(2.4),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "CREATE",
    entity: "USER",
    entity_id: "USR-011",
    details: "สร้างผู้ใช้งานใหม่: ชัชวาลย์ เทคโน (TECH004) สิทธิ์ technician",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1023",
    timestamp: _d(3.1),
    user_name: "ผู้บริหาร",
    user_role: "executive",
    action: "APPROVE",
    entity: "USER_APPROVAL",
    entity_id: "UA-002",
    details: "อนุมัติสิทธิ์การเข้าใช้งานระบบสำหรับ: ธวัชชัย มั่นคง แผนกซ่อมบำรุง",
    ip_address: "192.168.1.45",
  },
  {
    id: "LOG-1022",
    timestamp: _d(4.5),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "UPDATE",
    entity: "SYSTEM_SETTING",
    entity_id: "CFG-SLA",
    details: "ปรับปรุงค่า SLA งานวิกฤติ (Critical) จาก 3.0 ชม. เป็น 2.0 ชม.",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1021",
    timestamp: _d(5.2),
    user_name: "นภดล ฝ่ายผลิต",
    user_role: "requester",
    action: "CREATE",
    entity: "WORK_REQUEST",
    entity_id: "WR-2026-006",
    details: "เปิดใบแจ้งซ่อมใหม่: สายพานลำเลียง C3 หยุดทำงานกะทันหัน",
    ip_address: "192.168.2.14",
  },
  {
    id: "LOG-1020",
    timestamp: _d(6.0),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "DELETE",
    entity: "WORK_REQUEST",
    entity_id: "WR-2026-003",
    details: "ยกเลิกงานซ่อมซ้ำซ้อนตามคำขอของหัวหน้าฝ่ายผลิต",
    ip_address: "192.168.1.184",
  },
];

export interface SystemMachineMaster {
  id: string;
  code: string;
  name: string;
  zone: string;
  building: string;
  line: string;
  status: "operational" | "warning" | "down" | "maintenance";
  critical_level: "high" | "medium" | "low";
  installed_date: string;
}

export const MOCK_MACHINES_MASTER: SystemMachineMaster[] = [
  { id: "MC-01", code: "CNC-01", name: "CNC Milling Machine VMC-850", zone: "Zone A", building: "Main Plant", line: "Line 1 - Machining", status: "operational", critical_level: "high", installed_date: "2023-01-15" },
  { id: "MC-02", code: "PMP-02", name: "Hydraulic Press 500T", zone: "Zone B", building: "Main Plant", line: "Line 2 - Stamping", status: "down", critical_level: "high", installed_date: "2022-06-20" },
  { id: "MC-03", code: "CV-03", name: "Overhead Conveyor Line A", zone: "Zone A", building: "Main Plant", line: "Line 1 - Assembly", status: "operational", critical_level: "medium", installed_date: "2023-08-10" },
  { id: "MC-04", code: "BL-04", name: "Steam Boiler 2.5T", zone: "Utility", building: "Utility Building", line: "Utility System", status: "warning", critical_level: "high", installed_date: "2021-11-05" },
  { id: "MC-05", code: "AC-05", name: "Chiller Plant #2 (Carrier)", zone: "Utility", building: "HVAC Plant", line: "HVAC System", status: "operational", critical_level: "medium", installed_date: "2024-03-01" },
  { id: "MC-06", code: "PK-06", name: "Auto Packaging Robot KUKA", zone: "Zone C", building: "Main Plant", line: "Line 3 - Packaging", status: "operational", critical_level: "high", installed_date: "2024-05-18" },
];

export interface SystemSettingsConfig {
  company_name: string;
  maintenance_email: string;
  monthly_budget: number;
  po_manager_limit: number;
  po_exec_limit: number;
  sla_critical_hours: number;
  sla_high_hours: number;
  sla_normal_hours: number;
  sla_low_hours: number;
  auto_escalation: boolean;
  line_notify_enabled: boolean;
  email_notify_enabled: boolean;
}

export const MOCK_SYSTEM_CONFIG: SystemSettingsConfig = {
  company_name: "FixFlow Precision Engineering Co., Ltd.",
  maintenance_email: "maintenance-alert@fixflow.co.th",
  monthly_budget: 80000,
  po_manager_limit: 10000,
  po_exec_limit: 50000,
  sla_critical_hours: 2,
  sla_high_hours: 8,
  sla_normal_hours: 24,
  sla_low_hours: 72,
  auto_escalation: true,
  line_notify_enabled: true,
  email_notify_enabled: true,
};

