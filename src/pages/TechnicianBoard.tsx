import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Filter, LayoutGrid, List, LogOut, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { JobCard } from "@/components/JobCard";
import { requestStore, useRequests } from "@/lib/requestStore";
import {
  CATEGORY_LABEL,
  PRIORITY_RANK,
  PRIORITY_LABEL,
  Status,
  STATUS_LABEL,
  SUB_STATUS_LABEL,
  SubStatus,
  WorkRequest,
} from "@/lib/mockData";
import { cn } from "@/lib/utils";

const TECHNICIAN_NAME = "สมศักดิ์ ช่างไฟ";
const STATUS_COLUMNS: { key: Status; title: string; accent: string }[] = [
  { key: "open", title: "เปิดงาน", accent: "border-sky-500 " },
  { key: "assess", title: "ประเมินงาน", accent: "border-amber-500" },
  { key: "waiting", title: "รออะไหล่", accent: "border-rose-500" },
  { key: "doing", title: "กำลังซ่อม", accent: "border-cyan-500" },
  { key: "done", title: "ปิดงาน", accent: "border-orange-500" },
  { key: "qc1", title: "รอตรวจครั้งที่ 1", accent: "border-violet-500" },
  { key: "qc2", title: "รอตรวจครั้งที่ 2", accent: "border-fuchsia-500" },
  { key: "complete", title: "เสร็จสิ้น", accent: "border-emerald-500" },
];

const SUB_STATUS_BY_STATUS: Record<Status, SubStatus> = {
  open: "reported",
  assess: "assessing",
  waiting: "waiting-parts",
  doing: "in-progress",
  done: "closed",
  qc1: "qc-round1",
  qc2: "qc-round2",
  complete: "finished",
};

