// calculate-date-vue/scripts/fetch-vn-holidays.mjs
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseVnHolidays } from "./lib/parseVnIcs.mjs";

const SOURCE =
  "https://calendar.google.com/calendar/ical/vi.vietnamese%23holiday%40group.v.calendar.google.com/public/basic.ics";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "src/data/holidays-vn.json");

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) {
    throw new Error(`ICS fetch failed: HTTP ${res.status}`);
  }
  const icsText = await res.text();
  const holidays = parseVnHolidays(icsText);
  if (holidays.length === 0) {
    throw new Error("Parsed 0 holidays — refusing to overwrite");
  }

  const payload = {
    updatedAt: new Date().toISOString().slice(0, 10),
    source: SOURCE,
    holidays,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${holidays.length} holidays → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  // Do not overwrite existing file on failure (we never write until success above).
  if (existsSync(outPath)) {
    console.error("Left existing holidays-vn.json untouched.");
  }
  process.exit(1);
});
