import * as React from "react";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TimePickerProps {
  value?: string; // "HH:mm" (24-hour format)
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  variant?: "default" | "inline";
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const QUICK_MINUTES = ["00", "15", "30", "45"];
const COMMON_TIMES = ["08:00", "10:00", "12:00", "13:00", "15:00", "17:00"];

export const TimePicker: React.FC<TimePickerProps> = ({
  value = "",
  onChange,
  placeholder = "--:--",
  disabled = false,
  className,
  id,
  variant = "default",
}) => {
  const [open, setOpen] = React.useState(false);

  // Parse current value
  const [hour, minute] = React.useMemo(() => {
    if (!value || !value.includes(":")) return ["", ""];
    const [h, m] = value.split(":");
    return [h.padStart(2, "0"), m.padStart(2, "0")];
  }, [value]);

  const selectedHourRef = React.useRef<HTMLButtonElement | null>(null);
  const selectedMinuteRef = React.useRef<HTMLButtonElement | null>(null);

  // Scroll to selected hour and minute when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        selectedHourRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
        selectedMinuteRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
      }, 50);
    }
  }, [open]);

  const handleSelectHour = (newHour: string) => {
    const targetMinute = minute || "00";
    onChange?.(`${newHour}:${targetMinute}`);
  };

  const handleSelectMinute = (newMinute: string) => {
    const now = new Date();
    const targetHour = hour || String(now.getHours()).padStart(2, "0");
    onChange?.(`${targetHour}:${newMinute}`);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    onChange?.(`${h}:${m}`);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.("");
    setOpen(false);
  };

  // Format 12-hour equivalent for friendly display
  const friendlyTime = React.useMemo(() => {
    if (!hour || !minute) return "ยังไม่ได้เลือกเวลา";
    const hNum = parseInt(hour, 10);
    const period = hNum >= 12 ? "PM" : "AM";
    const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
    return `${hour}:${minute} น. (${String(h12).padStart(2, "0")}:${minute} ${period})`;
  }, [hour, minute]);

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
          <span className="font-mono text-sm tracking-wide">
            {value ? `${value} น.` : placeholder}
          </span>
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground ml-auto opacity-75 group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 sm:w-80 p-0 z-50 bg-card border border-border shadow-xl rounded-xl overflow-hidden"
        align="start"
      >
        {/* Header */}
        <div className="bg-primary/5 border-b border-border px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground leading-tight">
                {friendlyTime}
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                เลือกชั่วโมงและนาที
              </div>
            </div>
          </div>
          {value && (
            <div className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {value}
            </div>
          )}
        </div>

        {/* Quick Minute Chips */}
        <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 border-b border-border/60 bg-muted/10 text-xs">
          <span className="text-[11px] text-muted-foreground mr-1">นาทีด่วน:</span>
          {QUICK_MINUTES.map((qm) => {
            const active = minute === qm;
            return (
              <button
                key={qm}
                type="button"
                onClick={() => handleSelectMinute(qm)}
                className={cn(
                  "px-2 py-0.5 rounded text-xs transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                :{qm}
              </button>
            );
          })}
        </div>

        {/* Columns for Hours and Minutes */}
        <div className="grid grid-cols-2 divide-x divide-border p-2">
          {/* Hour Column */}
          <div className="flex flex-col">
            <div className="text-[11px] font-semibold text-muted-foreground text-center pb-1.5 uppercase tracking-wider">
              ชั่วโมง
            </div>
            <div className="h-52 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
              {HOURS.map((h) => {
                const isSelected = hour === h;
                return (
                  <button
                    key={h}
                    ref={isSelected ? selectedHourRef : null}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    className={cn(
                      "w-full h-8 flex items-center justify-center rounded-md text-sm font-mono transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minute Column */}
          <div className="flex flex-col pl-2">
            <div className="text-[11px] font-semibold text-muted-foreground text-center pb-1.5 uppercase tracking-wider">
              นาที
            </div>
            <div className="h-52 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
              {MINUTES.map((m) => {
                const isSelected = minute === m;
                return (
                  <button
                    key={m}
                    ref={isSelected ? selectedMinuteRef : null}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    className={cn(
                      "w-full h-8 flex items-center justify-center rounded-md text-sm font-mono transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Common Times Presets */}
        <div className="px-3 py-1.5 border-t border-border/60 bg-muted/10 flex items-center justify-between gap-1 overflow-x-auto text-xs">
          <span className="text-[10px] text-muted-foreground shrink-0">เวลาหลัก:</span>
          {COMMON_TIMES.map((ct) => (
            <button
              key={ct}
              type="button"
              onClick={() => {
                onChange?.(ct);
                setOpen(false);
              }}
              className={cn(
                "px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors shrink-0",
                value === ct
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground"
              )}
            >
              {ct}
            </button>
          ))}
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-border bg-muted/20 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetCurrentTime}
              className="h-7 text-xs px-2.5 bg-card hover:bg-accent hover:text-accent-foreground"
            >
              เวลานี้
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
            variant="default"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs px-3"
          >
            ตกลง
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
