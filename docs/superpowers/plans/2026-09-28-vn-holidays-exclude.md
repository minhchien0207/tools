# VN Holidays Exclude Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users toggle Vietnamese public holidays into `excludedDates` from `CalculatorForm`, using a bundled JSON snapshot derived from Google’s VN holiday ICS.

**Architecture:** A Node script fetches/filters the ICS into `src/data/holidays-vn.json`. Pure helpers in `src/lib/holidays.ts` resolve the date window, format keys, and sync selections into `excludedDates`. `CalculatorForm` owns the checkbox + chips UI; `App.vue` passes a count into `CriteriaSummary` for a read-only chip. `useDateCalculator.calculate()` stays unchanged.

**Tech Stack:** Vue 3 + Vite + TypeScript + date-fns + Tailwind (existing); Vitest for unit tests; Node `fetch` in an ESM script.

**Spec:** `docs/superpowers/specs/2026-09-28-vn-holidays-exclude-design.md`

## Global Constraints

- Phase 1: Việt Nam only; no multi-country selector.
- No runtime fetch of ICS or JSON; static import of `src/data/holidays-vn.json` only.
- Keep calculation logic on existing `excludedDates` (`dd/MM/yyyy`); do not change `calculate()` formula.
- Filter ICS to events whose unfolded DESCRIPTION first line equals exactly `Ngày lễ` (drop `Ngày lễ kỷ niệm` and workdays).
- UI block lives in `CalculatorForm` after “Loại trừ thứ”, before “Loại trừ ngày cụ thể”; `CriteriaSummary` is display-only.
- GitHub Action / Actions Variables refresh is out of scope (manual `npm run holidays:vn` + commit).
- Paths are under repo root `calculate-date-vue/` unless noted; design/plan docs live at repo-root `docs/`.
- Match existing form chrome: `#0071e3` selected chips, `active:scale`, `prefers-reduced-motion` cross-fade only.

---

## File structure

| File | Responsibility |
| --- | --- |
| `calculate-date-vue/scripts/lib/parseVnIcs.mjs` | Pure ICS unfold + parse + filter → holiday records |
| `calculate-date-vue/scripts/fetch-vn-holidays.mjs` | Fetch ICS URL, call parser, write JSON (no overwrite on failure) |
| `calculate-date-vue/scripts/fixtures/sample-vn.ics` | Tiny fixture for parser tests |
| `calculate-date-vue/scripts/lib/parseVnIcs.test.mjs` | Node test runner tests for parser |
| `calculate-date-vue/src/data/holidays-vn.json` | Bundled snapshot `{ updatedAt, source, holidays }` |
| `calculate-date-vue/src/lib/holidays.ts` | Types, window resolve, filter, key format, sync, count |
| `calculate-date-vue/src/lib/holidays.test.ts` | Vitest unit tests |
| `calculate-date-vue/src/components/CalculatorForm.vue` | Master checkbox + holiday chips + sync emits |
| `calculate-date-vue/src/components/CriteriaSummary.vue` | Chip `Lễ VN · N` |
| `calculate-date-vue/src/App.vue` | Compute `vnHolidayExcludedCount`, pass prop |
| `calculate-date-vue/package.json` | Scripts `holidays:vn`, `test`, vitest dep |
| `calculate-date-vue/vitest.config.ts` | Vitest + `@` alias |

---

### Task 1: Vitest harness

**Files:**
- Create: `calculate-date-vue/vitest.config.ts`
- Modify: `calculate-date-vue/package.json`
- Test: harness smoke via `npm test` (will pass empty / placeholder until Task 3)

**Interfaces:**
- Consumes: existing Vite `@` alias pattern from `vite.config.ts`
- Produces: `npm test` runs Vitest over `src/**/*.test.ts`

- [ ] **Step 1: Add Vitest config**

```ts
// calculate-date-vue/vitest.config.ts
import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Install Vitest and add npm scripts**

From `calculate-date-vue/`:

```bash
npm install -D vitest
```

In `package.json` `scripts`, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"holidays:vn": "node scripts/fetch-vn-holidays.mjs"
```

- [ ] **Step 3: Verify Vitest runs (no tests yet is OK)**