const searchIndex = (request: WorkRequest) => {
  const details = request.request_details;
  return [
    request.asset_name,
    request.issue_summary,
    request.request_id,
    request.asset_location,
    request.reported_by,
    details?.asset_id,
    details?.asset_type,
    details?.machine_number,
    details?.machine_zone,
    details?.location_building,
    details?.location_floor,
    details?.location_line,
    details?.issue_message,
    details?.reporter_name,
    details?.reporter_department,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export default function TechnicianBoard() {
  const navigate = useNavigate();
  const requests = useRequests();
  const kanbanScrollRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const panStartXRef = useRef(0);
  const panStartScrollLeftRef = useRef(0);
  const currentTech = (JSON.parse(sessionStorage.getItem("fixflow_user") ?? "{}") as { emp_id?: string }).emp_id || "TECH001";
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | WorkRequest["priority"]>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | WorkRequest["category"]>("all");
  const [responsibleFilter, setResponsibleFilter] = useState<"all" | "mine" | "unassigned">("all");
  const [subStatusFilter, setSubStatusFilter] = useState<"all" | SubStatus>("all");
  const [timeSort, setTimeSort] = useState<"reported-desc" | "reported-asc">("reported-desc");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests
      .filter((request) => (priorityFilter === "all" ? true : request.priority === priorityFilter))
      .filter((request) => (categoryFilter === "all" ? true : request.category === categoryFilter))
      .filter((request) =>
        responsibleFilter === "all"
          ? true
          : responsibleFilter === "mine"
          ? request.assigned_to === currentTech
          : !request.assigned_to,
      )
      .filter((request) => (subStatusFilter === "all" ? true : request.sub_status === subStatusFilter))
      .filter((request) => (search.trim() === "" ? true : searchIndex(request).includes(search.toLowerCase())))
      .sort((left, right) => {
        const priorityDiff = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
        if (priorityDiff !== 0) return priorityDiff;

        return timeSort === "reported-desc"
          ? new Date(right.reported_time).getTime() - new Date(left.reported_time).getTime()
          : new Date(left.reported_time).getTime() - new Date(right.reported_time).getTime();
      });
  }, [requests, search, priorityFilter, categoryFilter, responsibleFilter, subStatusFilter, timeSort, currentTech]);

  const counts = useMemo(() => {
    const statusCounts = Object.fromEntries(STATUS_COLUMNS.map((column) => [column.key, 0])) as Record<Status, number>;
    filtered.forEach((request) => {
      statusCounts[request.status] += 1;
    });
    return {
      critical: filtered.filter((request) => request.priority === "critical").length,
      assigned: filtered.filter((request) => request.assigned_to === currentTech).length,
      unassigned: filtered.filter((request) => !request.assigned_to).length,
      ...statusCounts,
    };
  }, [filtered, currentTech]);

  const handleAccept = (id: string) => {
    requestStore.setStatus(id, "assess", currentTech, {
      actorName: TECHNICIAN_NAME,
      note: "ช่างรับงานและเริ่มประเมิน",
      notifyRequester: true,
      subStatus: SUB_STATUS_BY_STATUS.assess,
    });
    toast.success("รับงานสำเร็จ");
    setTimeout(() => navigate(`/assessment/${id}`), 350);
  };

  const handleChangeStatus = (id: string, status: Status, actionLabel: string) => {
    requestStore.setStatus(id, status, currentTech, {
      actorName: TECHNICIAN_NAME,
      note: `อัปเดตเป็น ${STATUS_LABEL[status]} ผ่าน Technician Board`,
      notifyRequester: true,
      subStatus: SUB_STATUS_BY_STATUS[status],
    });
    toast.success(`อัปเดตสถานะเป็น ${actionLabel}`);
  };

  const handleDragStart = (requestId: string) => {
    setDraggedId(requestId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const autoScrollKanbanByPointer = (clientX: number) => {
    if (!draggedId || !kanbanScrollRef.current) return;

    const container = kanbanScrollRef.current;
    const rect = container.getBoundingClientRect();
    const edgeThreshold = 96;
    const maxScrollStep = 26;

    let scrollDelta = 0;
    if (clientX < rect.left + edgeThreshold) {
      const ratio = Math.min(1, (rect.left + edgeThreshold - clientX) / edgeThreshold);
      scrollDelta = -Math.ceil(maxScrollStep * ratio);
    } else if (clientX > rect.right - edgeThreshold) {
      const ratio = Math.min(1, (clientX - (rect.right - edgeThreshold)) / edgeThreshold);
      scrollDelta = Math.ceil(maxScrollStep * ratio);
    }

    if (scrollDelta !== 0) {
      container.scrollLeft += scrollDelta;
    }
  };

  const handleKanbanDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    autoScrollKanbanByPointer(event.clientX);
  };

  const handleKanbanMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !kanbanScrollRef.current) return;

    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a, [role='button'], [draggable='true']")) return;

    isPanningRef.current = true;
    panStartXRef.current = event.clientX;
    panStartScrollLeftRef.current = kanbanScrollRef.current.scrollLeft;
    kanbanScrollRef.current.classList.add("cursor-grabbing");
    event.preventDefault();
  };

  const handleKanbanMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanningRef.current || !kanbanScrollRef.current) return;
    const deltaX = event.clientX - panStartXRef.current;
    kanbanScrollRef.current.scrollLeft = panStartScrollLeftRef.current - deltaX;
  };

  const handleKanbanMouseUp = () => {
    if (!isPanningRef.current || !kanbanScrollRef.current) return;
    isPanningRef.current = false;
    kanbanScrollRef.current.classList.remove("cursor-grabbing");
  };

  const handleDropToStatus = (status: Status) => {
    if (!draggedId) return;
    const request = filtered.find((item) => item.request_id === draggedId);
    if (!request || request.status === status) {
      setDraggedId(null);
      return;
    }
    handleChangeStatus(draggedId, status, STATUS_LABEL[status]);
    setDraggedId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="container py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
            <Wrench className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Technician Board</div>
            <h1 className="font-bold truncate">สมศักดิ์ ช่างไฟ · TECH001</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 relative">
            <Bell className="h-5 w-5" />
            {counts.critical > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-priority-critical priority-pulse" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => navigate("/")} aria-label="ออกจากระบบ">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container py-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหารหัสงาน, เครื่องจักร, อาการ..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 h-10 bg-card"
            />
          </div>
          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as "all" | WorkRequest["priority"]) }>
            <SelectTrigger className="w-[160px] h-10 bg-card">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกความสำคัญ</SelectItem>
              <SelectItem value="critical">🔴 วิกฤติ</SelectItem>
              <SelectItem value="high">🟠 สูง</SelectItem>
              <SelectItem value="medium">🔵 ปานกลาง</SelectItem>
              <SelectItem value="low">⚪ ต่ำ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as "all" | WorkRequest["category"]) }>
            <SelectTrigger className="w-[180px] h-10 bg-card">
              <SelectValue placeholder="ทุกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={responsibleFilter} onValueChange={(value) => setResponsibleFilter(value as "all" | "mine" | "unassigned") }>
            <SelectTrigger className="w-[160px] h-10 bg-card">
              <SelectValue placeholder="ผู้รับผิดชอบ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกงาน</SelectItem>
              <SelectItem value="mine">งานของฉัน</SelectItem>
              <SelectItem value="unassigned">ยังไม่รับงาน</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subStatusFilter} onValueChange={(value) => setSubStatusFilter(value as "all" | SubStatus) }>
            <SelectTrigger className="w-[170px] h-10 bg-card">
              <SelectValue placeholder="สถานะย่อย" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะย่อย</SelectItem>
              {Object.entries(SUB_STATUS_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeSort} onValueChange={(value) => setTimeSort(value as "reported-desc" | "reported-asc") }>
            <SelectTrigger className="w-[170px] h-10 bg-card">
              <SelectValue placeholder="เรียงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reported-desc">ใหม่สุดก่อน</SelectItem>
              <SelectItem value="reported-asc">เก่าสุดก่อน</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto inline-flex items-center rounded-md border bg-card p-1">
            <Button variant={view === "kanban" ? "industrial" : "ghost"} size="sm" onClick={() => setView("kanban") }>
              <LayoutGrid className="mr-1 h-4 w-4" />
              Kanban
            </Button>
            <Button variant={view === "list" ? "industrial" : "ghost"} size="sm" onClick={() => setView("list") }>
              <List className="mr-1 h-4 w-4" />
              List
            </Button>
          </div>
        </div>

        {view === "kanban" ? (
          <div
            ref={kanbanScrollRef}
            className="flex gap-4 overflow-x-auto pb-3 cursor-grab"
            onDragOver={handleKanbanDragOver}
            onMouseDown={handleKanbanMouseDown}
            onMouseMove={handleKanbanMouseMove}
            onMouseUp={handleKanbanMouseUp}
            onMouseLeave={handleKanbanMouseUp}
          >
            {STATUS_COLUMNS.map((column) => {
              const columnRequests = filtered.filter((request) => request.status === column.key);
              return (
                <Card
                  key={column.key}
                  className={cn(
                    "flex-none w-[20rem] rounded-xl border-t-4 bg-card/80 shadow-sm",
                    column.accent,
                  )}
                  onDragOver={handleKanbanDragOver}
                  onDrop={() => handleDropToStatus(column.key)}
                >
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{STATUS_LABEL[column.key]}</div>
                        <h2 className="font-semibold">{column.title}</h2>
                      </div>
                      <div className="h-8 min-w-8 rounded-full bg-muted px-2 text-sm font-semibold grid place-items-center">
                        {columnRequests.length}
                      </div>
                    </div>

                    <div className="space-y-3 min-h-[18rem]">
                      {columnRequests.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                          ลากการ์ดมาวางที่คอลัมน์นี้
                        </div>
                      ) : (
                        columnRequests.map((request) => (
                          <JobCard
                            key={request.request_id}
                            request={request}
                            onOpen={(id) => navigate(`/assessment/${id}`)}
                            onAccept={handleAccept}
                            onChangeStatus={handleChangeStatus}
                            showAccept={column.key === "open"}
                            showQuickActions={column.key !== "open" && column.key !== "complete"}
                            draggable
                            onDragStart={() => handleDragStart(request.request_id)}
                            onDragEnd={handleDragEnd}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((request) => (
              <JobCard
                key={request.request_id}
                request={request}
                onOpen={(id) => navigate(`/assessment/${id}`)}
                onAccept={handleAccept}
                onChangeStatus={handleChangeStatus}
                draggable
                onDragStart={() => handleDragStart(request.request_id)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className={cn(
        "min-w-[8.5rem] rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-3 backdrop-blur-sm",
        accent,
      )}
    >
      <span className="font-medium truncate">{label}</span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}
