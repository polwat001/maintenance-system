import { useState, useMemo } from "react";
import {
  Package, Search, Filter, Plus, Edit2, AlertTriangle, ArrowUpDown,
  Boxes, DollarSign, History, Check, X, RotateCcw, TrendingDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Modal states
  const [adjustModalPart, setAdjustModalPart] = useState<SparePartExtended | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>("ตรวจนับสต็อกจริง");
  const [adjustNote, setAdjustNote] = useState<string>("");

  const [editModalPart, setEditModalPart] = useState<SparePartExtended | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
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

  // Handle Stock Adjust
  const handleStockAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalPart) return;

    const delta = adjustType === "add" ? adjustQty : -adjustQty;
    const newStock = Math.max(0, adjustModalPart.stock + delta);

    setParts((prev) =>
      prev.map((p) =>
        p.id === adjustModalPart.id
          ? { ...p, stock: newStock }
          : p
      )
    );

    toast.success(
      `ปรับยอดสต็อก "${adjustModalPart.name}" ${adjustType === "add" ? "+" : "-"}${adjustQty} ${adjustModalPart.unit} สำเร็จ (คงเหลือ: ${newStock} ${adjustModalPart.unit})`
    );

    setAdjustModalPart(null);
    setAdjustQty(1);
    setAdjustNote("");
  };

  // Open Edit Modal
  const openEditModal = (part: SparePartExtended) => {
    setIsAddMode(false);
    setEditModalPart(part);
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
    setEditModalPart({} as any);
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

  // Handle Save Master (Add or Edit)
  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddMode) {
      const newPart: SparePartExtended = {
        id: `SP-${String(Date.now()).slice(-4)}`,
        name: formData.name,
        part_number: formData.part_number,
        category: formData.category,
        stock: Number(formData.stock),
        min_stock: Number(formData.min_stock),
        unit: formData.unit,
        unit_price: Number(formData.unit_price),
        location: formData.location,
        supplier: formData.supplier,
        monthly_usage: 0,
        pending_request_qty: 0,
      };
      setParts((prev) => [newPart, ...prev]);
      toast.success(`เพิ่มอะไหล่ใหม่ "${formData.name}" เข้าระบบเรียบร้อยแล้ว`);
    } else if (editModalPart) {
      setParts((prev) =>
        prev.map((p) =>
          p.id === editModalPart.id
            ? {
                ...p,
                name: formData.name,
                part_number: formData.part_number,
                category: formData.category,
                stock: Number(formData.stock),
                min_stock: Number(formData.min_stock),
                unit: formData.unit,
                unit_price: Number(formData.unit_price),
                location: formData.location,
                supplier: formData.supplier,
              }
            : p
        )
      );
      toast.success(`อัปเดตข้อมูลอะไหล่ "${formData.name}" เรียบร้อยแล้ว`);
    }
    setEditModalPart(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-purple-600" />
            จัดการอะไหล่ & ปรับยอดสต็อก (Spare Parts Master & Stock Adjustment)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            สิทธิ์ Superadmin: เพิ่ม/แก้ไข Master Data อะไหล่, ปรับปรุงสต็อกคงคลัง (Stock Override) พร้อมบันทึกประวัติ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openAddModal} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
            <Plus className="h-4 w-4 mr-1" /> เพิ่มอะไหล่ใหม่
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParts([...MOCK_SPARE_PARTS_EXTENDED])}
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> รีเซ็ต
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">รายการอะไหล่ทั้งหมด</p>
            <p className="text-2xl font-bold tabular-nums">{stats.totalSKUs} รายการ</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Boxes className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">สต็อกต่ำกว่าเกณฑ์</p>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{stats.lowStockCount} รายการ</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
            <TrendingDown className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">มูลค่าสต็อกรวม</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">
              ฿{stats.totalValuation.toLocaleString("th-TH")}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">สินค้าหมดสต็อก</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">{stats.outOfStockCount} รายการ</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-100 text-red-600 grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* ── Search & Filter Bar ── */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่ออะไหล่, รหัส Part No, ตำแหน่งจัดเก็บ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="กรองตามหมวดหมู่อะไหล่"
              className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">ทุกหมวดหมู่ ({parts.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({parts.filter((p) => p.category === c).length})
                </option>
              ))}
            </select>

            <Button
              variant={onlyLowStock ? "destructive" : "outline"}
              size="sm"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className="text-xs shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              เฉพาะสต็อกต่ำ ({stats.lowStockCount})
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Spare Parts Table ── */}
      <Card className="overflow-hidden border">
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
                          {/* Stock Adjust button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-purple-700 hover:bg-purple-50 border-purple-200"
                            onClick={() => {
                              setAdjustModalPart(part);
                              setAdjustType("add");
                              setAdjustQty(1);
                            }}
                            title="ปรับยอดสต็อกคงคลัง (Stock Adjustment)"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5 mr-1" /> ปรับสต็อก
                          </Button>

                          {/* Edit Master button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(part)}
                            title="แก้ไข Master Data"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
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

      {/* ── Modal 1: Stock Adjustment Modal ── */}
      {adjustModalPart && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-purple-600" />
                  ปรับยอดสต็อก (Stock Override)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {adjustModalPart.name} ({adjustModalPart.part_number})
                </p>
              </div>
              <button
                onClick={() => setAdjustModalPart(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between text-xs">
              <span className="text-muted-foreground">ยอดสต็อกปัจจุบัน:</span>
              <span className="font-bold text-sm text-foreground">
                {adjustModalPart.stock} {adjustModalPart.unit}
              </span>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ประเภทการปรับยอด</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={cn(
                      "py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                      adjustType === "add"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    + เพิ่มยอดรับเข้า
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("deduct")}
                    className={cn(
                      "py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                      adjustType === "deduct"
                        ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    - ลดยอดออก / ตัดจ่าย
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjust-qty-input">จำนวนที่ต้องการปรับ ({adjustModalPart.unit})</Label>
                <Input
                  id="adjust-qty-input"
                  type="number"
                  min={1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjust-reason-select">เหตุผลในการปรับยอด *</Label>
                <select
                  id="adjust-reason-select"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="ตรวจนับสต็อกจริง">ตรวจนับสต็อกจริง (Physical Count)</option>
                  <option value="รับของเข้าคลังฉุกเฉิน">รับของเข้าคลังฉุกเฉิน</option>
                  <option value="ตัดจ่ายของชำรุด/สูญหาย">ตัดจ่ายของชำรุด/สูญหาย</option>
                  <option value="ปรับปรุงข้อผิดพลาดการคีย์">ปรับปรุงข้อผิดพลาดการคีย์</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjust-notes-input">บันทึกช่วยจำ (Notes)</Label>
                <Input
                  id="adjust-notes-input"
                  placeholder="ระบุเลขอ้างอิง หรือรายละเอียดเพิ่มเติม..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAdjustModalPart(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  ยืนยันปรับสต็อก
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal 2: Add/Edit Master Data Modal ── */}
      {editModalPart && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-background space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  {isAddMode ? "เพิ่มอะไหล่ใหม่ (Add Master Part)" : "แก้ไขข้อมูลอะไหล่ (Edit Master)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAddMode ? "กรอกข้อมูลรายละเอียดอะไหล่เพื่อเพิ่มเข้าสู่ระบบ" : formData.part_number}
                </p>
              </div>
              <button
                onClick={() => setEditModalPart(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaster} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-name-input" className="text-xs">ชื่ออะไหล่ *</Label>
                  <Input
                    id="part-name-input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น ลูกปืน SKF 6205"
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-category-select" className="text-xs">หมวดหมู่</Label>
                  <select
                    id="part-category-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="bearing">Bearing (ลูกปืน)</option>
                    <option value="belt">Belt (สายพาน)</option>
                    <option value="seal">Seal / O-ring (ซีล)</option>
                    <option value="electrical">Electrical (ไฟฟ้า/เซนเซอร์)</option>
                    <option value="filter">Filter (ไส้กรอง)</option>
                    <option value="pneumatic">Pneumatic (ลม/กระบอกสูบ)</option>
                    <option value="lubricant">Lubricant (น้ำมันหล่อลื่น)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-unit-input" className="text-xs">หน่วยนับ</Label>
                  <Input
                    id="part-unit-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="ชิ้น / เส้น / ลิตร"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-stock-input" className="text-xs">จำนวนตั้งต้น</Label>
                  <Input
                    id="part-stock-input"
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-min-stock-input" className="text-xs">Min Stock (แจ้งเตือน)</Label>
                  <Input
                    id="part-min-stock-input"
                    type="number"
                    min={0}
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="part-location-input" className="text-xs">ตำแหน่งจัดเก็บ (Bin/Rack)</Label>
                  <Input
                    id="part-location-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="A-01-02"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="part-supplier-input" className="text-xs">ผู้จำหน่าย (Supplier)</Label>
                  <Input
                    id="part-supplier-input"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="SKF Thailand"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setEditModalPart(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  {isAddMode ? "บันทึกอะไหล่ใหม่" : "บันทึกการแก้ไข"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
