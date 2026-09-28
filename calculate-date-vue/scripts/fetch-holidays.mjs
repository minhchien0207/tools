// calculate-date-vue/scripts/fetch-holidays.mjs
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HOLIDAY_SOURCES } from "./lib/holidaySources.mjs";
import { parseIcsHolidays } from "./lib/parseIcsHolidays.mjs";

const VALID = new Set(["vn", "jp", "us", "cn", "all"]);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {import("./lib/holidaySources.mjs").HolidaySource} source
 */
async function fetchOne(source) {
  const outPath = join(root, source.outFile);
  const res = await fetch(source.icsUrl);
  if (!res.ok) {
    throw new Error(`${source.code}: ICS fetch failed: HTTP ${res.status}`);
  }
  const icsText = await res.text();
  const holidays = parseIcsHolidays(icsText, source.includeRule);
  if (holidays.length === 0) {
    throw new Error(`${source.code}: Parsed 0 holidays — refusing to overwrite`);
  }

  const payload = {
    updatedAt: new Date().toISOString().slice(0, 10),
    source: source.icsUrl,
    holidays,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[${source.code}] Wrote ${holidays.length} holidays → ${source.outFile}`,
  );
  return outPath;
}

async function main() {
  const arg = process.argv[2];
  if (!arg || !VALID.has(arg)) {
    console.error(
      "Usage: node scripts/fetch-holidays.mjs <vn|jp|us|cn|all>",
    );
    process.exit(1);
  }

  const sources =
    arg === "all"
      ? HOLIDAY_SOURCES
      : HOLIDAY_SOURCES.filter((s) => s.code === arg);

  if (sources.length === 0) {
    throw new Error(`Unknown country code: ${arg}`);
  }

  for (const source of sources) {
    try {
      await fetchOne(source);
    } catch (err) {
      const outPath = join(root, source.outFile);
      console.error(err);
      if (existsSync(outPath)) {
        console.error(
          `Left existing ${source.outFile} untouched.`,
        );
      }
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
