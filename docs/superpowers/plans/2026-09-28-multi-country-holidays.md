# Multi-country Holidays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend calculate-date-vue so users can multi-select VN/JP/US/CN holiday snapshots into `excludedDates`, with Apple-style country pills in the form and holiday name hints on the result calendar.

**Architecture:** A country registry drives a shared ICS parser and fetch script that writes per-country JSON under `src/data/`. `holidays.ts` loads all snapshots, filters by selected countries + window, merges chips by date, and indexes holiday labels for `ResultDisplay`. `CalculatorForm` owns master toggle + country pills + chips; `App` / `CriteriaSummary` show `Lễ · N`; calculation still reads only `excludedDates`.

**Tech Stack:** Vue 3 + Vite + TypeScript + date-fns + Tailwind (existing); Vitest (`src/**/*.test.ts`); Node `node:test` for script parser tests; Node `fetch` in ESM scripts.

**Spec:** `docs/superpowers/specs/2026-09-28-multi-country-holidays-design.md`

## Global Constraints

- Phase 2 countries only: `vn`, `jp`, `us`, `cn` — registry must make adding another country a data change later.
- No runtime ICS/JSON fetch in the browser; static imports of `src/data/holidays-{code}.json` only.
- Keep `calculate()` on existing `excludedDates` (`dd/MM/yyyy`); do not change the formula.
- VN include rule stays: unfolded DESCRIPTION first line equals `Ngày lễ`. JP/US/CN: every `VEVENT` with `DTSTART` + `SUMMARY`.
- Default UI: master off, `selectedCountries = []`; master off clears holiday keys from `excludedDates` but keeps country picks.
- Chip merge: one chip per date; label `dd/MM/yyyy · <names> · <CODES>` with country order `vn→jp→us→cn`.
- Result calendar hints: union of all four datasets; native `title`/`aria-label` + small accent mark; no tooltip library.
- No new animation dependency; keep `#0071e3` selected styling, `active:scale-[0.97]`, `motion-reduce:` guards.
- Paths under `calculate-date-vue/` unless noted; docs live at repo-root `docs/`.

## Review Focus

- Rehydrate after edit remount: excluded holiday dates restore master + contributing countries without forcing unchecked chips back on.
- Deselecting one country while master is on drops that country’s dates from chips/`excludedDates` sync without wiping other countries’ selections.
- Shared date across countries remains a single `excludedDates` key; unchecking the chip removes the date once.
- Result calendar holiday hint uses all bundled lists even when form selected zero countries.
- `holidays:all` failure for one country leaves that country’s existing JSON untouched while earlier successes in the same run may already be written.

---

## File structure

| File | Responsibility |
| --- | --- |
| `scripts/lib/holidaySources.mjs` | Registry: code, label, icsUrl, includeRule id |
| `scripts/lib/parseIcsHolidays.mjs` | Shared unfold/parse + rule hooks (replace/generalize `parseVnIcs.mjs`) |
| `scripts/lib/parseIcsHolidays.test.mjs` | Node tests for VN + EN fixtures |
| `scripts/fixtures/sample-vn.ics` | Keep |
| `scripts/fixtures/sample-en.ics` | Minimal official-style EN events |
| `scripts/fetch-holidays.mjs` | Fetch one country or `all` → `holidays-{code}.json` |
| `scripts/fetch-vn-holidays.mjs` | Thin wrapper calling fetch for `vn` (compat) **or** delete after package.json points at new script |
| `src/data/holidays-{vn,jp,us,cn}.json` | Bundled snapshots |
| `src/lib/holidays.ts` | Datasets map, get/merge/lookup helpers |
| `src/lib/holidays.test.ts` | Vitest for merge, multi-country filter, lookup map |
| `src/components/CalculatorForm.vue` | Master + country pills + chips |
| `src/components/CriteriaSummary.vue` | `Lễ · N` badge |
| `src/components/ResultDisplay.vue` | Holiday accent + title/aria |
| `src/App.vue` | Count from all four countries in window |
| `package.json` / `README.md` | Scripts + refresh docs |

---

### Task 1: Shared ICS parser + country registry