Run: `cd calculate-date-vue && npm test`  
Expected: Vitest exits 0 or reports “No test files found” / similar non-failure. If it fails on “no tests”, add a temporary `src/lib/holidays.test.ts` with `import { expect, test } from "vitest"; test("harness", () => expect(true).toBe(true));` and remove that stub in Task 3 when real tests land.

- [ ] **Step 4: Commit**

```bash
cd /home/chienbm/test/tools
git add calculate-date-vue/package.json calculate-date-vue/package-lock.json calculate-date-vue/vitest.config.ts
git commit -m "chore: add vitest harness for holiday helpers"
```

---

### Task 2: ICS parser + fetch script + snapshot JSON

**Files:**
- Create: `calculate-date-vue/scripts/lib/parseVnIcs.mjs`
- Create: `calculate-date-vue/scripts/lib/parseVnIcs.test.mjs`
- Create: `calculate-date-vue/scripts/fixtures/sample-vn.ics`
- Create: `calculate-date-vue/scripts/fetch-vn-holidays.mjs`
- Create: `calculate-date-vue/src/data/holidays-vn.json` (via script)
- Test: `node --test calculate-date-vue/scripts/lib/parseVnIcs.test.mjs`

**Interfaces:**
- Consumes: Google ICS URL (constant in fetch script)
- Produces:
  - `unfoldIcs(text: string): string`
  - `parseVnHolidays(icsText: string): { date: string, name: string }[]` — ISO `yyyy-MM-dd`, only DESCRIPTION first line `=== "Ngày lễ"`
  - `fetch-vn-holidays.mjs` writes `src/data/holidays-vn.json`:
    `{ updatedAt: string, source: string, holidays: { date: string, name: string }[] }`

- [ ] **Step 1: Write fixture ICS**

```ics
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260101
SUMMARY:Tết dương lịch
DESCRIPTION:Ngày lễ
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20261225
SUMMARY:Giáng sinh/Nôen
DESCRIPTION:Ngày lễ kỷ niệm\nĐể ẩn các ngày lễ kỷ niệm
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260501
SUMMARY:Ngày Quốc tế Lao động
DESCRIPTION:Ngày lễ
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260110
SUMMARY:Ngày làm việc (Tết Nguyên Đán)
DESCRIPTION:Ngày lễ kỷ niệm
END:VEVENT
END:VCALENDAR
```

Save as `calculate-date-vue/scripts/fixtures/sample-vn.ics`.

- [ ] **Step 2: Write failing parser test**

```js
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
```

- [ ] **Step 3: Run test — expect FAIL**

Run: `cd calculate-date-vue && node --test scripts/lib/parseVnIcs.test.mjs`  
Expected: FAIL (module not found / export missing).

- [ ] **Step 4: Implement parser**

```js
// calculate-date-vue/scripts/lib/parseVnIcs.mjs

/** @param {string} text */
export function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * @param {string} icsText
 * @returns {{ date: string, name: string }[]}
 */
export function parseVnHolidays(icsText) {
  const text = unfoldIcs(icsText);
  const holidays = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const body = block.split("END:VEVENT")[0] ?? "";
    const desc = field(body, "DESCRIPTION");
    const firstLine = (desc ?? "").split("\\n")[0].trim();
    if (firstLine !== "Ngày lễ") continue;

    const dt = field(body, "DTSTART");
    const summary = field(body, "SUMMARY");
    if (!dt || !summary) continue;

    const date = normalizeIcsDate(dt);
    if (!date) continue;

    holidays.push({ date, name: unescapeIcs(summary) });
  }

  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return holidays;
}

/** @param {string} body @param {string} name */
function field(body, name) {
  const re = new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "m");
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

/** @param {string} raw DTSTART value possibly with params already stripped by field() */
function normalizeIcsDate(raw) {
  // field() already stripped `DTSTART;VALUE=DATE:` → value like 20260101
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** @param {string} value */
function unescapeIcs(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
```

- [ ] **Step 5: Run parser tests — expect PASS**

Run: `cd calculate-date-vue && node --test scripts/lib/parseVnIcs.test.mjs`  
Expected: 2 tests PASS.

