// calculate-date-vue/src/lib/holidays.ts
import { format, getYear, isWithinInterval, startOfDay } from "date-fns";
import vnDataset from "@/data/holidays-vn.json";
import jpDataset from "@/data/holidays-jp.json";
import usDataset from "@/data/holidays-us.json";
import cnDataset from "@/data/holidays-cn.json";

export type CountryCode = "vn" | "jp" | "us" | "cn";

export type HolidayRecord = {
  date: string;
  name: string;
  country: CountryCode;
};

export type HolidayDataset = {
  updatedAt: string;
  source: string;
  holidays: { date: string; name: string }[];
};

export type HolidayWindow =
  | { kind: "range"; start: Date; end: Date | null }
  | { kind: "year"; year: number };

export type HolidayChip = {
  key: string;
  date: string;
  label: string;
  names: string[];
  countries: CountryCode[];
};

export const HOLIDAY_COUNTRIES: {
  code: CountryCode;
  label: string;
  short: string;
}[] = [
  { code: "vn", label: "Việt Nam", short: "VN" },
  { code: "jp", label: "Nhật Bản", short: "JP" },
  { code: "us", label: "Hoa Kỳ", short: "US" },
  { code: "cn", label: "Trung Quốc", short: "CN" },
];

/**
 * Fixed high-contrast dots for calendar cells. New countries take the next
 * index in `HOLIDAY_COUNTRIES` (`i % length`). Hues are interleaved so
 * neighboring registry entries stay easy to tell apart.
 */
export const COUNTRY_DOT_PALETTE = [
  "#E53935", // red — vn
  "#F9A825", // amber — jp
  "#1E88E5", // blue — us
  "#43A047", // green — cn
  "#8E24AA", // purple
  "#00897B", // teal
  "#D81B60", // magenta
  "#3949AB", // indigo
  "#EF6C00", // deep orange
  "#6D4C41", // brown
  "#00ACC1", // cyan
  "#7B1FA2", // deep purple
  "#C62828", // dark red
  "#2E7D32", // dark green
  "#5C6BC0", // soft indigo
  "#00838F", // dark cyan
  "#AD1457", // dark pink
  "#546E7A", // blue grey
  "#6A1B9A", // violet
  "#FF7043", // coral
] as const;

const COUNTRY_ORDER: Record<CountryCode, number> = {
  vn: 0,
  jp: 1,
  us: 2,
  cn: 3,
};

/** Dot color for a registry country (`HOLIDAY_COUNTRIES` index % palette). */
export function colorForCountry(code: CountryCode): string {
  const i = HOLIDAY_COUNTRIES.findIndex((c) => c.code === code);
  const idx = i >= 0 ? i : 0;
  return COUNTRY_DOT_PALETTE[idx % COUNTRY_DOT_PALETTE.length]!;
}

export const holidayDatasets: Record<CountryCode, HolidayDataset> = {
  vn: vnDataset as HolidayDataset,
  jp: jpDataset as HolidayDataset,
  us: usDataset as HolidayDataset,
  cn: cnDataset as HolidayDataset,
};

/** @deprecated Prefer holidayDatasets / getHolidaysForCountries */
export const vnHolidaysDataset = holidayDatasets.vn;

export function tagHolidays(
  dataset: HolidayDataset,
  code: CountryCode,
): HolidayRecord[] {
  return dataset.holidays.map((h) => ({
    date: h.date,
    name: h.name,
    country: code,
  }));
}

export function getHolidaysForCountries(
  codes: CountryCode[],
): HolidayRecord[] {
  const wanted = new Set(codes);
  const out: HolidayRecord[] = [];
  for (const { code } of HOLIDAY_COUNTRIES) {
    if (!wanted.has(code)) continue;
    out.push(...tagHolidays(holidayDatasets[code], code));
  }
  return out;
}

export function mergeHolidayChips(
  records: HolidayRecord[],
): HolidayChip[] {
  const byDate = new Map<string, HolidayRecord[]>();
  for (const r of records) {
    const list = byDate.get(r.date);
    if (list) list.push(r);
    else byDate.set(r.date, [r]);
  }

  const dates = [...byDate.keys()].sort();
  return dates.map((date) => {
    const group = byDate.get(date)!;
    group.sort(
      (a, b) => COUNTRY_ORDER[a.country] - COUNTRY_ORDER[b.country],
    );

    const countries: CountryCode[] = [];
    const names: string[] = [];
    const seenCountry = new Set<CountryCode>();
    const seenName = new Set<string>();

    for (const r of group) {
      if (!seenCountry.has(r.country)) {
        seenCountry.add(r.country);
        countries.push(r.country);
      }
      if (!seenName.has(r.name)) {
        seenName.add(r.name);
        names.push(r.name);
      }
    }

    const key = toExcludedKey(date);
    const shorts = countries.map(
      (c) => HOLIDAY_COUNTRIES.find((x) => x.code === c)!.short,
    );
    const label = `${key} · ${names.join(" / ")} · ${shorts.join(", ")}`;
    return { key, date, label, names, countries };
  });
}

export type HolidayKeyInfo = {
  label: string;
  countries: CountryCode[];
  /** Per-country colors in registry order (for multi-dot calendar marks). */
  colors: string[];
};

export function holidayInfoByKey(
  records?: HolidayRecord[],
): Map<string, HolidayKeyInfo> {
  const source =
    records ??
    getHolidaysForCountries(HOLIDAY_COUNTRIES.map((c) => c.code));
  const map = new Map<string, HolidayKeyInfo>();
  for (const chip of mergeHolidayChips(source)) {
    map.set(chip.key, {
      label: chip.label,
      countries: chip.countries,
      colors: chip.countries.map(colorForCountry),
    });
  }
  return map;
}

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

export function filterHolidaysForWindow<T extends { date: string }>(
  holidays: T[],
  window: HolidayWindow,
): T[] {
  return holidays.filter((h) => {
    const d = parseIsoToDate(h.date);
    if (window.kind === "year") return getYear(d) === window.year;
    if (!window.end) {
      return format(d, "yyyy-MM-dd") === format(window.start, "yyyy-MM-dd");
    }
    return isWithinInterval(d, { start: window.start, end: window.end });
  });
}

export function holidayKeys(holidays: { date: string }[]): string[] {
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

/** Restore chip/master state from excludedDates without forcing missing holidays on. */
export function rehydrateHolidaySelection(
  excludedDates: string[],
  keysInWindow: string[],
): { selectedKeys: string[]; masterOn: boolean } {
  const excluded = new Set(excludedDates);
  const selectedKeys = keysInWindow.filter((k) => excluded.has(k));
  return {
    selectedKeys,
    masterOn: selectedKeys.length > 0,
  };
}
