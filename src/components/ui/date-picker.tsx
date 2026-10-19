import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string; // "YYYY-MM-DD"
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  variant?: "default" | "inline";
  /** If true (default), dates before today cannot be selected */
  disablePast?: boolean;
  /** Minimum selectable date (YYYY-MM-DD string or Date object) */
  minDate?: string | Date;
  /** Maximum selectable date (YYYY-MM-DD string or Date object) */
  maxDate?: string | Date;
  /** Custom matcher for disabling specific dates */
  disabledDates?: (date: Date) => boolean;
}

const parseDateValue = (val?: string | Date): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return new Date(val.getFullYear(), val.getMonth(), val.getDate());
    }
    return undefined;
  }
  const parts = val.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) return date;
  }
  return undefined;
};

const formatDateToValue = (date?: Date): string => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDisplay = (date?: Date): string => {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "วว/ดด/ปปปป",
  disabled = false,
  className,
  id,
  variant = "default",
  disablePast = true,
  minDate,
  maxDate,
  disabledDates,
}) => {
  const [open, setOpen] = React.useState(false);
  const selectedDate = React.useMemo(() => parseDateValue(value), [value]);

  const disabledMatcher = React.useCallback(
    (day: Date) => {
      const checkDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

      // 1. Disable past dates if disablePast is enabled
      if (disablePast) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (checkDay < startOfToday) {
          return true;
        }
      }

      // 2. Disable dates before minDate
      if (minDate) {
        const min = parseDateValue(minDate);
        if (min) {
          const startOfMin = new Date(min.getFullYear(), min.getMonth(), min.getDate());
          if (checkDay < startOfMin) {
            return true;
          }
        }
      }

      // 3. Disable dates after maxDate
      if (maxDate) {
        const max = parseDateValue(maxDate);
        if (max) {
          const endOfMax = new Date(max.getFullYear(), max.getMonth(), max.getDate());
          if (checkDay > endOfMax) {
            return true;
          }
        }
      }

      // 4. Custom disabled matcher
      if (disabledDates) {
        return disabledDates(day);
      }

      return false;
    },
    [disablePast, minDate, maxDate, disabledDates]
  );

  const handleSelect = (day?: Date) => {
    if (day && !disabledMatcher(day)) {
      onChange?.(formatDateToValue(day));
      setOpen(false);
    }
  };

  const handleSetToday = () => {
    const today = new Date();
    if (!disabledMatcher(today)) {
      onChange?.(formatDateToValue(today));
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange?.("");
    setOpen(false);
  };

  const displayText = selectedDate ? formatDisplay(selectedDate) : "";

  const friendlyDateText = selectedDate
    ? `วันที่ ${selectedDate.getDate()} ${THAI_MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
    : "ยังไม่ได้เลือกวันที่";

  const isTodayDisabled = React.useMemo(() => {
    return disabledMatcher(new Date());
  }, [disabledMatcher]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            variant === "default" &&
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            variant === "inline" &&
              "flex h-full w-full items-center justify-between bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-none",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayText || placeholder}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground ml-2 opacity-75 group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 z-50 bg-card border border-border shadow-xl rounded-xl overflow-hidden"
        align="start"
      >
        {/* Calendar Theme Header */}
        <div className="bg-primary/5 border-b border-border px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <CalendarIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground leading-tight">
                {friendlyDateText}
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                เลือกวันที่ต้องการ (ไม่สามารถเลือกวันย้อนหลังได้)
              </div>
            </div>
          </div>
        </div>

        {/* Custom Themed Calendar */}
        <div className="p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={disabledMatcher}
            initialFocus
          />
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-border bg-muted/20 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTodayDisabled}
              onClick={handleSetToday}
              className="h-7 text-xs px-2.5 bg-card hover:bg-accent hover:text-accent-foreground"
            >
              วันนี้
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                ล้างค่า
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs px-2.5 text-muted-foreground"
          >
            ปิด
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