- [ ] **Step 6: Implement fetch script**

```js
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
```

- [ ] **Step 7: Generate snapshot**

Run: `cd calculate-date-vue && npm run holidays:vn`  
Expected: console shows wrote N holidays (roughly 160+ for “Ngày lễ” only); file `src/data/holidays-vn.json` exists with `holidays` array.

Spot-check:

```bash
node -e "const j=require('./src/data/holidays-vn.json'); console.log(j.holidays.length, j.holidays.slice(0,3))"
```

Expected: length > 100; sample dates ISO; no Christmas-only commemorative if DESCRIPTION was kỷ niệm.

- [ ] **Step 8: Commit**

```bash
cd /home/chienbm/test/tools
git add calculate-date-vue/scripts calculate-date-vue/src/data/holidays-vn.json calculate-date-vue/package.json
git commit -m "feat: add VN holiday ICS parser and bundled snapshot"
```

---

### Task 3: `holidays.ts` window filter + key helpers

**Files:**
- Create: `calculate-date-vue/src/lib/holidays.ts`
- Create: `calculate-date-vue/src/lib/holidays.test.ts`
- Modify: none else yet

**Interfaces:**
- Consumes: `HolidayRecord` shape `{ date: string; name: string }` from JSON (`date` = `yyyy-MM-dd`)
- Produces:
  - `export type HolidayRecord = { date: string; name: string }`
  - `export type HolidayDataset = { updatedAt: string; source: string; holidays: HolidayRecord[] }`
  - `export type HolidayWindow = { kind: "range"; start: Date; end: Date | null } | { kind: "year"; year: number }`
  - `toExcludedKey(isoDate: string): string` → `dd/MM/yyyy`
  - `resolveHolidayWindow(calcType: string, startDate: Date | null, endDate: Date | null): HolidayWindow | null`
  - `filterHolidaysForWindow(holidays: HolidayRecord[], window: HolidayWindow): HolidayRecord[]`
  - `holidayKeys(holidays: HolidayRecord[]): string[]`

- [ ] **Step 1: Write failing Vitest tests**

```ts
// calculate-date-vue/src/lib/holidays.test.ts
import { describe, expect, test } from "vitest";
import {
  toExcludedKey,
  resolveHolidayWindow,
  filterHolidaysForWindow,
  holidayKeys,
  mergeHolidaySelection,
  removeKeys,
  countExcludedHolidays,
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
```

Note: `mergeHolidaySelection` / `removeKeys` / `countExcludedHolidays` are implemented in this same module in Step 3 (keep one file; Task 3 owns all pure helpers).

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd calculate-date-vue && npm test`  
Expected: FAIL — cannot find module `./holidays` or exports missing.

- [ ] **Step 3: Implement `holidays.ts`**

```ts
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
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd calculate-date-vue && npm test`  
Expected: all tests in `holidays.test.ts` PASS.

- [ ] **Step 5: Typecheck**

Run: `cd calculate-date-vue && npm run type-check`  
Expected: no errors (JSON import allowed via `resolveJsonModule`).

- [ ] **Step 6: Commit**

```bash
cd /home/chienbm/test/tools
git add calculate-date-vue/src/lib/holidays.ts calculate-date-vue/src/lib/holidays.test.ts
git commit -m "feat: add holiday window filter and excludedDates sync helpers"
```

---

### Task 4: CalculatorForm — master checkbox + holiday chips

**Files:**
- Modify: `calculate-date-vue/src/components/CalculatorForm.vue`
- Test: manual UI steps below + `npm run type-check`

**Interfaces:**
- Consumes:
  - props already present: `calcType`, `startDate`, `endDate`, `excludedDates`
  - `vnHolidaysDataset`, `resolveHolidayWindow`, `filterHolidaysForWindow`, `toExcludedKey`, `mergeHolidaySelection`, `removeKeys` from `@/lib/holidays`
- Produces: emits `update:excludedDates` when master/chip selection changes (same event as today)

- [ ] **Step 1: Add script-setup state and sync helpers**

Inside `<script setup lang="ts">` of `CalculatorForm.vue`, after existing imports/props/emits:

```ts
import { computed, ref, watch } from "vue";
import {
  vnHolidaysDataset,
  resolveHolidayWindow,
  filterHolidaysForWindow,
  toExcludedKey,
  mergeHolidaySelection,
  removeKeys,
} from "@/lib/holidays";

