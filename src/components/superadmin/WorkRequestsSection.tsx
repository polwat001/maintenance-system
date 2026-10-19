import WorkOrderManagementUnified from "@/pages/WorkOrderManagementUnified";

/**
 * WorkRequestsSection (Legacy alias)
 * Now delegates directly to WorkOrderManagementUnified (embedded mode)
 * combining technician assignment and status modification in a unified workflow.
 */
export function WorkRequestsSection() {
  return <WorkOrderManagementUnified embedded />;
}

export default WorkRequestsSection;
