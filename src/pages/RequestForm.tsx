import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Priority,
  RequestAttachment,
  RequestDetails,
  timeAgo,
  WorkRequest,
} from "@/lib/mockData";
import { requestStore, useRequests } from "@/lib/requestStore";
import {
  AlertCircle,
  Bell,
  Camera,
  ClipboardList,
  Clock3,
  Factory,
  FileText,
  Gauge,
  ImagePlus,
  History,
  LogOut,
  PencilLine,
  MapPin,
  Paperclip,
  ShieldAlert,
  SlidersHorizontal,
  Send,
  TriangleAlert,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";
import jsQR from "jsqr";
import { toast } from "sonner";

const CATEGORIES: { value: WorkRequest["category"]; label: string; icon: typeof Zap }[] = [
  { value: "electrical-control", label: "ไฟฟ้า / ระบบควบคุม", icon: Zap },
  { value: "mechanical", label: "เครื่องกล", icon: Wrench },
  { value: "pneumatic-hydraulic", label: "ระบบลม / ไฮดรอลิก", icon: Gauge },
  { value: "lubrication-fluid", label: "ระบบหล่อลื่น / ของไหล", icon: Waves },
  { value: "other", label: "อื่น ๆ", icon: SlidersHorizontal },
];

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

const REQUESTER_NAME = "นภดล ฝ่ายผลิต";

const QR_ASSET_CATALOG: Array<{
  qr_code: string;
  asset_id: string;
  asset_type: string;
  machine_number: string;
  machine_zone: string;
  location_building: string;
  location_floor: string;
  location_line: string;
  access_required: boolean;
  access_time_window: string;
  reported_date_from_qr: string;
  reported_time_from_qr: string;
  suggested_job_type: WorkRequest["category"];
}> = [
  {
    qr_code: "QR://MCH-PR-2041",
    asset_id: "MCH-PR-2041",
    asset_type: "Hydraulic Press",
    machine_number: "HP-2041",
    machine_zone: "ZONE-B2",
    location_building: "อาคาร B",
    location_floor: "ชั้น 2",
    location_line: "Line 3",
    access_required: true,
    access_time_window: "08:00-17:00",
    reported_date_from_qr: new Date().toISOString().slice(0, 10),
    reported_time_from_qr: new Date().toTimeString().slice(0, 5),
    suggested_job_type: "mechanical",
  },
  {
    qr_code: "QR://ELC-DB-5510",
    asset_id: "ELC-DB-5510",
    asset_type: "ตู้ควบคุมไฟฟ้า",
    machine_number: "DB-5510",
    machine_zone: "ELECTRICAL-ROOM",
    location_building: "อาคาร B",
    location_floor: "ชั้น 2",
    location_line: "ห้องไฟฟ้า",
    access_required: true,
    access_time_window: "09:00-16:30",
    reported_date_from_qr: new Date().toISOString().slice(0, 10),
    reported_time_from_qr: new Date().toTimeString().slice(0, 5),
    suggested_job_type: "electrical-control",
  },
  {
    qr_code: "QR://CNV-ASSY-08",
    asset_id: "CNV-ASSY-08",
    asset_type: "Conveyor Assembly",
    machine_number: "CNV-08",
    machine_zone: "ASSEMBLY",
    location_building: "อาคารผลิตหลัก",
    location_floor: "ชั้น 1",
    location_line: "Assembly #8",
    access_required: false,
    access_time_window: "เข้าได้ตลอดเวลา",
    reported_date_from_qr: new Date().toISOString().slice(0, 10),
    reported_time_from_qr: new Date().toTimeString().slice(0, 5),
    suggested_job_type: "mechanical",
  },
];

const normalizeName = (name: string) => name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

type QRDetector = {
  detect: (input: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  onSuccess: (stream: MediaStream) => void,
  onError: (error: DOMException) => void,
) => void;

type SymptomType = RequestDetails["issue_symptom"];
type FrequencyType = RequestDetails["issue_frequency"];
type OperabilityType = RequestDetails["machine_operability"];

const RequestForm = () => {
  const navigate = useNavigate();
  const allRequests = useRequests();
  const currentUser = JSON.parse(sessionStorage.getItem("fixflow_user") ?? "{}") as {
    name?: string;
    department?: string;
    emp_id?: string;
  };
  const currentUserName = currentUser.name || REQUESTER_NAME;
  const currentUserId = currentUser.emp_id || "REQ042";
  const currentDepartment = currentUser.department || "ฝ่ายผลิต";
  const photoInputRef = useRef<HTMLInputElement>(null);
  const qrImageInputRef = useRef<HTMLInputElement>(null);
  const toastedNotificationIdsRef = useRef<Set<string>>(new Set());

  const [assetId, setAssetId] = useState("");
  const [assetType, setAssetType] = useState("");
  const [machineNumber, setMachineNumber] = useState("");
  const [machineZone, setMachineZone] = useState("");
  const [locationBuilding, setLocationBuilding] = useState("");
  const [locationFloor, setLocationFloor] = useState("");
  const [locationLine, setLocationLine] = useState("");
  const [accessRequired, setAccessRequired] = useState<boolean>(false);
  const [accessTimeWindow, setAccessTimeWindow] = useState("");
  const [reportedDateFromQr, setReportedDateFromQr] = useState("");
  const [reportedTimeFromQr, setReportedTimeFromQr] = useState("");
  const [issueMessage, setIssueMessage] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [symptom, setSymptom] = useState<SymptomType>("other");
  const [frequency, setFrequency] = useState<FrequencyType>("first-time");
  const [operability, setOperability] = useState<OperabilityType>("operable");
  const [additionalNote, setAdditionalNote] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [category, setCategory] = useState<WorkRequest["category"] | "">("");
  const [qrManualInput, setQrManualInput] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [imageScanLoading, setImageScanLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<QRDetector | null>(null);

  const myRequests = useMemo(
    () =>
      allRequests
        .filter((r) =>
          r.reported_by_id
            ? r.reported_by_id === currentUserId
            : normalizeName(r.reported_by).includes(normalizeName(currentUserName)),
        )
        .sort(
          (a, b) =>
            new Date(b.reported_time).getTime() - new Date(a.reported_time).getTime(),
        ),
    [allRequests, currentUserId, currentUserName],
  );

  const unreadCount = useMemo(
    () =>
      myRequests.reduce(
        (acc, request) =>
          acc + request.requester_notifications.filter((notification) => !notification.read).length,
        0,
      ),
    [myRequests],
  );

  const filteredQrAssets = useMemo(() => {
    const q = qrManualInput.trim().toLowerCase();
    if (!q) return [];
    return QR_ASSET_CATALOG.filter((asset) =>
      [
        asset.qr_code,
        asset.asset_id,
        asset.asset_type,
        asset.machine_number,
        asset.machine_zone,
        asset.location_building,
        asset.location_floor,
        asset.location_line,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    ).slice(0, 6);
  }, [qrManualInput]);

  useEffect(() => {
    const unread = myRequests
      .flatMap((request) => request.requester_notifications)
      .filter((notification) => !notification.read)
      .filter((notification) => !toastedNotificationIdsRef.current.has(notification.notification_id));

    if (unread.length === 0) return;

    unread.forEach((notification) => {
      toastedNotificationIdsRef.current.add(notification.notification_id);
        toast.info(notification.message, {
          description: `อัปเดตเมื่อ ${timeAgo(notification.created_at)}`,
        });
    });
  }, [myRequests]);

  const reset = () => {
    setAssetId("");
    setAssetType("");
    setMachineNumber("");
    setMachineZone("");
    setLocationBuilding("");
    setLocationFloor("");
    setLocationLine("");
    setAccessRequired(false);
    setAccessTimeWindow("");
    setReportedDateFromQr("");
    setReportedTimeFromQr("");
    setIssueMessage("");
    setIssueDescription("");
    setSymptom("other");
    setFrequency("first-time");
    setOperability("operable");
    setAdditionalNote("");
    setPriority("");
    setCategory("");
    setQrManualInput("");
    setManualEntry(false);
    setAttachments([]);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const resetForNewScan = () => {
    setAssetId("");
    setAssetType("");
    setMachineNumber("");
    setMachineZone("");
    setLocationBuilding("");
    setLocationFloor("");
    setLocationLine("");
    setAccessRequired(false);
    setAccessTimeWindow("");
    setReportedDateFromQr("");
    setReportedTimeFromQr("");
    setIssueMessage("");
    setIssueDescription("");
    setSymptom("other");
    setFrequency("first-time");
    setOperability("operable");
    setAdditionalNote("");
    setPriority("");
    setCategory("");
    setAttachments([]);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handlePickPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nextFiles = Array.from(files).slice(0, 6);
    const mapped = await Promise.all(
      nextFiles.map(async (file) => ({
        attachment_id: `att-${Math.random().toString(36).slice(2, 10)}`,
        name: file.name,
        url: await toDataUrl(file),
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
        uploaded_by: currentUserName,
      })),
    );

    setAttachments((prev) => [...prev, ...mapped].slice(0, 6));
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.attachment_id !== attachmentId));
  };

  const handlePickQrImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setImageScanLoading(true);
    try {
      const imageUrl = await toDataUrl(file);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
        img.src = imageUrl;
      });

      const tryScales = [1, 0.75, 0.5, 0.33];
      let decodedValue = "";

      for (const scale of tryScales) {
        const width = Math.max(1, Math.floor(image.naturalWidth * scale));
        const height = Math.max(1, Math.floor(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) continue;

        context.drawImage(image, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        const decoded = jsQR(imageData.data, width, height, {
          inversionAttempts: "attemptBoth",
        });

        if (decoded?.data) {
          decodedValue = decoded.data.trim();
          break;
        }
      }

      if (!decodedValue) {
        toast.error("ไม่พบ QR Code ในรูปภาพที่เลือก");
        return;
      }

      applyScanResult(decodedValue);
    } catch {
      toast.error("ไม่สามารถอ่านรูปภาพเพื่อสแกน QR ได้");
    } finally {
      setImageScanLoading(false);
      if (qrImageInputRef.current) {
        qrImageInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !assetId.trim() ||
      !assetType.trim() ||
      !machineNumber.trim() ||
      !machineZone.trim() ||
      !locationBuilding.trim() ||
      !locationFloor.trim() ||
      !locationLine.trim()
    ) {
      toast.error("กรุณากรอกข้อมูลเครื่องจักรให้ครบ (หรือสแกน QR)");
      return;
    }
    if (!category || !priority || !issueMessage.trim() || !issueDescription.trim()) {
      toast.error("กรุณากรอกข้อมูลงานซ่อมและอาการให้ครบ");
      return;
    }

    const location = `${locationBuilding} / ${locationFloor} / ${locationLine}`;
    const details: RequestDetails = {
      asset_id: assetId.trim(),
      asset_type: assetType.trim(),
      machine_number: machineNumber.trim(),
      machine_zone: machineZone.trim(),
      location_building: locationBuilding.trim(),
      location_floor: locationFloor.trim(),
      location_line: locationLine.trim(),
      access_required: accessRequired,
      access_time_window: accessTimeWindow.trim(),
      job_type: category,
      reported_date_from_qr: reportedDateFromQr,
      reported_time_from_qr: reportedTimeFromQr,
      issue_message: issueMessage.trim(),
      issue_symptom: symptom,
      issue_frequency: frequency,
      machine_operability: operability,
      reporter_name: currentUserName,
      reporter_emp_id: currentUserId,
      reporter_department: currentDepartment,
      additional_note: additionalNote.trim(),
    };

    const created = requestStore.add({
      asset_name: `${assetId.trim()} · ${assetType.trim()}`,
      asset_location: location,
      issue_summary: `${issueMessage.trim()} — ${issueDescription.trim()}`,
      priority,
      category,
      reported_by: currentUserName,
      reported_by_id: currentUserId,
      reported_by_department: currentDepartment,
      attachments,
      request_details: details,
    });
    toast.success(`ส่งคำขอสำเร็จ — ${created.request_id}`, {
      description: "งานถูกส่งเข้ากระดานช่างเรียบร้อยแล้ว",
    });
    reset();
  };

  const applyScanResult = (qrValue: string) => {
    const selected = QR_ASSET_CATALOG.find((item) => item.qr_code === qrValue);
    if (!selected) {
      setQrManualInput(qrValue);
      toast.error(`สแกน QR ได้แล้ว แต่ยังไม่พบข้อมูลอุปกรณ์สำหรับ: ${qrValue}`);
      return;
    }

    setQrManualInput(selected.qr_code);
    resetForNewScan();
    setAssetId(selected.asset_id);
    setAssetType(selected.asset_type);
    setMachineNumber(selected.machine_number);
    setMachineZone(selected.machine_zone);
    setLocationBuilding(selected.location_building);
    setLocationFloor(selected.location_floor);
    setLocationLine(selected.location_line);
    setAccessRequired(selected.access_required);
    setAccessTimeWindow(selected.access_time_window);
    setReportedDateFromQr(selected.reported_date_from_qr);
    setReportedTimeFromQr(selected.reported_time_from_qr);
    setCategory(selected.suggested_job_type);
    setManualEntry(false);
    toast.success(`สแกนสำเร็จ: ${selected.qr_code}`);
  };

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    detectorRef.current = null;
    setCameraReady(false);
  };

  const scanFrame = async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => {
        void scanFrame();
      });
      return;
    }

    let rawValue: string | undefined;

    try {
      if (detector) {
        const codes = await detector.detect(video);
        rawValue = codes.find((code) => !!code.rawValue)?.rawValue;
      }
    } catch {
      // Ignore frame-level decode errors and continue scanning.
    }

    if (!rawValue) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width > 0 && height > 0) {
        const canvas = canvasRef.current ?? document.createElement("canvas");
        canvasRef.current = canvas;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, width, height);
          const imageData = context.getImageData(0, 0, width, height);
          const decoded = jsQR(imageData.data, width, height, {
            inversionAttempts: "attemptBoth",
          });
          rawValue = decoded?.data;
        }
      }
    }

    if (rawValue) {
      applyScanResult(rawValue.trim());
      setCameraOpen(false);
      stopCamera();
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      void scanFrame();
    });
  };

  const refreshCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      setCameraDevices(videoInputs);
      setSelectedCameraId((prev) => {
        if (prev && videoInputs.some((device) => device.deviceId === prev)) {
          return prev;
        }
        return videoInputs[0]?.deviceId ?? "";
      });
    } catch {
      // Ignore enumerate failure and keep current camera list.
    }
  };

  const openCameraScanner = async (preferredCameraId?: string) => {
    stopCamera();
    setCameraError("");
    setCameraLoading(true);

    const isSecure =
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      setCameraError("ต้องเปิดผ่าน HTTPS หรือ localhost จึงจะใช้กล้องได้");
      setCameraOpen(true);
      return;
    }

    const legacyGetUserMedia =
      navigator.getUserMedia ||
      (navigator as Navigator & { webkitGetUserMedia?: LegacyGetUserMedia }).webkitGetUserMedia ||
      (navigator as Navigator & { mozGetUserMedia?: LegacyGetUserMedia }).mozGetUserMedia ||
      (navigator as Navigator & { msGetUserMedia?: LegacyGetUserMedia }).msGetUserMedia;

    const getStream = (constraints: MediaStreamConstraints) => {
      if (navigator.mediaDevices?.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
      }
      if (legacyGetUserMedia) {
        return new Promise<MediaStream>((resolve, reject) => {
          legacyGetUserMedia(
            constraints,
            (stream) => resolve(stream),
            (error) => reject(error),
          );
        });
      }
      return Promise.reject(new Error("GET_USER_MEDIA_NOT_SUPPORTED"));
    };

    if (!navigator.mediaDevices?.getUserMedia && !legacyGetUserMedia) {
      setCameraError("เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง");
      setCameraOpen(true);
      return;
    }

    const DetectorCtor = (window as Window & {
      BarcodeDetector?: new (options: { formats: string[] }) => QRDetector;
    }).BarcodeDetector;

    try {
      let stream: MediaStream;
      try {
        const preferredConstraints = preferredCameraId
          ? { deviceId: { exact: preferredCameraId } }
          : { facingMode: { ideal: "environment" } };

        stream = await getStream({
          video: preferredConstraints,
        });
      } catch {
        // Fallback for devices/browsers that cannot satisfy facingMode constraint.
        stream = await getStream({ video: true });
      }

      detectorRef.current = DetectorCtor
        ? new DetectorCtor({ formats: ["qr_code"] })
        : null;
      streamRef.current = stream;
      setCameraOpen(true);
      void refreshCameraDevices();

      const activeTrack = stream.getVideoTracks()[0];
      const activeDeviceId = activeTrack?.getSettings().deviceId;
      if (activeDeviceId) {
        setSelectedCameraId(activeDeviceId);
      }

      setTimeout(() => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;
        video.srcObject = streamRef.current;
        void video.play();
        setCameraReady(true);
        void scanFrame();
      }, 0);
    } catch (error) {
      const domError = error as DOMException | undefined;
      if (domError?.name === "NotAllowedError" || domError?.name === "PermissionDeniedError") {
        setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องในเบราว์เซอร์");
      } else if (domError?.name === "NotFoundError") {
        setCameraError("ไม่พบอุปกรณ์กล้องบนเครื่องนี้");
      } else if (domError?.name === "NotReadableError") {
        setCameraError("กล้องกำลังถูกใช้งานโดยแอปอื่น กรุณาปิดแอปนั้นแล้วลองใหม่");
      } else {
        setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์และการเชื่อมต่อกล้อง");
      }
      setCameraOpen(true);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleCameraSelection = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    void openCameraScanner(deviceId);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16 ">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center shrink-0">
            <ClipboardList className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70">
              Requester · แจ้งซ่อม
            </div>
            <h1 className="font-bold truncate">{currentUserName} · {currentUserId}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 relative"
            onClick={() => navigate("/notifications")}
            aria-label="ศูนย์แจ้งเตือน"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] leading-4 text-center px-1">
                {Math.min(unreadCount, 99)}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 relative"
            onClick={() => setHistoryOpen((prev) => !prev)}
            aria-label="ดูประวัติรายการที่ฉันแจ้ง"
          >
            <History className="h-5 w-5" />
            {myRequests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] leading-4 text-center px-1">
                {Math.min(myRequests.length, 99)}
              </span>
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
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 pt-6 grid  gap-0">
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
            {/* QR scan / auto-fill */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider">กรอกรหัส QR เพื่อค้นหาอัตโนมัติ</Label>
              <div className="space-y-2">
                <Input
                  value={qrManualInput}
                  onChange={(e) => setQrManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredQrAssets[0]) {
                      e.preventDefault();
                      applyScanResult(filteredQrAssets[0].qr_code);
                    }
                  }}
                  placeholder="กรอกรหัส QR เอง เช่น QR://MCH-PR-2041"
                />
                {filteredQrAssets.length > 0 && (
                  <div className="rounded-md border border-border divide-y bg-card">
                    {filteredQrAssets.map((asset) => (
                      <button
                        key={asset.qr_code}
                        type="button"
                        onClick={() => applyScanResult(asset.qr_code)}
                        className="w-full px-3 py-2 text-left hover:bg-muted/70 transition-colors"
                      >
                        <div className="text-xs font-mono text-muted-foreground">{asset.qr_code}</div>
                        <div className="text-sm font-medium">{asset.asset_id} · {asset.asset_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {asset.location_building} / {asset.location_floor} / {asset.location_line}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <input
                    ref={qrImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handlePickQrImage(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={imageScanLoading}
                    onClick={() => qrImageInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-1" />
                    {imageScanLoading ? "กำลังสแกนรูป..." : "เลือกรูปสแกน QR"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void openCameraScanner()}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    เปิดกล้องสแกน QR
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">ไม่สะดวกสแกน? เปิดโหมดกรอกข้อมูลเครื่องจักรเอง</span>
                <Button
                  type="button"
                  variant={manualEntry ? "default" : "outline"}
                  size="sm"
                  onClick={() => setManualEntry((prev) => !prev)}
                >
                  <PencilLine className="h-4 w-4 mr-1" />
                  {manualEntry ? "ปิดกรอกเอง" : "กรอกเอง"}
                </Button>
              </div>
            </div>

            {/* Machine identity */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="asset_id" className="text-xs">
                  รหัสทรัพย์สิน (Fixed / Auto จาก QR)
                </Label>
                <Input
                  id="asset_id"
                  value={assetId}
                  disabled={!manualEntry}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="รหัสทรัพย์สิน"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="asset_type" className="text-xs">
                  ประเภทเครื่อง (Auto จาก QR)
                </Label>
                <Input
                  id="asset_type"
                  value={assetType}
                  disabled={!manualEntry}
                  onChange={(e) => setAssetType(e.target.value)}
                  placeholder="ประเภทเครื่องจักร"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="machine_number" className="text-xs">
                  เลขเครื่อง (Auto จาก QR)
                </Label>
                <Input
                  id="machine_number"
                  value={machineNumber}
                  disabled={!manualEntry}
                  onChange={(e) => setMachineNumber(e.target.value)}
                  placeholder="เลขเครื่อง"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="machine_zone" className="text-xs">
                  โซนเครื่อง (Auto จาก QR)
                </Label>
                <Input
                  id="machine_zone"
                  value={machineZone}
                  disabled={!manualEntry}
                  onChange={(e) => setMachineZone(e.target.value)}
                  placeholder="Zone"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="building" className="text-xs">
                  อาคาร
                </Label>
                <Input
                  id="building"
                  value={locationBuilding}
                  disabled={!manualEntry}
                  onChange={(e) => setLocationBuilding(e.target.value)}
                  placeholder="อาคาร"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="floor" className="text-xs">
                  ชั้น
                </Label>
                <Input
                  id="floor"
                  value={locationFloor}
                  disabled={!manualEntry}
                  onChange={(e) => setLocationFloor(e.target.value)}
                  placeholder="ชั้น"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="line" className="text-xs">
                  ไลน์ผลิต
                </Label>
                <Input
                  id="line"
                  value={locationLine}
                  disabled={!manualEntry}
                  onChange={(e) => setLocationLine(e.target.value)}
                  placeholder="Line"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ข้อจำกัดการเข้าพื้นที่</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={accessRequired ? "default" : "outline"}
                    onClick={() => setAccessRequired(true)}
                  >
                    <ShieldAlert className="h-4 w-4 mr-1" /> ต้องขออนุญาต
                  </Button>
                  <Button
                    type="button"
                    variant={!accessRequired ? "default" : "outline"}
                    onClick={() => setAccessRequired(false)}
                  >
                    เข้าพื้นที่ได้
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="access_time" className="text-xs">เวลาเข้าได้</Label>
                <Input
                  id="access_time"
                  value={accessTimeWindow}
                  onChange={(e) => setAccessTimeWindow(e.target.value)}
                  placeholder="เช่น 08:00-17:00"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="report_date" className="text-xs">วันที่แจ้งซ่อม (Auto จาก QR)</Label>
                <div className="relative">
                  <Factory className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="report_date"
                    type="date"
                    value={reportedDateFromQr}
                    disabled={!manualEntry}
                    onChange={(e) => setReportedDateFromQr(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report_time" className="text-xs">เวลาแจ้งซ่อม (Auto จาก QR)</Label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="report_time"
                    type="time"
                    value={reportedTimeFromQr}
                    disabled={!manualEntry}
                    onChange={(e) => setReportedTimeFromQr(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reporter" className="text-xs">ชื่อผู้แจ้ง (Auto จาก Login)</Label>
                <Input id="reporter" value={currentUserName} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs">หน่วยงาน (Auto จาก Login)</Label>
                <Input id="department" value={currentDepartment} disabled />
              </div>
            </div>

            {/* Job type */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider">
                ประเภทงานซ่อม (job_type) <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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

            <div className="space-y-1.5">
              <Label htmlFor="issue_message" className="text-xs">
                ข้อความแจ้งซ่อม <span className="text-destructive">*</span>
              </Label>
              <Input
                id="issue_message"
                value={issueMessage}
                onChange={(e) => setIssueMessage(e.target.value)}
                placeholder="สรุปข้อความแจ้งซ่อมแบบสั้น"
              />
            </div>

            {/* Issue */}
            <div className="space-y-1.5">
              <Label htmlFor="issue" className="text-xs">
                อาการเบื้องต้น / ปัญหาที่พบ (issue_description) <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="issue"
                rows={4}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="อธิบายอาการที่พบ เช่น เสียง กลิ่น พฤติกรรมผิดปกติ ช่วงเวลาที่เกิด ฯลฯ"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <OptionGroup
                title="อาการ/ลักษณะปัญหา"
                icon={<TriangleAlert className="h-4 w-4" />}
                options={[
                  { value: "not-working", label: "ไม่ทำงาน" },
                  { value: "noise", label: "เสียงดัง" },
                  { value: "vibration", label: "สั่น" },
                  { value: "error", label: "Error" },
                  { value: "other", label: "อื่น ๆ" },
                ]}
                value={symptom}
                onChange={(v) => setSymptom(v as SymptomType)}
              />
              <OptionGroup
                title="ความถี่ของปัญหา"
                icon={<Gauge className="h-4 w-4" />}
                options={[
                  { value: "first-time", label: "เกิดครั้งแรก" },
                  { value: "repeated", label: "เกิดซ้ำ" },
                  { value: "always", label: "เกิดตลอด" },
                ]}
                value={frequency}
                onChange={(v) => setFrequency(v as FrequencyType)}
              />
              <OptionGroup
                title="เครื่องยังใช้งานได้หรือไม่"
                icon={<Factory className="h-4 w-4" />}
                options={[
                  { value: "operable", label: "ใช้งานได้" },
                  { value: "inoperable", label: "ใช้งานไม่ได้" },
                ]}
                value={operability}
                onChange={(v) => setOperability(v as OperabilityType)}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider">
                ระดับความสำคัญ (priority) <span className="text-destructive">*</span>
              </Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="additional_note" className="text-xs">หมายเหตุอื่นๆ</Label>
              <Textarea
                id="additional_note"
                rows={2}
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม เช่น ข้อควรระวัง/ผู้ประสานงาน"
              />
            </div>

            {/* Photo attachments */}
            <div className="space-y-3 p-3 rounded-md border-2 border-dashed border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Camera className="h-4 w-4" />
                  แนบรูป/เอกสาร (รูปก่อนซ่อม, เอกสาร, ใบแจ้งอื่น)
                </div>
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePickPhotos(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-1" />
                    เลือกรูป
                  </Button>
                </>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.attachment_id} className="relative group rounded-md overflow-hidden border">
                      {attachment.mime_type?.startsWith("image/") || attachment.url.startsWith("data:image") ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="h-24 w-full object-cover"
                        />
                      ) : (
                        <div className="h-24 w-full grid place-items-center bg-muted/40 px-2 text-center">
                          <div className="text-[11px] text-muted-foreground">
                            <FileText className="h-4 w-4 mx-auto mb-1" />
                            {attachment.name}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.attachment_id)}
                        className="absolute top-1 right-1 rounded bg-black/70 text-white text-[10px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
      </main>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>ประวัติรายการที่ฉันแจ้ง</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
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
                  {r.attachments.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      แนบไฟล์ {r.attachments.length}
                    </div>
                  )}
                  {r.requester_notifications[0] && (
                    <div className="rounded bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground line-clamp-2">
                      {r.requester_notifications[0].message}
                    </div>
                  )}
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
        </DialogContent>
      </Dialog>

      <Dialog
        open={cameraOpen}
        onOpenChange={(open) => {
          setCameraOpen(open);
          if (!open) {
            stopCamera();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สแกน QR Code จากกล้อง</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {cameraDevices.length > 1 && (
              <div className="space-y-1">
                <Label htmlFor="camera_select" className="text-xs">เลือกกล้องสำหรับสแกน</Label>
                <select
                  id="camera_select"
                  value={selectedCameraId}
                  onChange={(e) => handleCameraSelection(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={cameraLoading}
                >
                  {cameraDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `กล้อง ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {cameraError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {cameraError}
              </div>
            ) : (
              <div className="rounded-md overflow-hidden border bg-black">
                <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
              </div>
            )}

            {!cameraError && (
              <p className="text-xs text-muted-foreground">
                {cameraLoading
                  ? "กำลังเปลี่ยน/เริ่มกล้อง..."
                  : cameraReady
                    ? "หันกล้องไปที่ QR Code เพื่อสแกนอัตโนมัติ"
                    : "กำลังเริ่มกล้อง..."}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCameraOpen(false);
                  stopCamera();
                }}
              >
                ปิด
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestForm;

function OptionGroup({
  title,
  icon,
  options,
  value,
  onChange,
}: {
  title: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center gap-1 text-xs font-medium">
        {icon}
        {title}
      </div>
      <div className="space-y-1.5">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
