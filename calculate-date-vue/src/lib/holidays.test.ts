// calculate-date-vue/src/lib/holidays.test.ts
import { expect, test } from "vitest";
import {
  toExcludedKey,
  resolveHolidayWindow,
  filterHolidaysForWindow,
  holidayKeys,
  mergeHolidaySelection,
  removeKeys,
  countExcludedHolidays,
  rehydrateHolidaySelection,
  HOLIDAY_COUNTRIES,
  getHolidaysForCountries,
  mergeHolidayChips,
  holidayInfoByKey,
} from "./holidays";
import type { HolidayRecord } from "./holidays";

const sample: HolidayRecord[] = [
  { date: "2026-01-01", name: "Tết dương lịch", country: "vn" },
  { date: "2026-04-30", name: "Ngày giải phóng", country: "vn" },
  { date: "2026-05-01", name: "Ngày Quốc tế Lao động", country: "vn" },
  { date: "2025-09-02", name: "Quốc khánh", country: "vn" },
];

test("toExcludedKey maps ISO to dd/MM/yyyy", () => {
  expect(toExcludedKey("2026-01-01")).toBe("01/01/2026");
});

test("resolveHolidayWindow range with end", () => {
  const w = resolveHolidayWindow(
    "1",
    new Date(2026, 3, 1),
    new Date(2026, 4, 15),
  );
  expect(w).toEqual({
    kind: "range",
    start: expect.any(Date),
    end: expect.any(Date),
  });
});

test("resolveHolidayWindow range without end uses start-only day", () => {
  const w = resolveHolidayWindow("1", new Date(2026, 0, 1), null);
  expect(w?.kind).toBe("range");
  if (w?.kind === "range") expect(w.end).toBeNull();
});

test("resolveHolidayWindow accumulate uses year of start", () => {
  const w = resolveHolidayWindow("2", new Date(2026, 5, 10), null);
  expect(w).toEqual({ kind: "year", year: 2026 });
});

test("resolveHolidayWindow null without start", () => {
  expect(resolveHolidayWindow("1", null, new Date())).toBeNull();
});

test("filter range inclusive", () => {
  const w = resolveHolidayWindow(
    "1",
    new Date(2026, 3, 30),
    new Date(2026, 4, 1),
  )!;
  const filtered = filterHolidaysForWindow(sample, w);
  expect(holidayKeys(filtered)).toEqual(["30/04/2026", "01/05/2026"]);
});

test("filter year", () => {
  const w = resolveHolidayWindow("2", new Date(2026, 0, 15), null)!;
  const filtered = filterHolidaysForWindow(sample, w);
  expect(holidayKeys(filtered)).toEqual([
    "01/01/2026",
    "30/04/2026",
    "01/05/2026",
  ]);
});

test("mergeHolidaySelection unions selected keys", () => {
  expect(
    mergeHolidaySelection(["02/01/2026"], ["01/01/2026", "01/05/2026"]),
  ).toEqual(["02/01/2026", "01/01/2026", "01/05/2026"]);
});

test("removeKeys drops listed keys only", () => {
  expect(
    removeKeys(["01/01/2026", "02/01/2026"], ["01/01/2026"]),
  ).toEqual(["02/01/2026"]);
});

test("countExcludedHolidays intersects", () => {
  expect(
    countExcludedHolidays(
      ["01/01/2026", "02/01/2026"],
      ["01/01/2026", "01/05/2026"],
    ),
  ).toBe(1);
});

test("rehydrateHolidaySelection intersects without forcing missing holidays", () => {
  const keysInWindow = ["01/01/2026", "30/04/2026", "01/05/2026"];
  expect(
    rehydrateHolidaySelection(
      ["02/01/2026", "01/01/2026", "01/05/2026"],
      keysInWindow,
    ),
  ).toEqual({
    selectedKeys: ["01/01/2026", "01/05/2026"],
    masterOn: true,
  });
});

test("rehydrateHolidaySelection master off when no holiday keys excluded", () => {
  expect(
    rehydrateHolidaySelection(["02/01/2026"], ["01/01/2026", "01/05/2026"]),
  ).toEqual({ selectedKeys: [], masterOn: false });
});

test("HOLIDAY_COUNTRIES is vn→jp→us→cn with short codes", () => {
  expect(HOLIDAY_COUNTRIES.map((c) => c.code)).toEqual([
    "vn",
    "jp",
    "us",
    "cn",
  ]);
  expect(HOLIDAY_COUNTRIES.map((c) => c.short)).toEqual([
    "VN",
    "JP",
    "US",
    "CN",
  ]);
});

test("getHolidaysForCountries returns only requested countries with tags", () => {
  const rows = getHolidaysForCountries(["vn", "us"]);
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every((r) => r.country === "vn" || r.country === "us")).toBe(
    true,
  );
  expect(rows.some((r) => r.country === "vn")).toBe(true);
  expect(rows.some((r) => r.country === "us")).toBe(true);
  expect(rows.some((r) => r.country === "jp" || r.country === "cn")).toBe(
    false,
  );
});

test("mergeHolidayChips merges same date into one chip with VN, US", () => {
  const records: HolidayRecord[] = [
    { date: "2026-01-01", name: "Tết dương lịch", country: "vn" },
    { date: "2026-01-01", name: "New Year's Day", country: "us" },
    { date: "2026-07-04", name: "Independence Day", country: "us" },
  ];
  const chips = mergeHolidayChips(records);
  expect(chips).toHaveLength(2);
  const ny = chips.find((c) => c.date === "2026-01-01")!;
  expect(ny.key).toBe("01/01/2026");
  expect(ny.countries).toEqual(["vn", "us"]);
  expect(ny.names).toEqual(["Tết dương lịch", "New Year's Day"]);
  expect(ny.label).toBe(
    "01/01/2026 · Tết dương lịch / New Year's Day · VN, US",
  );
});

test("mergeHolidayChips leaves a single key for shared dates", () => {
  const chips = mergeHolidayChips([
    { date: "2026-01-01", name: "A", country: "vn" },
    { date: "2026-01-01", name: "B", country: "jp" },
    { date: "2026-01-01", name: "A", country: "us" },
  ]);
  expect(chips).toHaveLength(1);
  expect(chips[0].key).toBe("01/01/2026");
  expect(chips[0].countries).toEqual(["vn", "jp", "us"]);
  expect(chips[0].names).toEqual(["A", "B"]);
  expect(chips[0].label).toContain("VN, JP, US");
});

test("holidayInfoByKey maps 01/01/2026 to label with holiday name", () => {
  const map = holidayInfoByKey([
    { date: "2026-01-01", name: "Tết dương lịch", country: "vn" },
  ]);
  expect(map.get("01/01/2026")?.label).toContain("Tết dương lịch");
});

test("holidayInfoByKey over all countries includes dates present in one-country subset", () => {
  const vnOnly = holidayInfoByKey(getHolidaysForCountries(["vn"]));
  const all = holidayInfoByKey();
  expect(vnOnly.size).toBeGreaterThan(0);
  for (const key of vnOnly.keys()) {
    expect(all.has(key)).toBe(true);
  }
});

test("filterHolidaysForWindow accepts records without country", () => {
  const w = resolveHolidayWindow(
    "1",
    new Date(2026, 0, 1),
    new Date(2026, 0, 1),
  )!;
  const filtered = filterHolidaysForWindow(
    [{ date: "2026-01-01", name: "Tết dương lịch" }],
    w,
  );
  expect(holidayKeys(filtered)).toEqual(["01/01/2026"]);
});
