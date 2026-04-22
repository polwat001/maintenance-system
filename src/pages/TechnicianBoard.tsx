import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PRIORITY_RANK,
  Priority,
  Status,
} from "@/lib/mockData";
import { requestStore, useRequests } from "@/lib/requestStore";
import { JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wrench, LogOut, Search, LayoutGrid, List, Filter, Bell } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const STATUS_COLUMNS: { key: Status; title: string; accent: string }[] = [
  { key: "new", title: "งานใหม่ · พร้อมรับ", accent: "border-t-status-new" },
  { key: "doing", title: "กำลังซ่อม", accent: "border-t-status-doing" },
  { key: "waiting", title: "รออะไหล่", accent: "border-t-status-waiting" },
];

const TechnicianBoard = () => {
  const navigate = useNavigate();
  const requests = useRequests();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const filtered = useMemo(() => {
    return requests
      .filter((r) =>
        priorityFilter === "all" ? true : r.priority === priorityFilter,
      )
      .filter((r) =>
        search.trim() === ""
          ? true
          : (r.asset_name + r.issue_summary + r.request_id)
              .toLowerCase()
              .includes(search.toLowerCase()),
      )
      .sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          new Date(a.reported_time).getTime() - new Date(b.reported_time).getTime(),
      );
  }, [requests, search, priorityFilter]);

  const handleAccept = (id: string) => {
    requestStore.setStatus(id, "doing", "TECH001");
    toast.success("รับงานสำเร็จ — กำลังเปิดฟอร์มประเมิน");
    setTimeout(() => navigate(`/assessment/${id}`), 400);
  };

  const handleOpen = (id: string) => navigate(`/assessment/${id}`);

  const counts = {
    critical: requests.filter((r) => r.priority === "critical" && r.status === "new").length,
    new: requests.filter((r) => r.status === "new").length,
    doing: requests.filter((r) => r.status === "doing").length,
    waiting: requests.filter((r) => r.status === "waiting").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="container py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
            <Wrench className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">
              Technician Board
            </div>
            <h1 className="font-bold truncate">สมศักดิ์ ช่างไฟ · TECH001</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 relative">
            <Bell className="h-5 w-5" />
            {counts.critical > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-priority-critical priority-pulse" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10"
            onClick={() => navigate("/")}
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats strip */}
        <div className="container pb-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="วิกฤติ" value={counts.critical} accent="text-priority-critical bg-white" />
          <Stat label="งานใหม่" value={counts.new} accent="text-status-new bg-white" />
          <Stat label="กำลังซ่อม" value={counts.doing} accent="text-status-doing bg-white" />
          <Stat label="รออะไหล่" value={counts.waiting} accent="text-status-waiting bg-white" />
        </div>
      </header>

      {/* Toolbar */}
      <div className="container py-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหารหัสงาน, เครื่องจักร, อาการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card"
          />
        </div>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | "all")}>
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
        <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")} className="hidden md:block">
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-1" /> List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Board */}
      <main className="container pb-24">
        {/* Mobile: single list */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((r) => (
              <JobCard key={r.request_id} request={r} onAccept={handleAccept} onOpen={handleOpen} />
            ))
          )}
        </div>

        {/* Desktop kanban */}
        {view === "kanban" ? (
          <div className="hidden md:grid grid-cols-3 gap-4">
            {STATUS_COLUMNS.map((col) => {
              const items = filtered.filter((r) => r.status === col.key);
              return (
                <section
                  key={col.key}
                  className={`rounded-lg bg-muted/40 border-t-4 ${col.accent} p-3 min-h-[60vh]`}
                >
                  <header className="flex items-center justify-between mb-3 px-1">
                    <h2 className="font-semibold text-sm uppercase tracking-wide">
                      {col.title}
                    </h2>
                    <span className="text-xs font-mono bg-card px-2 py-0.5 rounded border border-border">
                      {items.length}
                    </span>
                  </header>
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-8">
                        ไม่มีงานในสถานะนี้
                      </p>
                    ) : (
                      items.map((r) => (
                        <JobCard
                          key={r.request_id}
                          request={r}
                          onAccept={handleAccept}
                          onOpen={handleOpen}
                          showAccept={col.key === "new"}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((r) => (
              <JobCard key={r.request_id} request={r} onAccept={handleAccept} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-md py-1.5 px-2 ${accent}`}>
      <div className="text-xl font-bold leading-tight tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>ไม่พบงานที่ตรงกับเงื่อนไข</p>
    </div>
  );
}

export default TechnicianBoard;
