import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Search,
  X,
  History,
  LayoutDashboard,
  ShieldAlert,
  Filter,
  TrendingDown,
  CheckCircle2,
  Plus,
  RefreshCw,
  Boxes,
  MapPin,
  Tag,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MOCK_SPARE_PARTS_EXTENDED,
  MOCK_SPARE_PART_TRANSACTIONS,
  SPARE_PART_CATEGORY_LABEL,
  SparePartExtended,
  SparePartTransaction,
  SparePartCategory,
  timeAgo,
} from "@/lib/mockData";

function getStockStatus(part: SparePartExtended): "out" | "low" | "ok" {
  if (part.stock === 0) return "out";
  if (part.stock < part.min_stock) return "low";
  return "ok";
}

function stockPct(part: SparePartExtended): number {
  return Math.min(Math.round((part.stock / part.max_stock) * 100), 100);
}

function formatPrice(n: number) {
  return n.toLocaleString("th-TH");
}

function StockBadge({ status }: { status: "out" | "low" | "ok" }) {
  const map = {
    out: "bg-red-100 text-red-700 border-red-200",
    low: "bg-amber-100 text-amber-700 border-amber-200",
    ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const labels = { out: "หมดสต็อก", low: "ใกล้หมด", ok: "ปกติ" };
  const icons = { out: "🔴", low: "🟡", ok: "🟢" };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", map[status])}>
      {icons[status]} {labels[status]}
    </span>
  );
}

function TxTypeBadge({ type }: { type: SparePartTransaction["type"] }) {
  if (type === "issue") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-semibold">
      <ArrowUpFromLine className="h-3 w-3" /> เบิก
    </span>
  );
  if (type === "receive") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
      <ArrowDownToLine className="h-3 w-3" /> รับเข้า
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">
      ปรับสต็อก
    </span>
  );
}

interface IssueReceiveModalProps {
  part: SparePartExtended;
  mode: "issue" | "receive";
  onClose: () => void;
  onConfirm: (qty: number, note: string, reqId: string) => void;
}

