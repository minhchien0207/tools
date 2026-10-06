// calculate-date-vue/scripts/lib/parseIcsHolidays.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseIcsHolidays } from "./parseIcsHolidays.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const vnIcs = readFileSync(join(root, "../fixtures/sample-vn.ics"), "utf8");
const enIcs = readFileSync(join(root, "../fixtures/sample-en.ics"), "utf8");

test("keeps only DESCRIPTION Ngày lễ", () => {
  const holidays = parseIcsHolidays(vnIcs, "vn-ngay-le");
  assert.deepEqual(
    holidays.map((h) => h.date).sort(),
    ["2026-01-01", "2026-05-01"],
  );
  assert.equal(
    holidays.find((h) => h.date === "2026-01-01")?.name,
    "Tết dương lịch",
  );
});

test("drops commemorative and workday events", () => {
  const holidays = parseIcsHolidays(vnIcs, "vn-ngay-le");
  assert.equal(
    holidays.some((h) => h.date === "2026-12-25"),
    false,
  );
  assert.equal(
    holidays.some((h) => h.date === "2026-01-10"),
    false,
  );
});

test("all-vevents keeps every DTSTART+SUMMARY event", () => {
  const holidays = parseIcsHolidays(enIcs, "all-vevents");
  assert.deepEqual(
    holidays.map((h) => h.date).sort(),
    ["2026-01-01", "2026-07-04"],
  );
  assert.equal(
    holidays.find((h) => h.date === "2026-01-01")?.name,
    "New Year's Day",
  );
});