**Files:**
- Create: `calculate-date-vue/scripts/lib/holidaySources.mjs`
- Create: `calculate-date-vue/scripts/lib/parseIcsHolidays.mjs`
- Create: `calculate-date-vue/scripts/fixtures/sample-en.ics`
- Create: `calculate-date-vue/scripts/lib/parseIcsHolidays.test.mjs`
- Modify or delete after migration: `calculate-date-vue/scripts/lib/parseVnIcs.mjs`, `parseVnIcs.test.mjs`

**Interfaces:**
- Consumes: raw ICS text; registry entry `includeRule`: `"vn-ngay-le"` | `"all-vevents"`
- Produces:
  - `HOLIDAY_SOURCES: { code, label, icsUrl, includeRule, outFile }[]`
  - `parseIcsHolidays(icsText: string, includeRule: string): { date: string, name: string }[]`
  - `parseVnHolidays(icsText)` may remain as `parseIcsHolidays(text, "vn-ngay-le")` alias during migration

- [ ] **Step 1: Write failing Node tests**

In `parseIcsHolidays.test.mjs`: keep the two existing VN assertions against `sample-vn.ics` via `parseIcsHolidays(ics, "vn-ngay-le")`. Add EN fixture tests:

```js
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
```

`sample-en.ics`: two `VEVENT`s (New Year's Day 20260101, Independence Day 20260704) with English DESCRIPTION lines that are **not** `Ngày lễ` (proves VN rule would drop them).

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd calculate-date-vue && node --test scripts/lib/parseIcsHolidays.test.mjs`  
Expected: FAIL (module missing)

- [ ] **Step 3: Implement registry + parser**

`holidaySources.mjs` entries for `vn|jp|us|cn` with full public ICS URLs (`#` → `%23`) matching the spec.  
`parseIcsHolidays.mjs`: move unfold/field/normalize/unescape from `parseVnIcs.mjs`; branch on `includeRule`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd calculate-date-vue && node --test scripts/lib/parseIcsHolidays.test.mjs`  
Expected: PASS

- [ ] **Step 5: Point old VN test file at new parser or remove it; commit**

```bash
git add calculate-date-vue/scripts/lib calculate-date-vue/scripts/fixtures
git commit -m "feat: generalize ICS holiday parser for multi-country rules"
```

---

### Task 2: Fetch script + JP/US/CN snapshots

**Files:**
- Create: `calculate-date-vue/scripts/fetch-holidays.mjs`
- Modify: `calculate-date-vue/package.json`, `calculate-date-vue/README.md`
- Create: `calculate-date-vue/src/data/holidays-jp.json`, `holidays-us.json`, `holidays-cn.json`
- Keep/update: `holidays-vn.json` (refresh OK)
- Compat: `fetch-vn-holidays.mjs` → call `fetch-holidays.mjs` for `vn`, or retarget npm script only

**Interfaces:**
- Consumes: CLI arg `vn|jp|us|cn|all` (default `all` or require explicit — pick **require arg**, document in README)
- Produces: writes `src/data/holidays-{code}.json` with `{ updatedAt, source, holidays }`; on failure for a code, leave that file untouched; `all` continues after a failure only if you choose fail-fast — **spec: fail the run if any country fails**, but do not overwrite the failed country’s file

- [ ] **Step 1: Implement `fetch-holidays.mjs`**

Reuse phase-1 write guards (HTTP error / 0 holidays → throw before write). Loop registry for `all`.

- [ ] **Step 2: Wire npm scripts**

```json
"holidays:vn": "node scripts/fetch-holidays.mjs vn",
"holidays:jp": "node scripts/fetch-holidays.mjs jp",
"holidays:us": "node scripts/fetch-holidays.mjs us",
"holidays:cn": "node scripts/fetch-holidays.mjs cn",
"holidays:all": "node scripts/fetch-holidays.mjs all"
```

Update README refresh section for multi-country.

- [ ] **Step 3: Generate snapshots**

Run: `cd calculate-date-vue && npm run holidays:all`  
Expected: four JSON files with `holidays.length > 0` each; console logs counts.

- [ ] **Step 4: Commit**

```bash
git add calculate-date-vue/scripts/fetch-holidays.mjs calculate-date-vue/package.json calculate-date-vue/README.md calculate-date-vue/src/data
git commit -m "feat: fetch and bundle JP/US/CN holiday snapshots"
```

---

### Task 3: `holidays.ts` multi-country API

**Files:**
- Modify: `calculate-date-vue/src/lib/holidays.ts`
- Modify: `calculate-date-vue/src/lib/holidays.test.ts`

**Interfaces:**
- Consumes: four JSON datasets
- Produces:
  - `export type CountryCode = "vn" | "jp" | "us" | "cn"`
  - `export type HolidayRecord = { date: string; name: string; country: CountryCode }`
  - `HOLIDAY_COUNTRIES: { code: CountryCode; label: string; short: string }[]` ordered vn→jp→us→cn (`short`: `VN`/`JP`/`US`/`CN`)
  - `getHolidaysForCountries(codes: CountryCode[]): HolidayRecord[]`
  - `mergeHolidayChips(records: HolidayRecord[]): { key: string; date: string; label: string; names: string[]; countries: CountryCode[] }[]`
  - `holidayInfoByKey(records?: HolidayRecord[]): Map<string, { label: string }>` — default records = all countries; map key `dd/MM/yyyy`, `label` = chip label **without** requiring a window filter (or build from `mergeHolidayChips`)
  - Keep existing window/sync helpers; `filterHolidaysForWindow` accepts records with or without `country`

- [ ] **Step 1: Write failing Vitest cases**

Assertions to add (exact values OK to invent in-test fixtures, do not depend on live JSON):

- `getHolidaysForCountries(["vn","us"])` only returns those countries’ tagged rows from stubbed logic **or** test merge/filter with inline records passed into pure functions.
- Prefer testing pure `mergeHolidayChips` / a pure `tagHolidays(dataset, code)` if imports of real JSON make stubs hard — still export `getHolidaysForCountries` and smoke-test it returns `country` tags for real data length > 0.
- `mergeHolidayChips`: same date vn+us → one chip; `countries` `["vn","us"]`; label contains `VN, US` and both names if distinct.
- `holidayInfoByKey`: key `01/01/2026` maps to label containing holiday name.

Also add Review Focus coverage:

- merge leaves a single key for shared dates
- `holidayInfoByKey` over all countries includes a date even when a one-country subset would too

- [ ] **Step 2: Run `npm test` — expect FAIL**

- [ ] **Step 3: Implement API in `holidays.ts`**

- [ ] **Step 4: Run `npm test` — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add calculate-date-vue/src/lib/holidays.ts calculate-date-vue/src/lib/holidays.test.ts
git commit -m "feat: multi-country holiday helpers and merge-by-date chips"
```

---

### Task 4: CalculatorForm country pills + master rename

**Files:**
- Modify: `calculate-date-vue/src/components/CalculatorForm.vue` (block ~L393–453 and related script state)

**Interfaces:**
- Consumes: `HOLIDAY_COUNTRIES`, `getHolidaysForCountries`, `mergeHolidayChips`, existing sync helpers
- Produces: UI state `excludeHolidays`, `selectedCountries: CountryCode[]`, chips from merged selected-country holidays in window; still emits `update:excludedDates`

- [ ] **Step 1: Replace VN-only state with multi-country state**

- Rename `excludeVnHolidays` → `excludeHolidays`.
- Add `selectedCountries` ref (`[]` default).
- `holidaysInWindow`: `filterHolidaysForWindow(getHolidaysForCountries(selectedCountries.value), window)`.
- `holidayChips`: `mergeHolidayChips(holidaysInWindow)`.
- Master off: sync empty selection (clear holiday keys) but **do not** clear `selectedCountries`.
- Master on + empty countries: show copy `Chọn quốc gia`; no chips.
- Country pill toggle updates `selectedCountries` then recomputes chips; newly appeared keys default on (existing window watch pattern).
- Rehydrate: from `excludedDates` ∩ keys for each country in window, set `selectedCountries` to countries with ≥1 hit, `excludeHolidays` if any hits, restore chip selection via `rehydrateHolidaySelection`.

- [ ] **Step 2: Template — Apple-style controls**

- Label `Loại trừ ngày lễ`.
- When master on: pill row for each `HOLIDAY_COUNTRIES` entry (`short` on pill, `label` in `title`/`aria-label`); selected styling matches weekday chips; `active:scale-[0.97]` + `motion-reduce:`.
- Holiday chips unchanged visually aside from merged labels.

- [ ] **Step 3: Type-check**

Run: `cd calculate-date-vue && npm run type-check`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add calculate-date-vue/src/components/CalculatorForm.vue
git commit -m "feat: multi-select country holiday exclude UI"
```

---

### Task 5: Summary badge + App count

**Files:**
- Modify: `calculate-date-vue/src/App.vue`
- Modify: `calculate-date-vue/src/components/CriteriaSummary.vue`

**Interfaces:**
- Consumes: `getHolidaysForCountries(['vn','jp','us','cn'])` + window filter + `countExcludedHolidays`
- Produces: prop rename `vnHolidayExcludedCount` → `holidayExcludedCount`; badge text `Lễ · {{ holidayExcludedCount }}`

- [ ] **Step 1: Update App computed + CriteriaSummary prop/label/empty-state condition**

- [ ] **Step 2: Type-check**

Run: `cd calculate-date-vue && npm run type-check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add calculate-date-vue/src/App.vue calculate-date-vue/src/components/CriteriaSummary.vue
git commit -m "feat: show multi-country holiday exclude count as Lễ · N"
```

---

### Task 6: ResultDisplay holiday hints

**Files:**
- Modify: `calculate-date-vue/src/components/ResultDisplay.vue`
- Modify: `calculate-date-vue/src/lib/holidays.test.ts` (if lookup edge cases not already covered)

**Interfaces:**
- Consumes: `holidayInfoByKey()` (all countries) or computed Map for keys appearing in `calendarMonths`
- Produces: `CalCell` gains optional `holidayLabel: string | null`; accent mark in template; `title`/`aria-label` append holiday line when present

- [ ] **Step 1: Extend cell model + labels**

When building each in-month cell, set `holidayLabel` from the map (`null` if absent).

Interactive button `title` / `aria-label` examples:

- With holiday + not excluded: `Loại trừ ${key} — ${holidayLabel}`
- With holiday + excluded: `Khôi phục ${key} — ${holidayLabel}`
- Filler (non-button) in-month day with holiday: set `title` on the `div` to `${key} — ${holidayLabel}` (optional but preferred for hover parity)

Accent: absolute tiny dot (`h-1 w-1 rounded-full bg-[#0071e3]`) near top center when `holidayLabel` is set; `aria-hidden`.

- [ ] **Step 2: Type-check + unit tests still PASS**

Run: `cd calculate-date-vue && npm test && npm run type-check`  
Expected: PASS

- [ ] **Step 3: Browser verification**

Run: `cd calculate-date-vue && npm run dev`  
Manual: calculate a range covering 01/01; confirm holiday cells show blue dot; hover/focus shows name; click still excludes/restores; check mobile width.

- [ ] **Step 4: Commit**

```bash
git add calculate-date-vue/src/components/ResultDisplay.vue calculate-date-vue/src/lib/holidays.test.ts
git commit -m "feat: show holiday names on result calendar cells"
```

---

### Task 7: Final verification

**Files:** none required (docs only if README gaps found)

- [ ] **Step 1: Run full automated checks**

```bash
cd calculate-date-vue
node --test scripts/lib/parseIcsHolidays.test.mjs
npm test
npm run type-check
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Smoke checklist (browser)**

- Default: master off, no countries.
- Master on → pick VN+US → merged chips on shared dates → calculate → `Lễ · N` on summary.
- Result calendar holiday accent + title.
- Master off clears holiday exclusions; turning on again keeps countries.
- `prefers-reduced-motion` does not break interactions.

- [ ] **Step 3: Commit any leftover doc/fix fixes, or skip if clean**

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-28-multi-country-holidays.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end.

**For this plan I recommend Native**, because the seven tasks share one holidays API and UI surface in a small app — sequential context in one session avoids interface drift between subagents. Does the plan capture what you want, and which approach should we use?
