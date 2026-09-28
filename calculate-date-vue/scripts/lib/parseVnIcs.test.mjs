// calculate-date-vue/scripts/lib/parseVnIcs.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseVnHolidays } from "./parseVnIcs.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const ics = readFileSync(join(root, "../fixtures/sample-vn.ics"), "utf8");

test("keeps only DESCRIPTION Ngày lễ", () => {
  const holidays = parseVnHolidays(ics);
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
  const holidays = parseVnHolidays(ics);
  assert.equal(
    holidays.some((h) => h.date === "2026-12-25"),
    false,
  );
  assert.equal(
    holidays.some((h) => h.date === "2026-01-10"),
    false,
  );
});
