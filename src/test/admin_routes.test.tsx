import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "../pages/AdminDashboard";
import TechnicianHistory from "../pages/TechnicianHistory";
import TechnicianDetail from "../pages/TechnicianDetail";
import SpareParts from "../pages/SpareParts";
import SuperadminDashboard from "../pages/SuperadminDashboard";
import AssignWorkModal from "../components/superadmin/AssignWorkModal";
import WorkOrderManagementUnified from "../pages/WorkOrderManagementUnified";
import { EditWorkOrderModal } from "../components/superadmin/EditWorkOrderModal";

describe("Admin routes rendering", () => {
  it("renders /admin/technician-history without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/technician-history"]}>
        <Routes>
          <Route path="/admin/technician-history" element={<AdminDashboard defaultTab="technician-history" />} />
          <Route path="/admin/technician/:id" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders /admin/technician/TECH001 without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/technician/TECH001"]}>
        <Routes>
          <Route path="/admin/technician-history" element={<AdminDashboard defaultTab="technician-history" />} />
          <Route path="/admin/technician/:id" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders TechnicianHistory standalone without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <TechnicianHistory />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders TechnicianDetail standalone without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/technician/TECH001"]}>
        <Routes>
          <Route path="/admin/technician/:id" element={<TechnicianDetail />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders /admin/spare-parts standalone without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/spare-parts"]}>
        <Routes>
          <Route path="/admin/spare-parts" element={<SpareParts />} />
          <Route path="/spare-parts" element={<SpareParts />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders /spare-parts standalone without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/spare-parts"]}>
        <Routes>
          <Route path="/admin/spare-parts" element={<SpareParts />} />
          <Route path="/spare-parts" element={<SpareParts />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders /admin/checksheet with Admin sidebar without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/checksheet"]}>
        <Routes>
          <Route path="/admin/checksheet" element={<AdminDashboard />} />
          <Route path="/checksheet" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders /checksheet with Admin sidebar without crashing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/checksheet"]}>
        <Routes>
          <Route path="/admin/checksheet" element={<AdminDashboard />} />
          <Route path="/checksheet" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders /admin/dashboard?tab=team with TeamSection without crashing", () => {
    const { getByText, getAllByText } = render(
      <MemoryRouter initialEntries={["/admin/dashboard?tab=team"]}>
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(getAllByText("ทีมช่าง").length).toBeGreaterThanOrEqual(1);
    expect(getByText("รายละเอียดช่าง (แสดง 10 คนแรก)")).toBeTruthy();
  });

  it("renders TechnicianDetail TECH004 with full name and correct stats", () => {
    const { getByText, getAllByText } = render(
      <MemoryRouter initialEntries={["/admin/technician/TECH004"]}>
        <Routes>
          <Route path="/admin/technician/:id" element={<TechnicianDetail />} />
        </Routes>
      </MemoryRouter>
    );
    expect(getByText("อานนท์ ใจดี")).toBeTruthy();
    expect(getByText("6 งาน")).toBeTruthy();
    expect(getAllByText("081-234-5678").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("anont@company.com").length).toBeGreaterThanOrEqual(1);
  });

  it("renders TechnicianDetail TECH002 (วิษณุ ช่างกล) full name without truncation", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/admin/technician/TECH002"]}>
        <Routes>
          <Route path="/admin/technician/:id" element={<TechnicianDetail />} />
        </Routes>
      </MemoryRouter>
    );
    expect(getByText("วิษณุ ช่างกล")).toBeTruthy();
  });

  it("renders SuperadminDashboard tab=dispatch without crashing", () => {
    const { getByText, getAllByText } = render(
      <MemoryRouter initialEntries={["/superadmin/dashboard?tab=dispatch"]}>
        <Routes>
          <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(getAllByText("ศูนย์จ่ายงานและมอบหมายช่าง (Job Dispatch Center)").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("คิวงานที่รอมอบหมาย (Dispatch Queue)").length).toBeGreaterThanOrEqual(1);
  });

  it("renders AssignWorkModal with job and technician recommendations", () => {
    const mockRequest = {
      request_id: "REQ-TEST-001",
      asset_name: "MCH-PUMP-01",
      asset_location: "Building A",
      issue_summary: "มอเตอร์ไฟฟ้าตัดการทำงาน",
      priority: "high" as const,
      status: "open" as const,
      sub_status: "reported" as const,
      reported_time: new Date().toISOString(),
      reported_by: "ทดสอบ ผู้แจ้ง",
      category: "electrical" as const,
      attachments: [],
      status_timeline: [],
      requester_notifications: [],
    };

    const { getByText, getAllByText } = render(
      <AssignWorkModal
        isOpen={true}
        onClose={() => {}}
        request={mockRequest}
        onConfirm={() => {}}
      />
    );

    expect(getByText("มอบหมายงานซ่อมบำรุง (Work Order Dispatch)")).toBeTruthy();
    expect(getByText("REQ-TEST-001")).toBeTruthy();
    expect(getByText("มอเตอร์ไฟฟ้าตัดการทำงาน")).toBeTruthy();
    expect(getAllByText("สมศักดิ์ ช่างไฟ").length).toBeGreaterThanOrEqual(1);
  });

  it("renders WorkOrderManagementUnified new page with pencil edit buttons", () => {
    const { getByText, getAllByText } = render(
      <MemoryRouter initialEntries={["/work-orders/unified"]}>
        <WorkOrderManagementUnified />
      </MemoryRouter>
    );

    expect(getByText(/จัดการงานซ่อมบำรุงแบบรวมศูนย์/)).toBeTruthy();
    expect(getByText(/มอบหมาย & ปรับสถานะ/)).toBeTruthy();
    // Verify pencil button "แก้ไข" or "แก้ไขงาน" exists
    expect(getAllByText(/แก้ไข/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders EditWorkOrderModal combining assignment and status modification", () => {
    const mockRequest = {
      request_id: "REQ-TEST-002",
      asset_name: "CNC-MILL-02",
      asset_location: "Line 3 Factory B",
      issue_summary: "สปินเดิลหมุนแล้วมีเสียงดังผิดปกติ",
      priority: "critical" as const,
      status: "open" as const,
      sub_status: "reported" as const,
      reported_time: new Date().toISOString(),
      reported_by: "วิชัย ฝ่ายผลิต",
      category: "mechanical" as const,
      attachments: [],
      status_timeline: [],
      requester_notifications: [],
    };

    const { getByText, getAllByText } = render(
      <EditWorkOrderModal
        isOpen={true}
        onClose={() => {}}
        request={mockRequest}
        onConfirm={() => {}}
      />
    );

    expect(getByText(/แก้ไขใบสั่งซ่อม & ปรับสถานะงาน/)).toBeTruthy();
    expect(getByText(/มอบหมาย & ปรับสถานะ/)).toBeTruthy();
    expect(getByText("REQ-TEST-002")).toBeTruthy();
    expect(getByText("สปินเดิลหมุนแล้วมีเสียงดังผิดปกติ")).toBeTruthy();
    // Checks that status section, priority section, and technician picker are all present in the unified modal
    expect(getByText("1. สถานะงานปัจจุบัน (Status)")).toBeTruthy();
    expect(getByText("2. ระดับความสำคัญ (Priority)")).toBeTruthy();
    expect(getByText("5. เลือกช่างผู้รับผิดชอบหลัก (Primary Assignee)")).toBeTruthy();
    expect(getByText("บันทึกการแก้ไขทั้งหมด")).toBeTruthy();
  });
});
