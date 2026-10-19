import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { requestStore, useRequests } from "@/lib/requestStore";
import { timeAgo } from "@/lib/mockData";
import { ArrowLeft, Bell, CheckCheck, CircleDot, LogOut } from "lucide-react";

const FALLBACK_REQUESTER_NAME = "นภดล ฝ่ายผลิต";

const normalizeName = (name: string) => name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

interface NotificationItem {
  requestId: string;
  status: import("@/lib/mockData").Status;
  message: string;
  createdAt: string;
  read: boolean;
  notificationId: string;
}

const NotificationCenter = () => {
  const navigate = useNavigate();
  const allRequests = useRequests();
  const [view, setView] = useState<"all" | "unread">("all");
  const sessionUser = JSON.parse(sessionStorage.getItem("fixflow_user") ?? "{}") as {
    name?: string;
    emp_id?: string;
  };
  const currentUserName = sessionUser.name || FALLBACK_REQUESTER_NAME;
  const currentUserId = sessionUser.emp_id || "REQ042";

  const myRequests = useMemo(
    () =>
      allRequests.filter((request) =>
        request.reported_by_id
          ? request.reported_by_id === currentUserId
          : normalizeName(request.reported_by).includes(normalizeName(currentUserName)),
      ),
    [allRequests, currentUserId, currentUserName],
  );

  const notifications = useMemo(() => {
    const rows: NotificationItem[] = myRequests.flatMap((request) =>
      request.requester_notifications.map((notification) => ({
        requestId: request.request_id,
        status: request.status,
        message: notification.message,
        createdAt: notification.created_at,
        read: notification.read,
        notificationId: notification.notification_id,
      })),
    );

    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return view === "unread" ? rows.filter((row) => !row.read) : rows;
  }, [myRequests, view]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const markAsRead = (item: NotificationItem) => {
    if (item.read) return;
    requestStore.markRequesterNotificationsRead(item.requestId, [item.notificationId]);
  };

  const markAllAsRead = () => {
    myRequests.forEach((request) => {
      const unreadIds = request.requester_notifications
        .filter((notification) => !notification.read)
        .map((notification) => notification.notification_id);
      if (unreadIds.length > 0) {
        requestStore.markRequesterNotificationsRead(request.request_id, unreadIds);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="container py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10"
            onClick={() => navigate("/request")}
            aria-label="กลับ"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Requester · Notifications</div>
            <h1 className="font-bold truncate">Notification Center</h1>
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

      <main className="container pt-6 space-y-4">
        <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <h2 className="font-semibold">การแจ้งเตือนของฉัน</h2>
            <p className="text-xs text-muted-foreground">ติดตามสถานะเมื่อช่างรับงานหรืออัปเดตงานซ่อม</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === "all" ? "default" : "outline"} size="sm" onClick={() => setView("all")}>
              ทั้งหมด
            </Button>
            <Button variant={view === "unread" ? "default" : "outline"} size="sm" onClick={() => setView("unread")}>
              ยังไม่อ่าน
            </Button>
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              อ่านทั้งหมด
            </Button>
          </div>
        </Card>

        {notifications.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <Bell className="h-9 w-9 mx-auto mb-2 opacity-35" />
            <p className="text-sm">ยังไม่มีรายการแจ้งเตือน</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <Card
                key={item.notificationId}
                className={`p-4 transition-shadow hover:shadow-card ${
                  item.read ? "bg-card" : "bg-secondary/10 border-secondary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{item.requestId}</span>
                      {!item.read && (
                        <span className="inline-flex items-center gap-1 text-secondary font-semibold">
                          <CircleDot className="h-3 w-3" /> ใหม่
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                  {!item.read && (
                    <Button size="sm" variant="outline" onClick={() => markAsRead(item)}>
                      อ่านแล้ว
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {unreadCount > 0 && (
          <div className="text-xs text-muted-foreground text-right">คงเหลือยังไม่อ่าน {unreadCount} รายการ</div>
        )}
      </main>
    </div>
  );
};

export default NotificationCenter;
