export type Priority = "critical" | "high" | "medium" | "low";
export type Status = "new" | "doing" | "waiting" | "done";

export interface WorkRequest {
  request_id: string;
  asset_name: string;
  asset_location: string;
  issue_summary: string;
  priority: Priority;
  status: Status;
  reported_time: string;
  reported_by: string;
  category: "electrical" | "mechanical" | "facility" | "plumbing" | "it";
  assigned_to?: string | null;
}

export interface SparePart {
  part_id: string;
  name: string;
  stock: number;
  unit: string;
}

export const MOCK_REQUESTS: WorkRequest[] = [
  {
    request_id: "REQ-20260422-002",
    asset_name: "ELC-DB-5510",
    asset_location: "ตู้ควบคุมไฟ อาคาร B ชั้น 2",
    issue_summary: "เบรกเกอร์ทริปบ่อย มีกลิ่นไหม้",
    priority: "critical",
    status: "new",
    reported_time: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    reported_by: "นภดล (ฝ่ายผลิต)",
    category: "electrical",
  },
  {
    request_id: "REQ-20260422-001",
    asset_name: "MCH-PR-2041",
    asset_location: "Hydraulic Press Line 3",
    issue_summary: "กระบอกสูบไฮดรอลิกมีน้ำมันรั่วซึม",
    priority: "high",
    status: "new",
    reported_time: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    reported_by: "ประยุทธ์ (Line Leader)",
    category: "mechanical",
  },
  {
    request_id: "REQ-20260422-003",
    asset_name: "AC-OFF-019",
    asset_location: "แอร์ห้องประชุมใหญ่",
    issue_summary: "แอร์ไม่เย็น มีน้ำหยดจากเครื่อง",
    priority: "medium",
    status: "new",
    reported_time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reported_by: "วราภรณ์ (HR)",
    category: "facility",
  },
  {
    request_id: "REQ-20260421-014",
    asset_name: "CNV-ASSY-08",
    asset_location: "สายพานลำเลียง Assembly 8",
    issue_summary: "เสียงดังผิดปกติบริเวณมอเตอร์",
    priority: "high",
    status: "doing",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    reported_by: "สมชาย (Foreman)",
    category: "mechanical",
    assigned_to: "TECH001",
  },
  {
    request_id: "REQ-20260421-009",
    asset_name: "PLB-WC-302",
    asset_location: "ห้องน้ำชาย ชั้น 3",
    issue_summary: "ก๊อกน้ำหยดตลอดเวลา",
    priority: "low",
    status: "new",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    reported_by: "แม่บ้าน",
    category: "plumbing",
  },
  {
    request_id: "REQ-20260421-022",
    asset_name: "MCH-CNC-12",
    asset_location: "CNC Machine #12",
    issue_summary: "รอชิ้นส่วนใบมีดทดแทน คาดว่าได้พรุ่งนี้",
    priority: "high",
    status: "waiting",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    reported_by: "อนันต์",
    category: "mechanical",
    assigned_to: "TECH001",
  },
  {
    request_id: "REQ-20260420-031",
    asset_name: "IT-SRV-RACK2",
    asset_location: "Server Room",
    issue_summary: "พัดลม UPS เสียงดัง",
    priority: "medium",
    status: "new",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    reported_by: "ทีม IT",
    category: "it",
  },
];

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
  new: "งานใหม่",
  doing: "กำลังซ่อม",
  waiting: "รออะไหล่",
  done: "เสร็จสิ้น",
};

export const CATEGORY_LABEL: Record<WorkRequest["category"], string> = {
  electrical: "ไฟฟ้า",
  mechanical: "เครื่องกล",
  facility: "อาคาร/สิ่งอำนวย",
  plumbing: "ประปา",
  it: "ไอที",
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h / 24);
  return `${d} วันที่แล้ว`;
}

export const PRIORITY_RANK: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
