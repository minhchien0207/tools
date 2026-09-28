// calculate-date-vue/src/lib/holidays.ts
import { format, getYear, isWithinInterval, startOfDay } from "date-fns";
import dataset from "@/data/holidays-vn.json";

export type HolidayRecord = { date: string; name: string };
export type HolidayDataset = {
  updatedAt: string;
  source: string;
  holidays: HolidayRecord[];
};

export type HolidayWindow =
  | { kind: "range"; start: Date; end: Date | null }
  | { kind: "year"; year: number };

export const vnHolidaysDataset = dataset as HolidayDataset;

export function toExcludedKey(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return format(new Date(y, m - 1, d), "dd/MM/yyyy");
}

export function parseIsoToDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

export function resolveHolidayWindow(
  calcType: string,
  startDate: Date | null,
  endDate: Date | null,
): HolidayWindow | null {
  if (!startDate) return null;
  const start = startOfDay(startDate);
  if (calcType === "2") {
    return { kind: "year", year: getYear(start) };
  }
  return {
    kind: "range",
    start,
    end: endDate ? startOfDay(endDate) : null,
  };
}

export function filterHolidaysForWindow(
  holidays: HolidayRecord[],
  window: HolidayWindow,
): HolidayRecord[] {
  return holidays.filter((h) => {
    const d = parseIsoToDate(h.date);
    if (window.kind === "year") return getYear(d) === window.year;
    if (!window.end) {
      return format(d, "yyyy-MM-dd") === format(window.start, "yyyy-MM-dd");
    }
    return isWithinInterval(d, { start: window.start, end: window.end });
  });
}

export function holidayKeys(holidays: HolidayRecord[]): string[] {
  return holidays.map((h) => toExcludedKey(h.date));
}

export function mergeHolidaySelection(
  excludedDates: string[],
  selectedKeys: string[],
): string[] {
  const set = new Set(excludedDates);
  for (const k of selectedKeys) set.add(k);
  return [...set];
}

export function removeKeys(
  excludedDates: string[],
  keysToRemove: string[],
): string[] {
  const drop = new Set(keysToRemove);
  return excludedDates.filter((k) => !drop.has(k));
}

export function countExcludedHolidays(
  excludedDates: string[],
  holidayKeyList: string[],
): number {
  const set = new Set(excludedDates);
  let n = 0;
  for (const k of holidayKeyList) if (set.has(k)) n++;
  return n;
}
