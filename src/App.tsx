import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login.tsx";
import TechnicianBoard from "./pages/TechnicianBoard.tsx";
import AssessmentForm from "./pages/AssessmentForm.tsx";
import RequestForm from "./pages/RequestForm.tsx";
import NotificationCenter from "./pages/NotificationCenter.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import SpareParts from "./pages/SpareParts.tsx";
import Checksheet from "./pages/Checksheet.tsx";
// ── Admin ──
import AdminSpareRequests from "./pages/AdminSpareRequests.tsx";
import TechnicianDetail from "./pages/TechnicianDetail.tsx";
import TechnicianHistory from "./pages/TechnicianHistory.tsx";
// ── QC ──
import QCDashboard from "./pages/QCDashboard.tsx";
import QCRecordDetail from "./pages/QCRecordDetail.tsx";
// ── Executive ──
import ExecutiveDashboard from "./pages/ExecutiveDashboard.tsx";
import ExecutivePurchaseApproval from "./pages/ExecutivePurchaseApproval.tsx";
import ExecutiveUserApproval from "./pages/ExecutiveUserApproval.tsx";
// ── Superadmin ──
import SuperadminDashboard from "./pages/SuperadminDashboard.tsx";
import SuperadminUserManagement from "./pages/SuperadminUserManagement.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/board" element={<TechnicianBoard />} />
          <Route path="/request" element={<RequestForm />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/assessment/:id" element={<AssessmentForm />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/spare-requests" element={<AdminSpareRequests />} />
          <Route path="/admin/technician-history" element={<TechnicianHistory />} />
          <Route path="/admin/technician/:id" element={<TechnicianDetail />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/checksheet" element={<Checksheet />} />
          {/* QC */}
          <Route path="/qc/dashboard" element={<QCDashboard />} />
          <Route path="/qc/schedule" element={<QCDashboard />} />
          <Route path="/qc/record/:id" element={<QCRecordDetail />} />
          {/* Executive */}
          <Route path="/executive/dashboard" element={<ExecutiveDashboard />} />
          <Route path="/executive/purchase-approval" element={<ExecutivePurchaseApproval />} />
          <Route path="/executive/user-approval" element={<ExecutiveUserApproval />} />
          {/* Superadmin */}
          <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
          <Route path="/superadmin/users" element={<SuperadminUserManagement />} />
          <Route path="/superadmin/work-requests" element={<Navigate to="/superadmin/dashboard?tab=work-requests" replace />} />
          <Route path="/superadmin/spare-parts" element={<Navigate to="/superadmin/dashboard?tab=spare-parts" replace />} />
          <Route path="/superadmin/approvals" element={<Navigate to="/superadmin/dashboard?tab=approvals" replace />} />
          <Route path="/superadmin/settings" element={<Navigate to="/superadmin/dashboard?tab=settings" replace />} />
          <Route path="/superadmin/audit-log" element={<Navigate to="/superadmin/dashboard?tab=audit-log" replace />} />
          <Route path="/superadmin/qc" element={<Navigate to="/superadmin/dashboard?tab=qc" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
