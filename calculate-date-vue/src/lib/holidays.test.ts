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
} from "./holidays";
import type { HolidayRecord } from "./holidays";

const sample: HolidayRecord[] = [
  { date: "2026-01-01", name: "Tết dương lịch" },
  { date: "2026-04-30", name: "Ngày giải phóng" },
  { date: "2026-05-01", name: "Ngày Quốc tế Lao động" },
  { date: "2025-09-02", name: "Quốc khánh" },
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