const excludeVnHolidays = ref(false);
/** Keys (`dd/MM/yyyy`) currently selected in the holiday chip list */
const selectedHolidayKeys = ref<string[]>([]);
/** Previous window's selected keys — used to strip stale holiday keys on window change */
const prevHolidayKeysInWindow = ref<string[]>([]);

const holidayWindow = computed(() =>
  resolveHolidayWindow(props.calcType, props.startDate, props.endDate),
);

const holidaysInWindow = computed(() => {
  const w = holidayWindow.value;
  if (!w) return [];
  return filterHolidaysForWindow(vnHolidaysDataset.holidays, w);
});

const holidayChips = computed(() =>
  holidaysInWindow.value.map((h) => ({
    key: toExcludedKey(h.date),
    label: `${toExcludedKey(h.date)} · ${h.name}`,
  })),
);

const canUseHolidays = computed(() => !!props.startDate);

function applyHolidaySync(nextSelected: string[], keysInWindow: string[]) {
  // Drop any holiday keys that were in the previous window selection handling,
  // then union the new selection. Also remove keys that are in-window but unselected.
  let next = removeKeys(props.excludedDates, prevHolidayKeysInWindow.value);
  next = removeKeys(next, keysInWindow);
  next = mergeHolidaySelection(next, nextSelected);
  prevHolidayKeysInWindow.value = [...nextSelected];
  emit("update:excludedDates", next);
}

function onToggleMaster(checked: boolean) {
  excludeVnHolidays.value = checked;
  const keysInWindow = holidayChips.value.map((c) => c.key);
  if (!checked) {
    selectedHolidayKeys.value = [];
    applyHolidaySync([], keysInWindow);
    return;
  }
  selectedHolidayKeys.value = [...keysInWindow];
  applyHolidaySync(selectedHolidayKeys.value, keysInWindow);
}

function toggleHolidayChip(key: string) {
  if (!excludeVnHolidays.value) return;
  const set = new Set(selectedHolidayKeys.value);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  selectedHolidayKeys.value = [...set];
  const keysInWindow = holidayChips.value.map((c) => c.key);
  applyHolidaySync(selectedHolidayKeys.value, keysInWindow);
}

