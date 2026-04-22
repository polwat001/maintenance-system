import { useSyncExternalStore } from "react";
import { MOCK_REQUESTS, Priority, Status, WorkRequest } from "./mockData";

type Listener = () => void;

let state: WorkRequest[] = [...MOCK_REQUESTS];
const listeners = new Set<Listener>();

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
  }): WorkRequest {
    const seq = String(state.length + 1).padStart(3, "0");
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const newReq: WorkRequest = {
      request_id: `REQ-${today}-${seq}`,
      status: "new",
      reported_time: new Date().toISOString(),
      ...input,
    };
    state = [newReq, ...state];
    emit();
    return newReq;
  },
  update(id: string, patch: Partial<WorkRequest>) {
    state = state.map((r) => (r.request_id === id ? { ...r, ...patch } : r));
    emit();
  },
  setStatus(id: string, status: Status, technicianId?: string) {
    this.update(id, { status, ...(technicianId ? { assigned_to: technicianId } : {}) });
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
