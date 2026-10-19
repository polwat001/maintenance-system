import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Plus, Pencil, Trash2, Play, History,
  Check, X, Flag, LogOut, LayoutDashboard, Save,
  CheckCircle2, GripVertical, ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  MOCK_CHECKSHEET_TEMPLATES,
  MOCK_CHECKSHEET_RECORDS,
  ChecksheetTemplate,
  ChecksheetRecord,
  ChecksheetItem,
  ChecksheetColumn,
  ChecksheetColumnType,
  ChecksheetCellValue,
  timeAgo,
} from '@/lib/mockData';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<ChecksheetTemplate['frequency'], string> = {
  daily: 'รายวัน',
  weekly: 'รายสัปดาห์',
  monthly: 'รายเดือน',
  per_shift: 'รายกะ',
};

const FREQ_COLOR: Record<ChecksheetTemplate['frequency'], string> = {
  daily: 'bg-blue-100 text-blue-700',
  weekly: 'bg-violet-100 text-violet-700',
  monthly: 'bg-amber-100 text-amber-700',
  per_shift: 'bg-emerald-100 text-emerald-700',
};

const COL_TYPE_LABEL: Record<ChecksheetColumnType, string> = {
  checkbox: 'Checkbox',
  pass_fail: 'ผ่าน/ไม่ผ่าน',
  number: 'ตัวเลข',
  text: 'ข้อความ',
  dropdown: 'ตัวเลือก',
  rating: 'คะแนน (1-5)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChecksheetRecord['status'] }) {
  const map = {
    complete: 'bg-emerald-100 text-emerald-700',
    partial: 'bg-amber-100 text-amber-700',
    flagged: 'bg-red-100 text-red-700',
  };
  const icons = { complete: '✅', partial: '🟡', flagged: '🚩' };
  const labels = { complete: 'ครบถ้วน', partial: 'บางส่วน', flagged: 'พบปัญหา' };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', map[status])}>
      {icons[status]} {labels[status]}
    </span>
  );
}

// ─── FillView ─────────────────────────────────────────────────────────────────

