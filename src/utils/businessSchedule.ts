export type BusinessScheduleMode = "manual" | "automatic";

export interface BusinessDaySchedule {
  enabled: boolean;
  ranges: Array<{
    open: string;
    close: string;
  }>;
}

export interface BusinessSchedule {
  monday: BusinessDaySchedule;
  tuesday: BusinessDaySchedule;
  wednesday: BusinessDaySchedule;
  thursday: BusinessDaySchedule;
  friday: BusinessDaySchedule;
  saturday: BusinessDaySchedule;
  sunday: BusinessDaySchedule;
}

export interface BusinessScheduleSettings {
  open: boolean;
  scheduleMode: BusinessScheduleMode;
  schedule: BusinessSchedule;
}

export const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const DEFAULT_BUSINESS_SCHEDULE: BusinessSchedule = {
  monday: { enabled: true, ranges: [{ open: "11:30", close: "17:00" }] },
  tuesday: { enabled: true, ranges: [{ open: "11:30", close: "17:00" }] },
  wednesday: { enabled: false, ranges: [] },
  thursday: { enabled: false, ranges: [] },
  friday: { enabled: true, ranges: [{ open: "11:30", close: "17:00" }] },
  saturday: { enabled: true, ranges: [{ open: "11:30", close: "17:00" }] },
  sunday: { enabled: true, ranges: [{ open: "12:00", close: "16:00" }] },
};

export function timeToMinutes(time: string): number {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return 0;
  const [, h, m] = match;
  return Number(h) * 60 + Number(m);
}

export function isDayEnabled(dayName: keyof BusinessSchedule, schedule: BusinessSchedule): boolean {
  return schedule[dayName]?.enabled ?? false;
}

export function isBusinessOpenNow(
  settings: BusinessScheduleSettings,
  now: Date = new Date(),
): boolean {
  if (settings.scheduleMode === "manual") return settings.open;

  const dayKey = DAY_NAMES[now.getDay()] as keyof BusinessSchedule;
  const day = settings.schedule[dayKey] ?? { enabled: false, ranges: [] };
  if (!day.enabled) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return day.ranges.some(({ open, close }) => {
    const openMinutes = timeToMinutes(open);
    const closeMinutes = timeToMinutes(close);
    if (closeMinutes <= openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  });
}

export function getScheduleSummary(schedule: BusinessSchedule): string {
  const entries = DAY_NAMES.map((day) => {
    const config = schedule[day];
    if (!config.enabled || config.ranges.length === 0) {
      return `${day.slice(0, 3)}: cerrado`;
    }
    return `${day.slice(0, 3)}: ${config.ranges.map((range) => `${range.open}–${range.close}`).join(", ")}`;
  });
  return entries.join(" · ");
}
