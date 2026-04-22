import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  CATEGORY_LABEL,
  Priority,
  PRIORITY_LABEL,
  timeAgo,
  WorkRequest,
} from "@/lib/mockData";
import { requestStore, useRequests } from "@/lib/requestStore";
import {
  AlertCircle,
  Building2,
  Camera,
  ClipboardList,
  Cpu,
  Droplets,
  LogOut,
  MapPin,
  Send,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: { value: WorkRequest["category"]; label: string; icon: typeof Zap }[] = [
  { value: "electrical", label: "ไฟฟ้า", icon: Zap },
  { value: "mechanical", label: "เครื่องกล", icon: Wrench },
  { value: "facility", label: "อาคาร", icon: Building2 },
  { value: "plumbing", label: "ประปา", icon: Droplets },
  { value: "it", label: "ไอที", icon: Cpu },
];

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

const REQUESTER_NAME = "นภดล ฝ่ายผลิต";

const RequestForm = () => {
  const navigate = useNavigate();
  const allRequests = useRequests();

  const [assetName, setAssetName] = useState("");
  const [location, setLocation] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<WorkRequest["category"]>("mechanical");

  const myRequests = useMemo(
    () =>
      allRequests
        .filter((r) => r.reported_by === REQUESTER_NAME)
        .sort(
          (a, b) =>
            new Date(b.reported_time).getTime() - new Date(a.reported_time).getTime(),
        ),
    [allRequests],
  );

  const reset = () => {
    setAssetName("");
    setLocation("");
    setIssue("");
    setPriority("medium");
    setCategory("mechanical");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !location.trim() || !issue.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    const created = requestStore.add({
      asset_name: assetName.trim(),
      asset_location: location.trim(),
      issue_summary: issue.trim(),
      priority,
      category,
      reported_by: REQUESTER_NAME,
    });
    toast.success(`ส่งคำขอสำเร็จ — ${created.request_id}`, {
      description: "งานถูกส่งเข้ากระดานช่างเรียบร้อยแล้ว",
    });
    reset();
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="container py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
            <ClipboardList className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">
              Requester · แจ้งซ่อม
            </div>
            <h1 className="font-bold truncate">{REQUESTER_NAME} · REQ042</h1>
          </div>
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
      </header>

      <main className="container pt-6 grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Form */}
        <Card className="p-5 sm:p-6 bg-gradient-card shadow-card animate-slide-up">
          <header className="flex items-center gap-2 mb-5 pb-4 border-b">
            <AlertCircle className="h-5 w-5 text-secondary" />
            <div>
              <h2 className="font-semibold">แจ้งปัญหา / คำขอซ่อมใหม่</h2>
              <p className="text-xs text-muted-foreground">
                ระบุข้อมูลให้ละเอียดเพื่อให้ช่างประเมินและรับงานได้รวดเร็ว
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider">หมวดหมู่ปัญหา</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`p-3 rounded-md border-2 flex flex-col items-center gap-1.5 transition-all ${
                        active
                          ? "border-primary bg-primary/5 shadow-card"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          active ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-xs font-medium">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asset & location */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="asset" className="text-xs">
                  เครื่องจักร / รหัสทรัพย์สิน <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="asset"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="เช่น MCH-PR-2041"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc" className="text-xs">
                  ตำแหน่ง / พื้นที่ <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="เช่น อาคาร B ชั้น 2 Line 3"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Issue */}
            <div className="space-y-1.5">
              <Label htmlFor="issue" className="text-xs">
                อาการ / รายละเอียดปัญหา <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="issue"
                rows={4}
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="อธิบายอาการที่พบ เช่น เสียง กลิ่น พฤติกรรมผิดปกติ ช่วงเวลาที่เกิด ฯลฯ"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider">ระดับความสำคัญ</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRIORITIES.map((p) => {
                  const active = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`p-3 rounded-md border-2 text-left transition-all ${
                        active
                          ? `border-priority-${p} bg-priority-${p}/5 shadow-card`
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <PriorityBadge priority={p} />
                      <div className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
                        {p === "critical" && "หยุดผลิต / ไม่ปลอดภัย"}
                        {p === "high" && "กระทบงานหลัก เร่งด่วน"}
                        {p === "medium" && "เสื่อมประสิทธิภาพ"}
                        {p === "low" && "รอจัดคิวได้"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo (mock) */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-md border-2 border-dashed border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Camera className="h-4 w-4" />
                แนบรูปถ่ายอาการ (ไม่บังคับ)
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toast.info("เปิดกล้องเพื่อถ่ายภาพ (เดโม)")}
              >
                ถ่ายรูป
              </Button>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={reset} className="sm:w-auto">
                ล้างข้อมูล
              </Button>
              <Button type="submit" variant="hero" size="lg" className="flex-1">
                <Send className="h-4 w-4 mr-1" />
                ส่งคำขอแจ้งซ่อม
              </Button>
            </div>
          </form>
        </Card>

        {/* My requests */}
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <header className="flex items-center justify-between">
            <h3 className="font-semibold">รายการที่ฉันแจ้ง</h3>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
              {myRequests.length}
            </span>
          </header>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {myRequests.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                ยังไม่มีคำขอที่แจ้ง
              </Card>
            ) : (
              myRequests.map((r) => (
                <Card
                  key={r.request_id}
                  className="p-3 space-y-1.5 animate-slide-up hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {r.request_id}
                    </span>
                    <PriorityBadge priority={r.priority} className="text-[10px] px-1.5 py-0.5" />
                  </div>
                  <div className="font-medium text-sm truncate">{r.asset_name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {r.issue_summary}
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                    <StatusBadge status={r.status} />
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(r.reported_time)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default RequestForm;