function IssueReceiveModal({ part, mode, onClose, onConfirm }: IssueReceiveModalProps) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [reqId, setReqId] = useState("");
  const isIssue = mode === "issue";
  const maxQty = isIssue ? part.stock : 999;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border shadow-2xl overflow-hidden">
        <div className={cn("px-6 py-4 flex items-center justify-between", isIssue ? "bg-rose-500" : "bg-emerald-500")}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center">
              {isIssue ? <ArrowUpFromLine className="h-4 w-4 text-white" /> : <ArrowDownToLine className="h-4 w-4 text-white" />}
            </div>
            <div>
              <p className="text-xs text-white/70">{isIssue ? "เบิกอะไหล่" : "รับอะไหล่เข้า"}</p>
              <p className="font-bold text-white text-sm truncate max-w-[220px]">{part.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">Stock ปัจจุบัน</span>
            <span className="font-bold">{part.stock} {part.unit}</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">จำนวน ({part.unit})</label>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-md border bg-muted hover:bg-muted/80 font-bold transition-colors" onClick={() => setQty((v) => Math.max(1, v - 1))}>−</button>
              <input
                type="number" min={1} max={maxQty} value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)))}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="h-9 w-9 rounded-md border bg-muted hover:bg-muted/80 font-bold transition-colors" onClick={() => setQty((v) => Math.min(maxQty, v + 1))}>+</button>
            </div>
            {isIssue && qty > part.stock && <p className="text-xs text-red-500 mt-1">⚠ จำนวนเกิน stock ที่มีอยู่</p>}
          </div>
          {isIssue && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">รหัสใบแจ้งซ่อม (ถ้ามี)</label>
              <Input placeholder="เช่น REQ-20260422-001" value={reqId} onChange={(e) => setReqId(e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">หมายเหตุ</label>
            <textarea rows={2} placeholder={isIssue ? "ระบุงานที่ใช้อะไหล่..." : "ระบุแหล่งที่มา / PO..."} value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div className={cn("rounded-lg border p-3 text-sm", isIssue ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50")}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stock หลังดำเนินการ</span>
              <span className={cn("font-bold", isIssue ? "text-rose-700" : "text-emerald-700")}>
                {isIssue ? part.stock - qty : part.stock + qty} {part.unit}
              </span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
            <Button
              className={cn("flex-1", isIssue ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white")}
              disabled={isIssue && qty > part.stock}
              onClick={() => onConfirm(qty, note, reqId)}
            >
              {isIssue ? "ยืนยันการเบิก" : "ยืนยันรับเข้า"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_PREFIX_MAP: Record<SparePartCategory, string> = {
  hydraulic: "HYD",
  electrical: "ELC",
  bearing: "BRG",
  belt: "BLT",
  filter: "FLT",
  pneumatic: "PNM",
  lubricant: "LUB",
  fastener: "FST",
  sensor: "SNS",
  other: "GEN",
};

const COMMON_UNITS = ["ชิ้น", "ตัว", "ชุด", "เส้น", "ลิตร", "ม้วน", "กระป๋อง", "กล่อง"];
const COMMON_ASSETS = ["MCH-PR-2041", "MCH-CNC-12", "MCH-HYD-005", "ELC-DB-5510", "CNV-ASSY-08", "MCH-PUMP-033", "MCH-MTR-110"];

function generateNextPartId(category: SparePartCategory, existingParts: SparePartExtended[]): string {
  const prefix = CATEGORY_PREFIX_MAP[category] || "GEN";
  const regex = new RegExp(`^SP-${prefix}-(\\d+)`, "i");
  let maxNum = 0;
  for (const part of existingParts) {
    const match = part.part_id.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  return `SP-${prefix}-${String(nextNum).padStart(3, "0")}`;
}

interface CreateSparePartModalProps {
  existingParts: SparePartExtended[];
  onClose: () => void;
  onSave: (newPart: SparePartExtended, initialStock: number) => void;
}

function CreateSparePartModal({ existingParts, onClose, onSave }: CreateSparePartModalProps) {
  const [category, setCategory] = useState<SparePartCategory>("hydraulic");
  const [partId, setPartId] = useState(() => generateNextPartId("hydraulic", existingParts));
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [location, setLocation] = useState("");
  const [unit, setUnit] = useState("ชิ้น");
  const [unitPrice, setUnitPrice] = useState<string>("150");
  const [stock, setStock] = useState<string>("10");
  const [minStock, setMinStock] = useState<string>("5");
  const [maxStock, setMaxStock] = useState<string>("50");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [customAssetInput, setCustomAssetInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const categories = Object.keys(SPARE_PART_CATEGORY_LABEL) as SparePartCategory[];

  const handleCategoryChange = (newCat: SparePartCategory) => {
    setCategory(newCat);
    setPartId(generateNextPartId(newCat, existingParts));
    setError(null);
  };

  const handleRegenerateId = () => {
    setPartId(generateNextPartId(category, existingParts));
    setError(null);
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((a) => a !== assetId) : [...prev, assetId]
    );
  };

  const handleAddCustomAsset = () => {
    const trimmed = customAssetInput.trim().toUpperCase();
    if (trimmed) {
      if (!selectedAssets.includes(trimmed)) {
        setSelectedAssets((prev) => [...prev, trimmed]);
      }
      setCustomAssetInput("");
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    setSelectedAssets((prev) => prev.filter((a) => a !== assetId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = partId.trim().toUpperCase();
    const trimmedName = name.trim();
    const numStock = parseInt(stock) || 0;
    const numMin = parseInt(minStock) || 0;
    const numMax = parseInt(maxStock) || 1;
    const numPrice = parseFloat(unitPrice) || 0;

    if (!trimmedId) {
      setError("กรุณาระบุรหัสอะไหล่");
      return;
    }

    if (existingParts.some((p) => p.part_id.toLowerCase() === trimmedId.toLowerCase())) {
      setError(`รหัสอะไหล่ "${trimmedId}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    if (!trimmedName) {
      setError("กรุณากรอกชื่ออะไหล่");
      return;
    }

    if (numStock < 0) {
      setError("จำนวนสต็อกเริ่มต้นต้องไม่ติดลบ");
      return;
    }

    if (numMin < 0 || numMax <= 0) {
      setError("สต็อกขั้นต่ำและสูงสุดต้องถูกต้อง (มากกว่า 0)");
      return;
    }

    if (numMin > numMax) {
      setError("สต็อกขั้นต่ำ (Min) ต้องไม่มากกว่าสต็อกสูงสุด (Max)");
      return;
    }

    if (numPrice < 0) {
      setError("ราคาต่อหน่วยต้องไม่ติดลบ");
      return;
    }

    const newPart: SparePartExtended = {
      part_id: trimmedId,
      name: trimmedName,
      category,
      stock: numStock,
      min_stock: numMin,
      max_stock: numMax,
      unit: unit.trim() || "ชิ้น",
      location: location.trim() || "คลังหลัก",
      unit_price: numPrice,
      supplier: supplier.trim() || "ไม่ระบุ",
      last_updated: new Date().toISOString(),
      compatible_assets: selectedAssets,
    };

    onSave(newPart, numStock);
  };

  const isDuplicateId = existingParts.some(
    (p) => p.part_id.toLowerCase() === partId.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-card border shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0 bg-gradient-primary text-primary-foreground"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-secondary text-secondary-foreground grid place-items-center shadow-sm">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-primary-foreground/75 font-medium tracking-wide uppercase">New Spare Part</p>
              <h2 className="font-bold text-primary-foreground text-base">ลงทะเบียน / เพิ่มรายการอะไหล่ใหม่</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: หมวดหมู่และรหัส */}
          <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Boxes className="h-3.5 w-3.5 text-primary" />
              <span>ข้อมูลพื้นฐานและหมวดหมู่</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  หมวดหมู่อะไหล่ <span className="text-red-500">*</span>
                </label>
                <Select
                  value={category}
                  onValueChange={(val) => handleCategoryChange(val as SparePartCategory)}
                >
                  <SelectTrigger className="w-full text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {SPARE_PART_CATEGORY_LABEL[c]} ({c})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    รหัสอะไหล่ (Part ID) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateId}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    title="สร้างรหัสใหม่อัตโนมัติ"
                  >
                    <RefreshCw className="h-3 w-3" /> แนะนำรหัส
                  </button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="เช่น SP-HYD-005"
                    value={partId}
                    onChange={(e) => {
                      setPartId(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    className={cn("font-mono uppercase", isDuplicateId && "border-red-500 focus-visible:ring-red-500")}
                  />
                </div>
                {isDuplicateId && (
                  <p className="text-[11px] text-red-500 mt-1">⚠ รหัสนี้มีอยู่แล้วในระบบ</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  ชื่อรายการอะไหล่ <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="เช่น ซีลยางกันน้ำมัน 50mm, สายพานไทม์มิ่ง HTD 8M-1200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  ผู้จัดจำหน่าย / แหล่งจัดซื้อ (Supplier)
                </label>
                <Input
                  placeholder="เช่น บจก. สยามซีล หรือ Schneider Electric"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  ตำแหน่งจัดเก็บ (Storage Location)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="เช่น ชั้น A-03, ตู้ B-01"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: สต็อกและราคา */}
          <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span>การจัดการสต็อกและราคา</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  สต็อกเริ่มต้น
                </label>
                <Input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="font-mono text-center text-base font-bold"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  (ระบบจะบันทึกรับเข้าอัตโนมัติ)
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  จุดเตือนขั้นต่ำ (Min)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="font-mono text-center text-base text-amber-600 font-bold"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  เตือนเมื่อสต็อกต่ำกว่าค่านี้
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  สต็อกสูงสุด (Max)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value)}
                  className="font-mono text-center text-base font-bold"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  ความจุสต็อกสูงสุด
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  หน่วยนับ (Unit)
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="เช่น ชิ้น, ตัว, ชุด, เส้น"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1">
                    {COMMON_UNITS.map((u) => (
                      <button
                        type="button"
                        key={u}
                        onClick={() => setUnit(u)}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs transition-colors",
                          unit === u
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  ราคาต่อหน่วย (บาท / {unit || "หน่วย"})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">฿</span>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="pl-7 font-mono font-medium"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  มูลค่ารวมเริ่มต้น: ฿{((parseInt(stock) || 0) * (parseFloat(unitPrice) || 0)).toLocaleString("th-TH")}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: เครื่องจักรที่รองรับ */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>เครื่องจักร/อุปกรณ์ที่ใช้ร่วมกันได้ (Compatible Assets)</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_ASSETS.map((asset) => {
                const isSelected = selectedAssets.includes(asset);
                return (
                  <button
                    type="button"
                    key={asset}
                    onClick={() => toggleAsset(asset)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-mono transition-all flex items-center gap-1",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <span>{asset}</span>
                    {isSelected ? "✓" : "+"}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <Input
                placeholder="ระบุรหัสเครื่องจักรอื่น ๆ เช่น CNC-05..."
                value={customAssetInput}
                onChange={(e) => setCustomAssetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAsset();
                  }
                }}
                className="font-mono text-xs uppercase"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCustomAsset}>
                เพิ่ม
              </Button>
            </div>

            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground self-center mr-1">เลือกแล้ว:</span>
                {selectedAssets.map((asset) => (
                  <span
                    key={asset}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2.5 py-0.5 text-xs font-mono"
                  >
                    {asset}
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(asset)}
                      className="hover:text-red-500 transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={isDuplicateId || !name.trim()}
            >
              <Plus className="h-4 w-4 mr-1.5" /> บันทึกรายการอะไหล่
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SparePartsProps {
  embedded?: boolean;
  onBack?: () => void;
}

export default function SpareParts({ embedded = false, onBack }: SparePartsProps = {}) {
  const navigate = useNavigate();
  const [parts, setParts] = useState<SparePartExtended[]>(MOCK_SPARE_PARTS_EXTENDED);
  const [transactions, setTransactions] = useState<SparePartTransaction[]>(MOCK_SPARE_PART_TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<SparePartCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "out" | "low" | "ok">("all");
  const [modal, setModal] = useState<{ part: SparePartExtended; mode: "issue" | "receive" } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stock" | "history">("stock");

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/admin/dashboard?tab=spare");
    }
  };

  const kpi = useMemo(() => {
    const total = parts.length;
    const out = parts.filter((p) => p.stock === 0).length;
    const low = parts.filter((p) => p.stock > 0 && p.stock < p.min_stock).length;
    const totalValue = parts.reduce((sum, p) => sum + p.stock * p.unit_price, 0);
    const needOrder = parts.filter((p) => p.stock < p.min_stock).length;
    return { total, out, low, totalValue, needOrder };
  }, [parts]);

  const filtered = useMemo(() => {
    return parts.filter((p) => {
      const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.part_id.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      const s = getStockStatus(p);
      const matchStatus = statusFilter === "all" || s === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [parts, search, catFilter, statusFilter]);

  const handleConfirm = (qty: number, note: string, reqId: string) => {
    if (!modal) return;
    const { part, mode } = modal;
    const delta = mode === "issue" ? -qty : qty;
    setParts((prev) => prev.map((p) => p.part_id === part.part_id ? { ...p, stock: p.stock + delta, last_updated: new Date().toISOString() } : p));
    const tx: SparePartTransaction = {
      tx_id: `TX-${Date.now()}`,
      part_id: part.part_id,
      part_name: part.name,
      type: mode,
      quantity: qty,
      related_request_id: reqId || undefined,
      performed_by: "สมศักดิ์ ช่างไฟ",
      note: note || (mode === "issue" ? "เบิกใช้งาน" : "รับเข้าสต็อก"),
      timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);
    setModal(null);
  };

  const handleCreatePart = (newPart: SparePartExtended, initialStock: number) => {
    setParts((prev) => [newPart, ...prev]);
    if (initialStock > 0) {
      const tx: SparePartTransaction = {
        tx_id: `TX-${Date.now()}`,
        part_id: newPart.part_id,
        part_name: newPart.name,
        type: "receive",
        quantity: initialStock,
        performed_by: "ผู้ดูแลระบบ",
        note: "บันทึกสต็อกเริ่มต้น (สร้างรายการอะไหล่ใหม่)",
        timestamp: new Date().toISOString(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }
    setIsCreateModalOpen(false);
    setNotification(`เพิ่มรายการอะไหล่ "${newPart.name}" (${newPart.part_id}) เรียบร้อยแล้ว`);
    setTimeout(() => setNotification(null), 4500);
  };

  const categories = Object.keys(SPARE_PART_CATEGORY_LABEL) as SparePartCategory[];

  const bodyContent = (
    <div className="space-y-6">
        {/* Notification Banner */}
        {notification && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { label: "รายการทั้งหมด", value: kpi.total, icon: <Package className="h-4 w-4 text-primary" />, accent: "hsl(var(--primary))", border: "border-l-primary" },
            { label: "ต้องสั่งซื้อ", value: kpi.needOrder, icon: <ShieldAlert className="h-4 w-4" />, accent: "#f59e0b", border: "border-l-amber-500" },
            { label: "หมดสต็อก", value: kpi.out, icon: <AlertTriangle className="h-4 w-4 text-red-500" />, accent: "#ef4444", border: "border-l-red-500" },
            { label: "ใกล้หมด", value: kpi.low, icon: <TrendingDown className="h-4 w-4 text-amber-500" />, accent: "#f59e0b", border: "border-l-amber-400" },
            { label: "มูลค่ารวม", value: `฿${formatPrice(kpi.totalValue)}`, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, accent: "#10b981", border: "border-l-emerald-500" },
          ].map((k) => (
            <Card key={k.label} className={cn("p-4 border-l-4 hover:shadow-md transition-shadow", k.border)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</p>
                  <p className="text-2xl font-bold tabular-nums leading-tight mt-0.5">{k.value}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center shrink-0">{k.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-muted p-1 w-full sm:w-fit">
            {[{ key: "stock", label: "รายการ Stock", icon: <Package className="h-4 w-4" /> }, { key: "history", label: "ประวัติการเคลื่อนไหว", icon: <History className="h-4 w-4" /> }].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as "stock" | "history")}
                className={cn(
                  "flex-1 sm:flex-initial justify-center rounded-lg px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 min-h-[40px] sm:min-h-0",
                  activeTab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap self-start sm:self-auto w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/spare-requests")}
              className="flex-1 sm:flex-initial h-11 sm:h-9 border border-amber-400 bg-amber-50 hover:bg-amber-100 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold shadow-sm active:scale-[0.98] transition-all"
              style={{ color: "#78350f" }}
            >
              <ShieldAlert className="h-4 w-4 shrink-0" style={{ color: "#b45309" }} />
              <span className="font-semibold" style={{ color: "#78350f" }}>ความต้องการอะไหล่จากช่าง</span>
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 sm:flex-initial h-11 sm:h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm font-medium active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>สร้างรายการอะไหล่ใหม่</span>
            </Button>
          </div>
        </div>

        {activeTab === "stock" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ค้นหาชื่อ หรือรหัสอะไหล่..." className="pl-9 h-10 sm:h-9 text-xs sm:text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <button onClick={() => setCatFilter("all")} className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors min-h-[32px] flex items-center", catFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>ทั้งหมด</button>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCatFilter(c)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors min-h-[32px] flex items-center", catFilter === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>
                    {SPARE_PART_CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["all", "ok", "low", "out"] as const).map((s) => {
                  const labels = { all: "ทุกสถานะ", ok: "🟢 ปกติ", low: "🟡 ใกล้หมด", out: "🔴 หมด" };
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors min-h-[32px] flex items-center", statusFilter === s ? "bg-secondary text-secondary-foreground border-secondary" : "border-border hover:bg-muted")}>
                      {labels[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Mobile View: Individual Spacious Cards (sm:hidden) ── */}
            <div className="sm:hidden space-y-3">
              {filtered.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground rounded-2xl">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-35 text-primary" />
                  <p className="font-semibold text-sm text-foreground">ไม่พบรายการอะไหล่</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">ลองเปลี่ยนคำค้นหา หรือลงทะเบียนอะไหล่ใหม่เข้าระบบ</p>
                  <Button size="sm" variant="outline" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> เพิ่มอะไหล่ใหม่
                  </Button>
                </Card>
              ) : (
                filtered.map((p) => {
                  const s = getStockStatus(p);
                  const pct = stockPct(p);
                  const barColor = s === "out" ? "bg-red-500" : s === "low" ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <Card
                      key={p.part_id}
                      className="p-4 space-y-3.5 border-l-4 shadow-xs hover:shadow-md transition-all rounded-2xl"
                      style={{
                        borderLeftColor: s === "out" ? "#ef4444" : s === "low" ? "#f59e0b" : "#10b981",
                      }}
                    >
                      {/* Top: Badges & Stock Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                            {p.part_id}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border">
                            {SPARE_PART_CATEGORY_LABEL[p.category]}
                          </span>
                        </div>
                        <StockBadge status={s} />
                      </div>

                      {/* Name & Details */}
                      <div>
                        <h4 className="font-bold text-base text-foreground leading-snug">{p.name}</h4>
                        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5 flex-wrap">
                          {p.location && (
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              ที่เก็บ: {p.location}
                            </span>
                          )}
                          <span>ผู้จำหน่าย: <strong className="text-foreground/80 font-medium">{p.supplier}</strong></span>
                        </div>
                      </div>

                      {/* Stock Level Box */}
                      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 space-y-2 border border-slate-200/70 dark:border-slate-800">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground font-medium">สต็อกคงเหลือ:</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-xl tabular-nums text-foreground">{p.stock}</span>
                            <span className="text-xs font-medium text-muted-foreground">{p.unit}</span>
                            <span className="text-xs text-muted-foreground/80">/ {p.max_stock} {p.unit}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                          <span>จุดสั่งซื้อต่ำสุด (Min): <strong>{p.min_stock} {p.unit}</strong></span>
                          <span className="font-semibold text-foreground/90">{pct}%</span>
                        </div>
                      </div>

                      {/* Price & Touch-Friendly Actions */}
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
                        <div className="text-xs">
                          <span className="text-muted-foreground">ราคา: </span>
                          <span className="font-mono font-bold text-sm text-foreground">฿{formatPrice(p.unit_price)}</span>
                          <span className="text-muted-foreground text-[11px]"> /{p.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModal({ part: p, mode: "issue" })}
                            disabled={p.stock === 0}
                            className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] active:scale-95 shadow-2xs"
                          >
                            <ArrowUpFromLine className="h-4 w-4" /> เบิกอะไหล่
                          </button>
                          <button
                            onClick={() => setModal({ part: p, mode: "receive" })}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] active:scale-95 shadow-2xs"
                          >
                            <ArrowDownToLine className="h-4 w-4" /> รับเข้าสต็อก
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* ── Desktop/Tablet View: Table Card (hidden sm:block) ── */}
            <Card className="hidden sm:block overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium min-w-[180px]">รหัส / ชื่ออะไหล่</th>
                      <th className="px-4 py-3 text-left font-medium">หมวดหมู่</th>
                      <th className="px-4 py-3 text-left font-medium min-w-[150px]">Stock / กราฟ</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">ตำแหน่ง</th>
                      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">ราคา/หน่วย</th>
                      <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                      <th className="px-4 py-3 text-right font-medium">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-35" />
                          <p className="font-semibold text-sm text-foreground">ไม่พบรายการอะไหล่</p>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-3">ลองเปลี่ยนคำค้นหา หรือลงทะเบียนอะไหล่ใหม่เข้าระบบ</p>
                          <Button size="sm" variant="outline" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> เพิ่มอะไหล่ใหม่
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p, i) => {
                        const s = getStockStatus(p);
                        const pct = stockPct(p);
                        const barColor = s === "out" ? "bg-red-400" : s === "low" ? "bg-amber-400" : "bg-emerald-400";
                        return (
                          <tr key={p.part_id} className={cn("border-b last:border-0 transition-colors hover:bg-muted/30", i % 2 !== 0 && "bg-muted/10")}>
                            <td className="px-4 py-3 min-w-[180px]">
                              <p className="font-mono text-xs text-primary">{p.part_id}</p>
                              <p className="font-medium text-sm leading-tight mt-0.5">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.supplier}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{SPARE_PART_CATEGORY_LABEL[p.category]}</span>
                            </td>
                            <td className="px-4 py-3 min-w-[150px]">
                              <div className="flex items-baseline gap-1.5 mb-1.5">
                                <span className="font-bold text-base tabular-nums">{p.stock}</span>
                                <span className="text-xs text-muted-foreground">{p.unit}</span>
                                <span className="text-xs text-muted-foreground ml-auto">/ {p.max_stock}</span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${pct}%` }} />
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                                <span>Min: {p.min_stock}</span>
                                <span>{pct}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{p.location}</td>
                            <td className="px-4 py-3 hidden lg:table-cell text-xs font-mono">฿{formatPrice(p.unit_price)}</td>
                            <td className="px-4 py-3"><StockBadge status={s} /></td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setModal({ part: p, mode: "issue" })}
                                  disabled={p.stock === 0}
                                  className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 min-h-[32px] active:scale-95"
                                >
                                  <ArrowUpFromLine className="h-3.5 w-3.5" /> เบิก
                                </button>
                                <button
                                  onClick={() => setModal({ part: p, mode: "receive" })}
                                  className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 min-h-[32px] active:scale-95"
                                >
                                  <ArrowDownToLine className="h-3.5 w-3.5" /> รับ
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex justify-between">
                <span>แสดง {filtered.length} จาก {parts.length} รายการ</span>
                <span>อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH")}</span>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "history" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">ประวัติการเคลื่อนไหวอะไหล่</h3>
              </div>
              <span className="text-xs text-muted-foreground">{transactions.length} รายการ</span>
            </div>
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx.tx_id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={cn("h-9 w-9 rounded-full grid place-items-center shrink-0 mt-0.5", tx.type === "issue" ? "bg-rose-100" : "bg-emerald-100")}>
                      {tx.type === "issue" ? <ArrowUpFromLine className="h-4 w-4 text-rose-600" /> : <ArrowDownToLine className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TxTypeBadge type={tx.type} />
                        <p className="font-medium text-sm">{tx.part_name}</p>
                        <span className="font-bold tabular-nums text-sm">×{tx.quantity}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tx.note}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>โดย {tx.performed_by}</span>
                        {tx.related_request_id && (
                          <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 font-mono">{tx.related_request_id}</span>
                        )}
                        <span className="ml-auto">{timeAgo(tx.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      {modal && (
        <IssueReceiveModal part={modal.part} mode={modal.mode} onClose={() => setModal(null)} onConfirm={handleConfirm} />
      )}

      {isCreateModalOpen && (
        <CreateSparePartModal
          existingParts={parts}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreatePart}
        />
      )}
    </div>
  );

  if (embedded) {
    return bodyContent;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="px-4 py-3 flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-white/10 shrink-0 gap-1.5 h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium"
            onClick={handleBack}
            aria-label="ย้อนกลับ"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>ย้อนกลับ</span>
          </Button>
          <div className="h-4 w-px bg-white/20" />
          <div className="h-9 w-9 rounded-md bg-secondary text-secondary-foreground grid place-items-center shrink-0 shadow-sm">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/70 font-semibold">Spare Parts Management</div>
            <h1 className="font-bold truncate text-sm sm:text-base">ระบบบริหารจัดการอะไหล่</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {kpi.out > 0 && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-red-500/20 border border-red-400/40 text-red-200">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                หมดสต็อก {kpi.out}
              </span>
            )}
            {kpi.low > 0 && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-200">
                ⚠ ใกล้หมด {kpi.low}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => navigate("/admin/dashboard")} aria-label="Dashboard">
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {bodyContent}
      </main>
    </div>
  );
}
