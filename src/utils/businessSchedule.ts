export const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export type BusinessDayName = (typeof WEEK_DAYS)[number];

export interface BusinessTimeRange {
  open: string;
  close: string;
}

export interface BusinessDaySchedule {
  enabled: boolean;
  ranges: BusinessTimeRange[];
}

export type BusinessSchedule = Record<BusinessDayName, BusinessDaySchedule>;
export type BusinessScheduleMode = "automatic" | "manual";

export interface BusinessScheduleState {
  open: boolean;
  scheduleMode?: BusinessScheduleMode;
  schedule?: Partial<BusinessSchedule> | BusinessSchedule;
}

const normalizeTime = (value: string): string => {
  if (typeof value !== "string") return "00:00";
  const match = /^\d{1,2}:\d{2}$/.exec(value.trim());
  if (!match) return "00:00";
  const [hoursRaw, minutesRaw] = value.trim().split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "00:00";
  const normalizedHours = Math.min(23, Math.max(0, hours));
  const normalizedMinutes = Math.min(59, Math.max(0, minutes));
  return `${String(normalizedHours).padStart(2, "0")}:${String(normalizedMinutes).padStart(2, "0")}`;
};

export const timeToMinutes = (value: string): number => {
  const normalized = normalizeTime(value);
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
};

const isInRange = (nowMinutes: number, range: BusinessTimeRange): boolean => {
  const start = timeToMinutes(range.open);
  const end = timeToMinutes(range.close);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return false;
  if (start < end) return nowMinutes >= start && nowMinutes < end;
  return nowMinutes >= start || nowMinutes < end;
};

export const DEFAULT_BUSINESS_SCHEDULE: BusinessSchedule = {
  monday: { enabled: true, ranges: [{ open: "11:30", close: "21:00" }] },
  tuesday: { enabled: true, ranges: [{ open: "11:30", close: "21:00" }] },
  wednesday: { enabled: true, ranges: [{ open: "11:30", close: "21:00" }] },
  thursday: { enabled: true, ranges: [{ open: "11:30", close: "21:00" }] },
  friday: { enabled: true, ranges: [{ open: "11:30", close: "21:00" }] },
  saturday: { enabled: true, ranges: [{ open: "11:30", close: "21:00" }] },
  sunday: { enabled: true, ranges: [{ open: "11:30", close: "21:00" }] },
};

export function normalizeBusinessSchedule(raw?: Partial<BusinessSchedule> | BusinessSchedule | null): BusinessSchedule {
  return WEEK_DAYS.reduce((acc, day) => {
    const entry = raw?.[day] ?? DEFAULT_BUSINESS_SCHEDULE[day];
    const ranges = Array.isArray(entry?.ranges) && entry.ranges.length > 0
      ? entry.ranges
          .map((range) => ({
            open: normalizeTime(range.open),
            close: normalizeTime(range.close),
          }))
          .filter((range) => range.open !== "00:00" || range.close !== "00:00")
      : DEFAULT_BUSINESS_SCHEDULE[day].ranges.map((range) => ({ ...range }));

    acc[day] = { enabled: entry?.enabled !== false, ranges };
    return acc;
  }, {} as BusinessSchedule);
}

export function isBusinessOpenNow(settings: BusinessScheduleState, now = new Date()): boolean {
  if (settings.scheduleMode === "manual") return settings.open;
  const schedule = normalizeBusinessSchedule(settings.schedule ?? DEFAULT_BUSINESS_SCHEDULE);
  const dayIndex = (now.getDay() + 6) % 7;
  const day = WEEK_DAYS[dayIndex];
  const daySchedule = schedule[day];
  if (!daySchedule?.enabled) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return daySchedule.ranges.some((range) => isInRange(nowMinutes, range));
}

export function getEffectiveOpen(settings: BusinessScheduleState, now = new Date()): boolean {
  return settings.scheduleMode === "manual" ? settings.open : isBusinessOpenNow(settings, now);
}