function FillView({
  template,
  onClose,
  onSubmit,
}: {
  template: ChecksheetTemplate;
  onClose: () => void;
  onSubmit: (rec: ChecksheetRecord) => void;
}) {
  const [values, setValues] = useState<ChecksheetCellValue[]>([]);
  const [note, setNote] = useState('');
  const [shift, setShift] = useState<'A' | 'B' | 'C'>('A');
  const [submitted, setSubmitted] = useState(false);

  const getCellVal = (itemId: string, colId: string) =>
    values.find((v) => v.item_id === itemId && v.col_id === colId)?.value;

  const setCellVal = (itemId: string, colId: string, value: string | boolean | number) => {
    setValues((prev) => {
      const filtered = prev.filter((v) => !(v.item_id === itemId && v.col_id === colId));
      return [...filtered, { item_id: itemId, col_id: colId, value }];
    });
  };

  const isFlagged = values.some((v) => typeof v.value === 'boolean' && v.value === false);

  const handleSubmit = () => {
    const rec: ChecksheetRecord = {
      record_id: `REC-${Date.now()}`,
      template_id: template.template_id,
      template_name: template.name,
      completed_by: 'สมศักดิ์ ช่างไฟ',
      department: 'ฝ่ายซ่อมบำรุง',
      shift,
      values,
      note,
      submitted_at: new Date().toISOString(),
      status: isFlagged ? 'flagged' : 'complete',
    };
    onSubmit(rec);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card border shadow-2xl p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 grid place-items-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">บันทึกสำเร็จ!</h3>
        <p className="text-muted-foreground text-sm mb-6">
          {isFlagged ? 'พบรายการที่ไม่ผ่าน กรุณาติดตามการแก้ไข' : 'เช็คชีทได้รับการบันทึกเรียบร้อยแล้ว'}
        </p>
        <Button onClick={onClose} className="w-full">ปิด</Button>
      </div>
    </div>
  );

  const grouped: Record<string, ChecksheetItem[]> = {};
  for (const item of template.items) {
    const g = item.group ?? 'ทั่วไป';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(item);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="sticky top-0 z-10 text-white px-4 py-3 flex items-center gap-3 shadow-md"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="h-8 w-8 rounded-lg grid place-items-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <ClipboardList className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>กรอกเช็คชีท</p>
          <h2 className="font-bold truncate">{template.name}</h2>
        </div>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)' }} className="hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-5xl mx-auto w-full">
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">กะ</label>
            <div className="flex gap-1">
              {(['A', 'B', 'C'] as const).map((s) => (
                <button key={s} onClick={() => setShift(s)}
                  className={cn('h-8 w-8 rounded-md border text-sm font-bold transition-colors',
                    shift === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted border-border')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-full">หัวข้อตรวจสอบ</th>
                {template.columns.map((col) => (
                  <th key={col.col_id}
                    className={cn('px-3 py-2 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap',
                      col.width === 'sm' ? 'min-w-[80px]' : col.width === 'lg' ? 'min-w-[200px]' : 'min-w-[120px]')}>
                    {col.label}{col.required && <span className="text-red-500 ml-0.5">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([group, items]) => (
                <>
                  <tr key={`g-${group}`} className="bg-muted/30">
                    <td colSpan={template.columns.length + 1} className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </td>
                  </tr>
                  {items.map((item, idx) => {
                    const rowBg = idx % 2 === 0 ? '' : 'bg-muted/10';
                    return (
                      <tr key={item.item_id} className={cn('border-b hover:bg-muted/20 transition-colors', rowBg)}>
                        <td className="px-3 py-2.5 text-sm font-medium">{item.order}. {item.topic}</td>
                        {template.columns.map((col) => {
                          const val = getCellVal(item.item_id, col.col_id);
                          return (
                            <td key={col.col_id} className="px-3 py-2 text-center">
                              {col.type === 'pass_fail' && (
                                <div className="flex justify-center gap-1">
                                  <button onClick={() => setCellVal(item.item_id, col.col_id, true)}
                                    className={cn('h-7 w-7 rounded-md border text-xs font-bold transition-colors',
                                      val === true ? 'bg-emerald-500 text-white border-emerald-500' : 'hover:bg-emerald-50 border-border')}>
                                    ✓
                                  </button>
                                  <button onClick={() => setCellVal(item.item_id, col.col_id, false)}
                                    className={cn('h-7 w-7 rounded-md border text-xs font-bold transition-colors',
                                      val === false ? 'bg-red-500 text-white border-red-500' : 'hover:bg-red-50 border-border')}>
                                    ✗
                                  </button>
                                </div>
                              )}
                              {col.type === 'checkbox' && (
                                <input type="checkbox" checked={val === true}
                                  onChange={(e) => setCellVal(item.item_id, col.col_id, e.target.checked)}
                                  className="h-4 w-4 rounded cursor-pointer" />
                              )}
                              {col.type === 'text' && (
                                <input type="text" value={(val as string) ?? ''}
                                  onChange={(e) => setCellVal(item.item_id, col.col_id, e.target.value)}
                                  className="w-full rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="ระบุ..." />
                              )}
                              {col.type === 'number' && (
                                <input type="number" value={(val as string) ?? ''}
                                  onChange={(e) => setCellVal(item.item_id, col.col_id, e.target.value)}
                                  className="w-20 rounded border bg-background px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary" />
                              )}
                              {col.type === 'dropdown' && (
                                <select value={(val as string) ?? ''}
                                  onChange={(e) => setCellVal(item.item_id, col.col_id, e.target.value)}
                                  className="rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                                  <option value="">-</option>
                                  {col.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              )}
                              {col.type === 'rating' && (
                                <div className="flex justify-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} onClick={() => setCellVal(item.item_id, col.col_id, n)}
                                      className={cn('h-6 w-6 rounded text-xs font-bold transition-colors',
                                        (val as number) >= n ? 'bg-amber-400 text-white' : 'bg-muted text-muted-foreground hover:bg-amber-100')}>
                                      {n}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">หมายเหตุ</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ระบุหมายเหตุ..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        {isFlagged && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
            <Flag className="h-4 w-4 shrink-0" />
            <span>พบรายการที่ไม่ผ่านการตรวจสอบ ระบบจะ Flag เพื่อให้ติดตาม</span>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t px-4 py-3 flex gap-3 max-w-5xl mx-auto w-full">
        <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSubmit}>
          <Save className="h-4 w-4 mr-2" /> บันทึกเช็คชีท
        </Button>
      </div>
    </div>
  );
}

// ─── TemplateEditor ───────────────────────────────────────────────────────────

function TemplateEditor({
  template,
  onClose,
  onSave,
}: {
  template: ChecksheetTemplate | null;
  onClose: () => void;
  onSave: (t: ChecksheetTemplate) => void;
}) {
  const isNew = template === null;
  const [name, setName] = useState(template?.name ?? '');
  const [desc, setDesc] = useState(template?.description ?? '');
  const [freq, setFreq] = useState<ChecksheetTemplate['frequency']>(template?.frequency ?? 'daily');
  const [machineType, setMachineType] = useState(template?.machine_type ?? '');
  const [items, setItems] = useState<ChecksheetItem[]>(template?.items ?? []);
  const [columns, setColumns] = useState<ChecksheetColumn[]>(template?.columns ?? [
    { col_id: 'c1', label: 'ผล', type: 'pass_fail', required: true, width: 'sm' },
    { col_id: 'c2', label: 'หมายเหตุ', type: 'text', required: false, width: 'lg' },
  ]);

  const addItem = () => {
    const n: ChecksheetItem = { item_id: `i${Date.now()}`, order: items.length + 1, topic: '', group: '' };
    setItems((p) => [...p, n]);
  };
  const updateItem = (id: string, field: keyof ChecksheetItem, val: string | number) =>
    setItems((p) => p.map((it) => it.item_id === id ? { ...it, [field]: val } : it));
  const removeItem = (id: string) => setItems((p) => p.filter((it) => it.item_id !== id));

  const addColumn = () => {
    const n: ChecksheetColumn = { col_id: `c${Date.now()}`, label: 'คอลัมน์ใหม่', type: 'text', required: false, width: 'md' };
    setColumns((p) => [...p, n]);
  };
  const updateColumn = (id: string, field: keyof ChecksheetColumn, val: string | boolean) =>
    setColumns((p) => p.map((c) => c.col_id === id ? { ...c, [field]: val } : c));
  const removeColumn = (id: string) => setColumns((p) => p.filter((c) => c.col_id !== id));

  const handleSave = () => {
    const t: ChecksheetTemplate = {
      template_id: template?.template_id ?? `CS-TPL-${Date.now()}`,
      name, description: desc, frequency: freq, machine_type: machineType,
      items: items.map((it, i) => ({ ...it, order: i + 1 })),
      columns, active: true,
      created_by: 'ผู้จัดการฝ่ายซ่อมบำรุง',
      created_at: template?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(t);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="sticky top-0 z-10 text-white px-4 py-3 flex items-center gap-3 shadow-md"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
        <div className="h-8 w-8 rounded-lg grid place-items-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Pencil className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{isNew ? 'สร้าง Template ใหม่' : 'แก้ไข Template'}</p>
          <h2 className="font-bold">{name || '(ยังไม่มีชื่อ)'}</h2>
        </div>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)' }} className="hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />ข้อมูลพื้นฐาน
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">ชื่อเช็คชีท *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ตรวจสอบเครื่องจักรรายวัน" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">ประเภทเครื่องจักร</label>
              <Input value={machineType} onChange={(e) => setMachineType(e.target.value)} placeholder="เช่น Hydraulic Press" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">คำอธิบาย</label>
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="อธิบายวัตถุประสงค์..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">ความถี่</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FREQ_LABEL) as ChecksheetTemplate['frequency'][]).map((f) => (
                <button key={f} onClick={() => setFreq(f)}
                  className={cn('rounded-full px-3 py-1 text-xs font-semibold border transition-colors',
                    freq === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                  {FREQ_LABEL[f]}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-primary" />คอลัมน์ ({columns.length})
            </h3>
            <Button variant="outline" size="sm" onClick={addColumn} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> เพิ่มคอลัมน์
            </Button>
          </div>
          <div className="space-y-2">
            {columns.map((col) => (
              <div key={col.col_id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input className="h-8 text-sm flex-1" value={col.label} onChange={(e) => updateColumn(col.col_id, 'label', e.target.value)} placeholder="ชื่อคอลัมน์" />
                <select value={col.type} onChange={(e) => updateColumn(col.col_id, 'type', e.target.value as ChecksheetColumnType)}
                  className="h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  {(Object.keys(COL_TYPE_LABEL) as ChecksheetColumnType[]).map((t) => (
                    <option key={t} value={t}>{COL_TYPE_LABEL[t]}</option>
                  ))}
                </select>
                <select value={col.width ?? 'md'} onChange={(e) => updateColumn(col.col_id, 'width', e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="sm">แคบ</option>
                  <option value="md">กลาง</option>
                  <option value="lg">กว้าง</option>
                </select>
                <button onClick={() => removeColumn(col.col_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />หัวข้อตรวจสอบ ({items.length})
            </h3>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> เพิ่มหัวข้อ
            </Button>
          </div>
          {items.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">ยังไม่มีหัวข้อ กด "เพิ่มหัวข้อ" เพื่อเริ่มต้น</p>
          )}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.item_id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">{idx + 1}</span>
                <Input className="h-8 text-sm flex-1" value={item.topic} onChange={(e) => updateItem(item.item_id, 'topic', e.target.value)} placeholder="ชื่อหัวข้อตรวจสอบ..." />
                <Input className="h-8 text-sm w-28" value={item.group ?? ''} onChange={(e) => updateItem(item.item_id, 'group', e.target.value)} placeholder="กลุ่ม..." />
                <button onClick={() => removeItem(item.item_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t px-4 py-3 flex gap-3 max-w-4xl mx-auto w-full">
        <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
        <Button className="flex-1 bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSave} disabled={!name.trim()}>
          <Save className="h-4 w-4 mr-2" /> {isNew ? 'สร้าง Template' : 'บันทึกการเปลี่ยนแปลง'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Checksheet() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ChecksheetTemplate[]>(MOCK_CHECKSHEET_TEMPLATES);
  const [records, setRecords] = useState<ChecksheetRecord[]>(MOCK_CHECKSHEET_RECORDS);
  const [fillTarget, setFillTarget] = useState<ChecksheetTemplate | null>(null);
  const [editTarget, setEditTarget] = useState<ChecksheetTemplate | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'templates' | 'records'>('templates');

  const kpi = useMemo(() => {
    const total = templates.filter((t) => t.active).length;
    const now = new Date();
    const todayRecs = records.filter((r) => new Date(r.submitted_at).toDateString() === now.toDateString()).length;
    const flagged = records.filter((r) => r.status === 'flagged').length;
    return { total, todayRecs, flagged, totalRecs: records.length };
  }, [templates, records]);

  const handleSaveTemplate = (t: ChecksheetTemplate) => {
    setTemplates((prev) => {
      const ex = prev.find((x) => x.template_id === t.template_id);
      return ex ? prev.map((x) => x.template_id === t.template_id ? t : x) : [t, ...prev];
    });
    setEditTarget(undefined);
  };

  const handleSubmitRecord = (rec: ChecksheetRecord) => {
    setRecords((p) => [rec, ...p]);
    setFillTarget(null);
  };

  const handleDeleteTemplate = (id: string) =>
    setTemplates((p) => p.map((t) => t.template_id === id ? { ...t, active: false } : t));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 shadow-md"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: 'white' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md grid place-items-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Checksheet System</div>
            <h1 className="font-bold truncate">ระบบเช็คชีท</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {kpi.flagged > 0 && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.4)' }}>
                <Flag className="h-3 w-3" /> พบปัญหา {kpi.flagged}
              </span>
            )}
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.1)' }}>
              วันนี้ {kpi.todayRecs} รายการ
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10"
              onClick={() => navigate('/admin/dashboard')} aria-label="Dashboard">
              <LayoutDashboard className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10"
              onClick={() => navigate('/')} aria-label="ออกจากระบบ">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Template ทั้งหมด', value: kpi.total, b: 'border-l-indigo-500' },
            { label: 'กรอกแล้ววันนี้', value: kpi.todayRecs, b: 'border-l-emerald-500' },
            { label: 'พบปัญหา (Flag)', value: kpi.flagged, b: 'border-l-red-500' },
            { label: 'บันทึกทั้งหมด', value: kpi.totalRecs, b: 'border-l-slate-400' },
          ].map((k) => (
            <Card key={k.label} className={cn('p-4 border-l-4 hover:shadow-md transition-shadow', k.b)}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</p>
              <p className="text-3xl font-bold tabular-nums mt-0.5">{k.value}</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
          {[
            { key: 'templates', label: 'Template เช็คชีท', icon: <ClipboardList className="h-4 w-4" /> },
            { key: 'records', label: 'ประวัติการกรอก', icon: <History className="h-4 w-4" /> },
          ].map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key as 'templates' | 'records')}
              className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2',
                activeTab === t.key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setEditTarget(null)} className="gap-2 bg-slate-800 hover:bg-slate-900 text-white">
                <Plus className="h-4 w-4" /> สร้าง Template ใหม่
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {templates.filter((t) => t.active).map((t) => {
                const recCount = records.filter((r) => r.template_id === t.template_id).length;
                const lastRec = records.filter((r) => r.template_id === t.template_id)[0];
                return (
                  <Card key={t.template_id} className="p-5 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', FREQ_COLOR[t.frequency])}>
                          {FREQ_LABEL[t.frequency]}
                        </span>
                        <h3 className="font-semibold text-sm leading-tight">{t.name}</h3>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-muted p-2"><p className="text-muted-foreground">หัวข้อ</p><p className="font-bold">{t.items.length} รายการ</p></div>
                      <div className="rounded-md bg-muted p-2"><p className="text-muted-foreground">คอลัมน์</p><p className="font-bold">{t.columns.length} คอลัมน์</p></div>
                      <div className="rounded-md bg-muted p-2"><p className="text-muted-foreground">บันทึกแล้ว</p><p className="font-bold">{recCount} ครั้ง</p></div>
                      <div className="rounded-md bg-muted p-2"><p className="text-muted-foreground">ล่าสุด</p><p className="font-bold">{lastRec ? timeAgo(lastRec.submitted_at) : '-'}</p></div>
                    </div>
                    {lastRec && (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={lastRec.status} />
                        <span className="text-xs text-muted-foreground">โดย {lastRec.completed_by}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setFillTarget(t)}>
                        <Play className="h-3.5 w-3.5" /> กรอกเช็คชีท
                      </Button>
                      <button onClick={() => setEditTarget(t)}
                        className="rounded-md border p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteTemplate(t.template_id)}
                        className="rounded-md border p-2 hover:bg-red-50 hover:border-red-200 transition-colors text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">ประวัติการกรอกเช็คชีท</h3>
              </div>
              <span className="text-xs text-muted-foreground">{records.length} รายการ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">เช็คชีท</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">กรอกโดย</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">กะ / เครื่องจักร</th>
                    <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                    <th className="px-4 py-3 text-left font-medium">เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={rec.record_id} className={cn('border-b last:border-0 transition-colors hover:bg-muted/30', i % 2 !== 0 && 'bg-muted/10')}>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-primary">{rec.record_id}</p>
                        <p className="font-medium text-sm">{rec.template_name}</p>
                        {rec.note && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{rec.note}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm">
                        {rec.completed_by}<br /><span className="text-xs text-muted-foreground">{rec.department}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {rec.shift && <span className="rounded bg-muted px-1.5 py-0.5 font-mono mr-1">กะ {rec.shift}</span>}
                        {rec.machine_id ?? '-'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={rec.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(rec.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {fillTarget && (
        <FillView template={fillTarget} onClose={() => setFillTarget(null)} onSubmit={handleSubmitRecord} />
      )}
      {editTarget !== undefined && (
        <TemplateEditor template={editTarget} onClose={() => setEditTarget(undefined)} onSave={handleSaveTemplate} />
      )}
    </div>
  );
}
