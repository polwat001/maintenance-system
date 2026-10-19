import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Package, Search, Filter, Plus, Edit2, AlertTriangle, ArrowUpDown,
  Boxes, DollarSign, History, Check, X, RotateCcw, TrendingDown, Pencil
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SparePartExtended,
} from "@/lib/mockData";
import { toast } from "sonner";

export function SparePartsSection() {
  const [parts, setParts] = useState<SparePartExtended[]>(() => [...MOCK_SPARE_PARTS_EXTENDED]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Unified Edit & Stock Adjust Modal states
  const [unifiedModalPart, setUnifiedModalPart] = useState<SparePartExtended | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [modalTab, setModalTab] = useState<"all" | "stock" | "master">("all");

  // Stock Adjustment within Modal
  const [adjustAction, setAdjustAction] = useState<"none" | "add" | "deduct" | "set">("none");
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [targetStock, setTargetStock] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>("ตรวจนับสต็อกจริง");
  const [adjustNote, setAdjustNote] = useState<string>("");

  // Master Data Form
  const [formData, setFormData] = useState({
    name: "",
    part_number: "",
    category: "bearing",
    stock: 10,
    min_stock: 5,
    unit: "ชิ้น",
    unit_price: 500,
    location: "A-01-01",
    supplier: "SKF Thailand",
  });

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(parts.map((p) => p.category));
    return Array.from(set);
  }, [parts]);

  // Filtered parts
  const filtered = useMemo(() => {
    return parts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchLowStock = !onlyLowStock || p.stock < p.min_stock;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [parts, searchTerm, categoryFilter, onlyLowStock]);

  // Statistics
  const stats = useMemo(() => {
    const totalSKUs = parts.length;
    const lowStockCount = parts.filter((p) => p.stock < p.min_stock).length;
    const totalValuation = parts.reduce((sum, p) => sum + p.stock * p.unit_price, 0);
    const outOfStockCount = parts.filter((p) => p.stock === 0).length;
    return { totalSKUs, lowStockCount, totalValuation, outOfStockCount };
  }, [parts]);

  // Open Unified Modal for existing part
  const openUnifiedModal = (part: SparePartExtended) => {
    setIsAddMode(false);
    setUnifiedModalPart(part);
    setModalTab("all");
    setAdjustAction("none");
    setAdjustQty(1);
    setTargetStock(part.stock);
    setAdjustReason("ตรวจนับสต็อกจริง");
    setAdjustNote("");
    setFormData({
      name: part.name,
      part_number: part.part_number,
      category: part.category,
      stock: part.stock,
      min_stock: part.min_stock,
      unit: part.unit,
      unit_price: part.unit_price,
      location: part.location,
      supplier: part.supplier || "SKF Thailand",
    });
  };

  // Open Add Modal
  const openAddModal = () => {
    setIsAddMode(true);
    setUnifiedModalPart({} as any);
    setModalTab("all");
    setAdjustAction("none");
    setFormData({
      name: "",
      part_number: `SP-${String(parts.length + 1).padStart(3, "0")}`,
      category: "bearing",
      stock: 10,
      min_stock: 5,
      unit: "ชิ้น",
      unit_price: 500,
      location: "A-01-01",
      supplier: "SKF Thailand",
    });
  };

  // Handle Save Unified (Master Edit + Stock Adjustment)
  const handleSaveUnified = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddMode) {
      const newPart: SparePartExtended = {
        id: `SP-${String(Date.now()).slice(-4)}`,
        name: formData.name,
        part_number: formData.part_number,
        category: formData.category,
        stock: Math.max(0, Number(formData.stock)),
        min_stock: Number(formData.min_stock),
        unit: formData.unit,
        unit_price: Number(formData.unit_price),
        location: formData.location,
        supplier: formData.supplier,
        monthly_usage: 0,
        pending_request_qty: 0,
      };
      setParts((prev) => [newPart, ...prev]);
      toast.success(`เพิ่มอะไหล่ใหม่ "${formData.name}" เข้าระบบเรียบร้อยแล้ว (สต็อกตั้งต้น: ${newPart.stock} ${newPart.unit})`);
    } else if (unifiedModalPart) {
      // Calculate resulting stock
      let resultingStock = unifiedModalPart.stock;
      if (adjustAction === "add") {
        resultingStock = unifiedModalPart.stock + adjustQty;
      } else if (adjustAction === "deduct") {
        resultingStock = Math.max(0, unifiedModalPart.stock - adjustQty);
      } else if (adjustAction === "set") {
        resultingStock = Math.max(0, targetStock);
      }

      setParts((prev) =>
        prev.map((p) =>
          p.id === unifiedModalPart.id
            ? {
                ...p,
                name: formData.name,
                part_number: formData.part_number,
                category: formData.category,
                stock: resultingStock,
                min_stock: Number(formData.min_stock),
                unit: formData.unit,
                unit_price: Number(formData.unit_price),
                location: formData.location,
                supplier: formData.supplier,
              }
            : p
        )
      );

      const stockChanged = resultingStock !== unifiedModalPart.stock;
      if (stockChanged) {
        toast.success(
          `อัปเดต "${formData.name}" สำเร็จ! (ปรับสต็อก: ${unifiedModalPart.stock} ➔ ${resultingStock} ${formData.unit})`
        );
      } else {
        toast.success(`อัปเดตข้อมูลอะไหล่ "${formData.name}" เรียบร้อยแล้ว`);
      }
    }
    setUnifiedModalPart(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <span>จัดการอะไหล่ & ปรับยอดสต็อก</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            สิทธิ์ Superadmin: เพิ่ม/แก้ไข Master Data อะไหล่, ปรับปรุงสต็อกคงคลัง (Stock Override) พร้อมบันทึกประวัติ
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1 shrink-0" /> เพิ่มอะไหล่ใหม่
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParts([...MOCK_SPARE_PARTS_EXTENDED])}
            className="text-xs h-9 w-full sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 shrink-0" /> รีเซ็ต
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-4 border-l-4 border-l-primary flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">รายการอะไหล่ทั้งหมด</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums truncate">{stats.totalSKUs} รายการ</p>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <Boxes className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">สต็อกต่ำกว่าเกณฑ์</p>
            <p className="text-lg sm:text-2xl font-bold text-amber-600 tabular-nums truncate">{stats.lowStockCount} รายการ</p>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-amber-100 text-amber-700 grid place-items-center shrink-0">
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">มูลค่าสต็อกรวม</p>
            <p className="text-base sm:text-2xl font-bold text-emerald-600 tabular-nums truncate">
              ฿{stats.totalValuation.toLocaleString("th-TH")}
            </p>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 border-l-4 border-l-red-500 flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">สินค้าหมดสต็อก</p>
            <p className="text-lg sm:text-2xl font-bold text-red-600 tabular-nums truncate">{stats.outOfStockCount} รายการ</p>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-red-100 text-red-600 grid place-items-center shrink-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </Card>
      </div>

      {/* ── Search & Filter Bar ── */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่ออะไหล่, รหัส Part No, ตำแหน่งจัดเก็บ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  aria-label="กรองตามหมวดหมู่อะไหล่"
                  className="w-full sm:w-[190px] h-9 sm:h-10 text-xs sm:text-sm font-medium bg-background border-border/80 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 shadow-2xs cursor-pointer"
                >
                  <SelectValue placeholder="ทุกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl shadow-lg border border-border/80 bg-popover/98 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 duration-200">
                  <SelectItem value="all" className="text-xs sm:text-sm font-semibold cursor-pointer">
                    ทุกหมวดหมู่ ({parts.length})
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs sm:text-sm cursor-pointer capitalize">
                      {c} ({parts.filter((p) => p.category === c).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={onlyLowStock ? "destructive" : "outline"}
              size="sm"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className="text-xs h-9 sm:h-10 shrink-0 w-full sm:w-auto"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1 shrink-0" />
              เฉพาะสต็อกต่ำ ({stats.lowStockCount})
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Mobile Card List (Phones & Small screens < 768px) ── */}
      <div className="block md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            ไม่พบรายการอะไหล่ตามเงื่อนไขที่เลือก
          </Card>
        ) : (
          filtered.map((part) => {
            const isLow = part.stock < part.min_stock;
            const isOut = part.stock === 0;
            const totalPartVal = part.stock * part.unit_price;

            return (
              <Card
                key={part.id}
                className={cn(
                  "p-3.5 border transition-all space-y-3",
                  isOut ? "border-red-300 bg-red-50/20" : isLow ? "border-amber-300 bg-amber-50/20" : "hover:border-primary/40"
                )}
              >
                {/* Header: Name, Part No, Category badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-foreground leading-snug">
                      {part.name}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-foreground/80">{part.part_number}</span>
                      {part.supplier && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="truncate">{part.supplier}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Category Badge */}
                  <span className="shrink-0 px-2 py-0.5 rounded bg-muted text-[11px] font-medium text-foreground capitalize">
                    {part.category}
                  </span>
                </div>

                {/* Stock & Location Metric Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground">คงเหลือ (Stock)</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums",
                          isOut
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : isLow
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {isLow && <AlertTriangle className="h-3 w-3 shrink-0" />}
                        {part.stock} {part.unit}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        (Min {part.min_stock})
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground">ตำแหน่งจัดเก็บ (Bin)</p>
                    <p className="font-mono font-semibold text-xs text-foreground mt-1 truncate">
                      📍 {part.location || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground">ราคา/หน่วย</p>
                    <p className="font-medium text-xs text-foreground mt-0.5">
                      ฿{part.unit_price.toLocaleString("th-TH")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground">มูลค่ารวมในคลัง</p>
                    <p className="font-bold text-xs text-foreground mt-0.5">
                      ฿{totalPartVal.toLocaleString("th-TH")}
                    </p>
                  </div>
                </div>

                {/* Unified Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary border-primary/30 shadow-2xs transition-all gap-1.5"
                  onClick={() => openUnifiedModal(part)}
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  <span>แก้ไข / ปรับสต็อก</span>
                </Button>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Spare Parts Table (Desktop & Tablet >= 768px) ── */}
      <Card className="hidden md:block overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/70 text-xs font-semibold uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-4">รหัส / ชื่ออะไหล่</th>
                <th className="py-3 px-4">หมวดหมู่ & จัดเก็บ</th>
                <th className="py-3 px-4 text-center">คงเหลือ (Stock)</th>
                <th className="py-3 px-4 text-center">จุดเตือน (Min)</th>
                <th className="py-3 px-4 text-right">ราคาต่อหน่วย</th>
                <th className="py-3 px-4 text-right">มูลค่ารวม</th>
                <th className="py-3 px-4 text-right">Superadmin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่พบรายการอะไหล่ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filtered.map((part) => {
                  const isLow = part.stock < part.min_stock;
                  const totalPartVal = part.stock * part.unit_price;

                  return (
                    <tr key={part.id} className={cn("hover:bg-muted/30 transition-colors", isLow && "bg-amber-500/5")}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{part.name}</div>
                        <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{part.part_number}</span>
                          <span className="text-muted-foreground/60">•</span>
                          <span>{part.supplier || "Supplier N/A"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-muted font-medium text-foreground capitalize">
                          {part.category}
                        </span>
                        <div className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                          Bin: {part.location}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums",
                            part.stock === 0
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : isLow
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3" />}
                          {part.stock} {part.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-xs tabular-nums text-muted-foreground">
                        {part.min_stock} {part.unit}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums text-xs">
                        ฿{part.unit_price.toLocaleString("th-TH")}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-xs text-foreground">
                        ฿{totalPartVal.toLocaleString("th-TH")}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Unified Edit & Stock Adjust button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary border-primary/30 shadow-2xs transition-all gap-1.5"
                            onClick={() => openUnifiedModal(part)}
                            title="แก้ไขข้อมูลอะไหล่ & ปรับสต็อก"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>แก้ไข / ปรับสต็อก</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Unified Modal: Edit Master Data & Stock Adjustment ── */}
      {unifiedModalPart && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 cursor-pointer"
          onClick={() => setUnifiedModalPart(null)}
        >
          <Card
            className="w-full max-w-2xl p-4 sm:p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95 cursor-default max-h-[92vh] overflow-y-auto rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {isAddMode ? "เพิ่มอะไหล่ใหม่ (Add Master Part)" : "แก้ไขข้อมูลอะไหล่ & ปรับสต็อก"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAddMode
                    ? "กรอกรายละเอียดเพื่อลงทะเบียนอะไหล่ใหม่เข้าระบบ"
                    : `${unifiedModalPart.name} (${unifiedModalPart.part_number})`}
                </p>
                {!isAddMode && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                      unifiedModalPart.stock === 0
                        ? "bg-red-50 text-red-700 border-red-200"
                        : unifiedModalPart.stock < unifiedModalPart.min_stock
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      สต็อกคงเหลือ: {unifiedModalPart.stock} {formData.unit}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      จุดเตือนต่ำ: {formData.min_stock} {formData.unit}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setUnifiedModalPart(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* View Tab Switcher (Only when editing existing part) */}
            {!isAddMode && (
              <div className="grid grid-cols-3 p-1 bg-muted/60 rounded-lg border border-border text-[11px] sm:text-xs">
                <button
                  type="button"
                  onClick={() => setModalTab("all")}
                  className={cn(
                    "py-1.5 px-1 sm:px-2.5 rounded-md font-medium transition-all text-center truncate",
                    modalTab === "all" ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="รวมทั้งหมด (All-in-One)"
                >
                  ✨ ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("stock")}
                  className={cn(
                    "py-1.5 px-1 sm:px-2.5 rounded-md font-medium transition-all text-center truncate",
                    modalTab === "stock" ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="ปรับสต็อก (Stock Adjust)"
                >
                  📦 ปรับสต็อก
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("master")}
                  className={cn(
                    "py-1.5 px-1 sm:px-2.5 rounded-md font-medium transition-all text-center truncate",
                    modalTab === "master" ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="ข้อมูล Master Data"
                >
                  🏷️ Master Data
                </button>
              </div>
            )}

            <form onSubmit={handleSaveUnified} className="space-y-4">
              {/* ── Section 1: Stock Adjustment ── */}
              {(modalTab === "all" || modalTab === "stock") && !isAddMode && (
                <div className="p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <ArrowUpDown className="h-4 w-4 text-primary" />
                      ปรับยอดสต็อกคงคลัง (Stock Adjustment)
                    </h4>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      ปัจจุบัน: <strong className="text-foreground">{unifiedModalPart.stock} {formData.unit}</strong>
                    </span>
                  </div>

                  {/* Adjust Action Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdjustAction("none")}
                      className={cn(
                        "py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all",
                        adjustAction === "none"
                          ? "bg-background text-foreground border-border shadow-2xs ring-1 ring-border"
                          : "text-muted-foreground hover:bg-background/60"
                      )}
                    >
                      ไม่ปรับยอด
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction("add")}
                      className={cn(
                        "py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all",
                        adjustAction === "add"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500 shadow-2xs"
                          : "text-muted-foreground hover:bg-emerald-50/50"
                      )}
                    >
                      + รับเข้าคลัง
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction("deduct")}
                      className={cn(
                        "py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all",
                        adjustAction === "deduct"
                          ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500 shadow-2xs"
                          : "text-muted-foreground hover:bg-red-50/50"
                      )}
                    >
                      - เบิก/ตัดจ่าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction("set")}
                      className={cn(
                        "py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all",
                        adjustAction === "set"
                          ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-2xs"
                          : "text-muted-foreground hover:bg-blue-50/50"
                      )}
                    >
                      ✎ กำหนดยอดตรง
                    </button>
                  </div>

                  {/* Quantity & Live Preview */}
                  {adjustAction !== "none" && (
                    <div className="p-3 bg-background rounded-lg border border-border/80 space-y-2.5 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                        {adjustAction === "set" ? (
                          <div className="space-y-1">
                            <Label className="text-xs">ระบุยอดคงคลังใหม่ ({formData.unit})</Label>
                            <Input
                              type="number"
                              min={0}
                              value={targetStock}
                              onChange={(e) => setTargetStock(Math.max(0, Number(e.target.value)))}
                              className="h-9 text-xs"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Label className="text-xs">
                              {adjustAction === "add" ? "จำนวนที่รับเข้า" : "จำนวนที่เบิก/ตัดจ่าย"} ({formData.unit})
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={adjustQty}
                              onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                              className="h-9 text-xs"
                            />
                          </div>
                        )}

                        {/* Live Preview Result Box */}
                        <div className="p-2 bg-muted/50 rounded-md border flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">ยอดสต็อกหลังปรับ:</span>
                          <span className="font-bold text-sm text-foreground">
                            {adjustAction === "add" && `${unifiedModalPart.stock + adjustQty} ${formData.unit}`}
                            {adjustAction === "deduct" && `${Math.max(0, unifiedModalPart.stock - adjustQty)} ${formData.unit}`}
                            {adjustAction === "set" && `${targetStock} ${formData.unit}`}
                          </span>
                        </div>
                      </div>

                      {/* Reason & Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-xs">เหตุผลการปรับยอด *</Label>
                          <Select value={adjustReason} onValueChange={setAdjustReason}>
                            <SelectTrigger className="w-full h-9 text-xs shadow-2xs">
                              <SelectValue placeholder="เลือกเหตุผล" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ตรวจนับสต็อกจริง">ตรวจนับสต็อกจริง (Physical Count)</SelectItem>
                              <SelectItem value="รับของเข้าคลังฉุกเฉิน">รับของเข้าคลังฉุกเฉิน</SelectItem>
                              <SelectItem value="ตัดจ่ายของชำรุด/สูญหาย">ตัดจ่ายของชำรุด/สูญหาย</SelectItem>
                              <SelectItem value="ปรับปรุงข้อผิดพลาดการคีย์">ปรับปรุงข้อผิดพลาดการคีย์</SelectItem>
                              <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">บันทึกช่วยจำ (Notes)</Label>
                          <Input
                            placeholder="ระบุเลขอ้างอิง หรือรายละเอียด..."
                            value={adjustNote}
                            onChange={(e) => setAdjustNote(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Section 2: Master Data ── */}
              {(modalTab === "all" || modalTab === "master" || isAddMode) && (
                <div className="space-y-3">
                  {!isAddMode && modalTab === "all" && (
                    <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5 pt-1 border-t">
                      <Package className="h-4 w-4 text-primary" />
                      ข้อมูล Master Data อะไหล่
                    </h4>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="part-name-input" className="text-xs">ชื่ออะไหล่ *</Label>
                      <Input
                        id="part-name-input"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="เช่น ลูกปืน SKF 6205"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="part-number-input" className="text-xs">Part Number / Code *</Label>
                      <Input
                        id="part-number-input"
                        required
                        value={formData.part_number}
                        onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                        placeholder="SP-001"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="part-category-select" className="text-xs">หมวดหมู่</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                      >
                        <SelectTrigger id="part-category-select" className="w-full h-9 text-xs shadow-2xs">
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bearing">Bearing (ลูกปืน)</SelectItem>
                          <SelectItem value="belt">Belt (สายพาน)</SelectItem>
                          <SelectItem value="seal">Seal / O-ring (ซีล)</SelectItem>
                          <SelectItem value="electrical">Electrical (ไฟฟ้า/เซนเซอร์)</SelectItem>
                          <SelectItem value="filter">Filter (ไส้กรอง)</SelectItem>
                          <SelectItem value="pneumatic">Pneumatic (ลม/กระบอกสูบ)</SelectItem>
                          <SelectItem value="lubricant">Lubricant (น้ำมันหล่อลื่น)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="part-unit-input" className="text-xs">หน่วยนับ</Label>
                      <Input
                        id="part-unit-input"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="ชิ้น / เส้น / ลิตร"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="part-price-input" className="text-xs">ราคา/หน่วย (฿)</Label>
                      <Input
                        id="part-price-input"
                        type="number"
                        min={0}
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {isAddMode && (
                      <div className="space-y-1">
                        <Label htmlFor="part-stock-input" className="text-xs">จำนวนสต็อกตั้งต้น</Label>
                        <Input
                          id="part-stock-input"
                          type="number"
                          min={0}
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label htmlFor="part-min-stock-input" className="text-xs">จุดเตือน Min Stock</Label>
                      <Input
                        id="part-min-stock-input"
                        type="number"
                        min={0}
                        value={formData.min_stock}
                        onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="part-location-input" className="text-xs">ตำแหน่งจัดเก็บ (Bin/Rack)</Label>
                      <Input
                        id="part-location-input"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="A-01-02"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className={cn("space-y-1", !isAddMode && "sm:col-span-1")}>
                      <Label htmlFor="part-supplier-input" className="text-xs">ผู้จำหน่าย (Supplier)</Label>
                      <Input
                        id="part-supplier-input"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="SKF Thailand"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setUnifiedModalPart(null)} className="h-9 text-xs">
                  ยกเลิก
                </Button>
                <Button type="submit" className="h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-2xs">
                  <Check className="h-4 w-4 shrink-0" />
                  <span className="truncate">{isAddMode ? "บันทึกอะไหล่ใหม่" : "บันทึกข้อมูล"}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
}