watch(
  holidaysInWindow,
  (list) => {
    if (!excludeVnHolidays.value) {
      prevHolidayKeysInWindow.value = [];
      return;
    }
    const keysInWindow = list.map((h) => toExcludedKey(h.date));
    const keySet = new Set(keysInWindow);
    // Keep prior selection for keys still in window; newly entered keys default ON
    const kept = selectedHolidayKeys.value.filter((k) => keySet.has(k));
    const keptSet = new Set(kept);
    const newly = keysInWindow.filter((k) => !keptSet.has(k));
    selectedHolidayKeys.value = [...kept, ...newly];
    applyHolidaySync(selectedHolidayKeys.value, keysInWindow);
  },
  { flush: "post" },
);
```

If `vue` `computed`/`ref`/`watch` are already imported, merge imports instead of duplicating.

**Sync rule to honor:** when master is OFF, do not leave `prevHolidayKeysInWindow` stuck so a later manual date cannot be removed incorrectly — clearing both selected and prev on OFF is required (shown above).

- [ ] **Step 2: Insert template block**

Place **after** the “Loại trừ thứ” section and **before** “Loại trừ ngày cụ thể”:

```vue
      <!-- Loại trừ ngày lễ VN -->
      <div class="min-w-0">
        <div class="flex items-center justify-between gap-3">
          <label
            class="text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
            for="exclude-vn-holidays"
          >
            Loại trừ ngày lễ VN
          </label>
          <input
            id="exclude-vn-holidays"
            type="checkbox"
            class="size-4 accent-[#0071e3] disabled:opacity-40"
            :checked="excludeVnHolidays"
            :disabled="!canUseHolidays"
            @change="
              onToggleMaster(($event.target as HTMLInputElement).checked)
            "
          />
        </div>
        <p
          v-if="!canUseHolidays"
          class="mt-1 text-xs tracking-[-0.01em] text-[#86868b]"
        >
          Chọn ngày bắt đầu trước
        </p>
        <div
          v-else-if="excludeVnHolidays"
          class="animate-fade-in mt-2 motion-reduce:animate-none"
        >
          <p
            v-if="!holidayChips.length"
            class="text-xs tracking-[-0.01em] text-[#86868b]"
          >
            Không có ngày lễ trong khoảng này
          </p>
          <div
            v-else
            class="relative max-h-40 overflow-y-auto"
          >
            <div class="flex flex-wrap gap-1.5 pb-1">
              <button
                v-for="chip in holidayChips"
                :key="chip.key"
                type="button"
                class="inline-flex cursor-pointer items-center rounded-full border py-[0.3rem] px-[0.65rem] text-xs font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                :class="
                  selectedHolidayKeys.includes(chip.key)
                    ? 'border-[#0071e3]/30 bg-[#0071e3]/10 text-[#0071e3]'
                    : 'border-[#d2d2d7] bg-white/85 text-[#86868b]'
                "
                :aria-pressed="selectedHolidayKeys.includes(chip.key)"
                :title="chip.label"
                @click="toggleHolidayChip(chip.key)"
              >
                <span class="tabular-nums">{{ chip.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 3: Typecheck**

Run: `cd calculate-date-vue && npm run type-check`  
Expected: PASS.

- [ ] **Step 4: Manual UI smoke (dev server)**

Run: `cd calculate-date-vue && npm run dev`

1. Open form; holiday checkbox disabled + caption “Chọn ngày bắt đầu trước”.
2. Set start `01/01/2026`, end `15/05/2026`, calcType khoảng ngày; enable checkbox → chips appear selected (Tết / 30-4 / 1-5 etc.).
3. Deselect one chip → that date leaves the blue “Loại trừ ngày cụ thể” chip row (or never appears there if not mirrored — **spec:** sync into `excludedDates`, so it should appear in the specific-dates chips too; both lists share the same array).  
   If dual display is noisy, leave it: same data is correct per spec.
4. Disable master → holiday keys removed from `excludedDates`.
5. Switch to Cộng dồn with start in 2026 → list is full year 2026 holidays when master ON.

- [ ] **Step 5: Commit**

```bash
cd /home/chienbm/test/tools
git add calculate-date-vue/src/components/CalculatorForm.vue
git commit -m "feat: add VN holiday exclude checkbox and chips to form"
```

---

### Task 5: App count + CriteriaSummary chip

**Files:**
- Modify: `calculate-date-vue/src/App.vue`
- Modify: `calculate-date-vue/src/components/CriteriaSummary.vue`
- Test: `npm run type-check` + manual calculate flow

**Interfaces:**
- Consumes: `resolveHolidayWindow`, `filterHolidaysForWindow`, `holidayKeys`, `countExcludedHolidays`, `vnHolidaysDataset`
- Produces: prop `vnHolidayExcludedCount: number` on `CriteriaSummary`

- [ ] **Step 1: Update CriteriaSummary props + chip**

In `CriteriaSummary.vue` props:

```ts
const props = defineProps<{
  calcType: string;
  startDate: Date | null;
  endDate: Date | null;
  totalDays: number | null;
  methodType: string;
  excludedDays: number[];
  excludedDates: string[];
  vnHolidayExcludedCount: number;
}>();
```

In the chip row (with other summary chips), add:

```vue
        <span
          v-if="vnHolidayExcludedCount > 0"
          class="inline-flex items-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#0071e3]"
          >Lễ VN · {{ vnHolidayExcludedCount }}</span
        >
```

Adjust the “Không loại trừ” condition so it stays hidden when `vnHolidayExcludedCount > 0` **or** other excludes exist:

```vue
        <span
          v-if="!excludedLabel && !excludedDatesLabel && vnHolidayExcludedCount === 0"
          class="inline-flex items-center rounded-full bg-black/8 px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#86868b]"
          >Không loại trừ</span
        >
```

- [ ] **Step 2: Compute count in App.vue**

```ts
import { computed } from "vue";
import {
  vnHolidaysDataset,
  resolveHolidayWindow,
  filterHolidaysForWindow,
  holidayKeys,
  countExcludedHolidays,
} from "@/lib/holidays";

const vnHolidayExcludedCount = computed(() => {
  const w = resolveHolidayWindow(
    calcType.value,
    startDate.value,
    endDate.value,
  );
  if (!w) return 0;
  const keys = holidayKeys(
    filterHolidaysForWindow(vnHolidaysDataset.holidays, w),
  );
  return countExcludedHolidays(excludedDates.value, keys);
});
```

Pass to summary:

```vue
        <CriteriaSummary
          v-else
          :calcType="calcType"
          :startDate="startDate"
          :endDate="endDate"
          :totalDays="totalDays"
          :methodType="methodType"
          :excludedDays="excludedDays"
          :excludedDates="excludedDates"
          :vnHolidayExcludedCount="vnHolidayExcludedCount"
          @edit="editing = true"
        />
```

- [ ] **Step 3: Typecheck + build**

Run:

```bash
cd calculate-date-vue && npm run type-check && npm test && npm run build
```

Expected: all PASS; build outputs under `dist/`.

- [ ] **Step 4: Manual end-to-end**

1. Enable VN holidays for a range covering 01/05/2026; Calculate.
2. Summary shows `Lễ VN · N` with N ≥ 1.
3. Result grid does not include selected holiday dates.
4. Edit → uncheck one holiday → Calculate again → count decreases; that date can reappear in results.

- [ ] **Step 5: Commit**

```bash
cd /home/chienbm/test/tools
git add calculate-date-vue/src/App.vue calculate-date-vue/src/components/CriteriaSummary.vue
git commit -m "feat: show VN holiday exclude count on criteria summary"
```

---

### Task 6: Final verification checklist

**Files:** none new

- [ ] **Step 1: Re-run automated checks**

```bash
cd calculate-date-vue
node --test scripts/lib/parseVnIcs.test.mjs
npm test
npm run type-check
npm run build
```

Expected: all green.

- [ ] **Step 2: Confirm success criteria from spec**

- [ ] Checkbox + chips work without CORS/proxy.
- [ ] Selected holidays excluded via existing `excludedDates`.
- [ ] Weekday + manual date exclude flows still work.
- [ ] Snapshot refresh documented: `npm run holidays:vn` then commit `src/data/holidays-vn.json`.

- [ ] **Step 3: Optional docs touch**

If `calculate-date-vue/README.md` is still the Vite stub, append a short “Holidays” note:

```md
## Ngày lễ VN

- Data: `src/data/holidays-vn.json` (bundled)
- Refresh: `npm run holidays:vn` then commit the JSON file
```

- [ ] **Step 4: Commit README if changed**

```bash
git add calculate-date-vue/README.md
git commit -m "docs: note VN holiday snapshot refresh command"
```

---

## Spec coverage self-review

| Spec requirement | Task |
| --- | --- |
| ICS → filter `Ngày lễ` only | Task 2 |
| Bundled `src/data/holidays-vn.json` + `npm run holidays:vn` | Task 2 |
| Window: range / year / start-only when no end | Task 3 |
| Sync into `excludedDates`; no `calculate()` change | Tasks 3–4 |
| CalculatorForm checkbox + chips, default selected | Task 4 |
| Captions: no start / empty window | Task 4 |
| CriteriaSummary `Lễ VN · N` | Task 5 |
| Tests: parser, window, sync | Tasks 2–3 |
| No GH Action / Variables in phase 1 | Global Constraints / omitted |
| Multi-country deferred | Global Constraints / omitted |

## Placeholder / consistency check

- Function names aligned: `toExcludedKey`, `resolveHolidayWindow`, `filterHolidaysForWindow`, `holidayKeys`, `mergeHolidaySelection`, `removeKeys`, `countExcludedHolidays`, `parseVnHolidays`.
- JSON path fixed: `src/data/holidays-vn.json`.
- No TBD/TODO left in steps.
