import { useSyncExternalStore } from "react";
import {
  MOCK_REQUESTS_WITH_TIMELINE,
  Priority,
  RequestAttachment,
  AssessmentReport,
  RequestDetails,
  RequestNotification,
  Status,
  StatusTimelineEvent,
  SubStatus,
  WorkRequest,
} from "./mockData";

type Listener = () => void;

let state: WorkRequest[] = [];
const listeners = new Set<Listener>();

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const STATUS_CHANGE_LABEL: Record<Status, string> = {
  open: "เปิดงาน",
  assess: "ประเมินงาน",
  doing: "กำลังซ่อม",
  waiting: "รออะไหล่",
  done: "ปิดงานแล้ว",
  qc1: "รอตรวจครั้งที่ 1",
  qc2: "รอตรวจครั้งที่ 2",
  complete: "เสร็จสิ้น",
};

const DEFAULT_SUB_STATUS_BY_STATUS: Record<Status, SubStatus> = {
  open: "reported",
  assess: "assessing",
  doing: "in-progress",
  waiting: "waiting-parts",
  done: "closed",
  qc1: "qc-round1",
  qc2: "qc-round2",
  complete: "finished",
};

function normalizeRequest(request: WorkRequest): WorkRequest {
  const defaultTimeline: StatusTimelineEvent[] = [
    {
      event_id: randomId("evt"),
      status: "open",
      updated_by: request.reported_by,
      updated_by_role: "requester",
      updated_at: request.reported_time,
      note: "เปิดงาน",
    },
  ];

  const timeline: StatusTimelineEvent[] = request.status_timeline?.length
    ? request.status_timeline
    : defaultTimeline;

  return {
    ...request,
    attachments: request.attachments ?? [],
    status_timeline: timeline,
    requester_notifications: request.requester_notifications ?? [],
  };
}

state = MOCK_REQUESTS_WITH_TIMELINE.map(normalizeRequest);

function emit() {
  listeners.forEach((l) => l());
}

export const requestStore = {
  getAll(): WorkRequest[] {
    return state;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(input: {
    asset_name: string;
    asset_location: string;
    issue_summary: string;
    priority: Priority;
    category: WorkRequest["category"];
    reported_by: string;
    reported_by_id?: string;
    reported_by_department?: string;
    attachments?: RequestAttachment[];
    request_details?: RequestDetails;
  }): WorkRequest {
    const seq = String(state.length + 1).padStart(3, "0");
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const newReq: WorkRequest = {
      request_id: `REQ-${today}-${seq}`,
      status: "open",
      sub_status: "reported",
      reported_time: new Date().toISOString(),
      ...input,
      attachments: input.attachments ?? [],
      request_details: input.request_details,
      status_timeline: [],
      requester_notifications: [],
    };
    const normalized = normalizeRequest(newReq);
    state = [normalized, ...state];
    emit();
    return normalized;
  },
  update(id: string, patch: Partial<WorkRequest>) {
    state = state.map((r) => (r.request_id === id ? { ...r, ...patch } : r));
    emit();
  },
  setAssessmentReport(id: string, assessmentReport: AssessmentReport) {
    this.update(id, { assessment_report: assessmentReport });
  },
  setStatus(
    id: string,
    status: Status,
    technicianId?: string,
    options?: {
      actorName?: string;
      actorRole?: "technician" | "requester" | "system";
      note?: string;
      notifyRequester?: boolean;
      subStatus?: SubStatus;
    },
  ) {
    state = state.map((request) => {
      if (request.request_id !== id) return request;

      const now = new Date().toISOString();
      const actorName = options?.actorName ?? technicianId ?? "ระบบ";
      const actorRole = options?.actorRole ?? "technician";
      const nextTimeline: StatusTimelineEvent[] = [
        ...request.status_timeline,
        {
          event_id: randomId("evt"),
          status,
          updated_by: actorName,
          updated_by_role: actorRole,
          updated_at: now,
          note: options?.note,
        },
      ];

      const shouldNotifyRequester = options?.notifyRequester ?? true;
      const shouldAppendRequesterNotice = shouldNotifyRequester && actorRole === "technician";
      const notifications: RequestNotification[] = shouldAppendRequesterNotice
        ? [
            {
              notification_id: randomId("ntf"),
              message: `งาน ${request.request_id} ถูกอัปเดตเป็น ${STATUS_CHANGE_LABEL[status]} โดย ${actorName}`,
              created_at: now,
              read: false,
            },
            ...request.requester_notifications,
          ]
        : request.requester_notifications;

      return {
        ...request,
        status,
        sub_status: options?.subStatus ?? DEFAULT_SUB_STATUS_BY_STATUS[status],
        ...(technicianId ? { assigned_to: technicianId } : {}),
        status_timeline: nextTimeline,
        requester_notifications: notifications,
      };
    });
    emit();
  },
  markRequesterNotificationsRead(requestId: string, notificationIds: string[]) {
    const idSet = new Set(notificationIds);
    state = state.map((request) => {
      if (request.request_id !== requestId) return request;
      return {
        ...request,
        requester_notifications: request.requester_notifications.map((notification) =>
          idSet.has(notification.notification_id)
            ? { ...notification, read: true }
            : notification,
        ),
      };
    });
    emit();
  },
};

export function useRequests(): WorkRequest[] {
  return useSyncExternalStore(
    (l) => requestStore.subscribe(l),
    () => requestStore.getAll(),
    () => requestStore.getAll(),
  );
}

export function useRequest(id?: string): WorkRequest | undefined {
  const all = useRequests();
  return id ? all.find((r) => r.request_id === id) : undefined;
}
