# Calculate-date refactor + age mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `calculate-date` form components into feature folders (shared / exclude / modes / results) with a thin shell, then add live age mode (`calcType === '3'`) with Y/M/D + total days and no Calculate button.

**Architecture:** Extract presentational controls and holiday sync first without behavior change. `CalculatorForm` becomes a shell that swaps `DateCalcFields` vs `AgeFields`, shows `exclude/*` + Calculate only for types `1|2`, and hosts live `AgeResult` for type `3`. `useHolidayExclude` lives in the shell so specific-date removal can route through holiday chip sync. `useAgeCalculator` owns non-persisted birth/as-of state and a computed result.

**Tech Stack:** Vue 3 + Vite + TypeScript + PrimeVue DatePicker + date-fns + Tailwind + Vitest (existing under `calculate-date/`).

**Spec:** `docs/superpowers/specs/2026-10-06-calculate-date-refactor-age-design.md`

## Global Constraints

- Paths under `calculate-date/` unless noted; docs at repo-root `docs/`.
- Keep `calcType` storage as `'1' | '2' | '3'` (age = `'3'`); do not rename to string enums in storage.
- Do not persist `birthDate`, `asOfMode`, or `asOfDate`.
- Do not change holiday algorithms, ICS pipeline, or `calculate()` formula; `excludedDates` remains source of truth for range/accumulate.
- Age: no weekday/holiday/specific excludes; no Calculate button; live result is the UX; default as-of = today; autofocus birth field on entering age.
- No new animation libraries; reuse existing glass card / `animate-scale-in` / `motion-reduce:` patterns; age UI follows `/apple-design` restraint.
- Do not split `ResultDisplay` internals — only move the file into `results/`.
- Skip `CriteriaSummary` for age (live form flow only).

## Review Focus

- After extract, toggling holiday master off still clears holiday keys from `excludedDates` and keeps `selectedCountries`.
- Removing an excluded chip that is also a selected holiday key still goes through holiday chip sync (not a raw filter that desyncs `selectedHolidayKeys`).
- Switching `calcType` to `'3'` hides Calculate + all exclude blocks and does not show `CriteriaSummary` / `ResultDisplay`.
- Switching from `'3'` back to `'1'|'2'` restores the prior editing/summary + calendar flow without wiping start/end/excludes.
- Age as-of before birth yields `null` result and an inline hint (no `alert` loop while typing).

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/components/shared/SegmentControl.vue` | Reusable segment radio group |
| `src/components/shared/DateField.vue` | Label + PrimeVue DatePicker wrapper |
| `src/components/exclude/ExcludeWeekdays.vue` | Weekday exclude toggles |
| `src/components/exclude/HolidayExclude.vue` | Master + country pills + chips (presentational) |
| `src/components/exclude/ExcludeSpecificDates.vue` | Add/remove specific excluded dates |
| `src/composables/useHolidayExclude.ts` | Holiday refs, rehydrate, sync, remove-if-holiday |
| `src/components/modes/DateCalcFields.vue` | Start/end or totalDays + method |
| `src/components/modes/AgeFields.vue` | Birth + as-of UI + autofocus + hosts AgeResult |
| `src/components/results/ResultDisplay.vue` | Moved calendar result (unchanged internals) |
| `src/components/results/AgeResult.vue` | Y/M/D + total days card |
| `src/composables/useAgeCalculator.ts` | Age state + computed breakdown |
| `src/composables/useAgeCalculator.test.ts` | Vitest for age math |
| `src/components/CalculatorForm.vue` | Thin shell |
| `src/App.vue` | Wire age composable; conditional summary/calendar vs age |

---

### Task 1: Shared `SegmentControl` + `DateField`

**Files:**
- Create: `calculate-date/src/components/shared/SegmentControl.vue`
- Create: `calculate-date/src/components/shared/DateField.vue`
- Modify: `calculate-date/src/components/CalculatorForm.vue` (replace inline calcType + methodType segments and start/end DatePickers with shared components; keep exclude/holiday inline for now)

**Interfaces:**
- Consumes: existing segment class strings from CalculatorForm
- Produces:
  - `SegmentControl` props: `modelValue: string`, `options: { value: string; label: string }[]`, `ariaLabel: string`; emit `update:modelValue: [string]`
  - `DateField` props: `label: string`, `modelValue: Date | null`, `placeholder?: string`, `inputId?: string`; emit `update:modelValue`; expose `focus(): void` that focuses the inner `input` (or no-ops if missing)

- [ ] **Step 1: Add `SegmentControl.vue` and `DateField.vue` with the interfaces above**

Reuse the existing `segmentItem` / `segmentOn` Tailwind strings inside `SegmentControl`. `DateField` wraps PrimeVue `DatePicker` with `dateFormat="dd/mm/yy"`, `showIcon`, `fluid`.

- [ ] **Step 2: Swap calcType, methodType, and start/end (or totalDays stays native input) in `CalculatorForm` to use the shared components**

Keep labels/copy identical (`Kiểu tính`, `Ngày bắt đầu`, `Ngày kết thúc`, `Cách tính`, …).

- [ ] **Step 3: Typecheck**

Run: `cd calculate-date; npm run type-check`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add calculate-date/src/components/shared calculate-date/src/components/CalculatorForm.vue
git commit -m "refactor(calculate-date): extract SegmentControl and DateField"
```

---

### Task 2: Move `ResultDisplay` into `results/`

**Files:**
- Move: `calculate-date/src/components/ResultDisplay.vue` → `calculate-date/src/components/results/ResultDisplay.vue`
- Modify: `calculate-date/src/App.vue` (import path only)

**Interfaces:**
- Consumes: existing `ResultDisplay` props/emits unchanged
- Produces: import `@/components/results/ResultDisplay.vue`

- [ ] **Step 1: Move the file and update the App import**

Use `git mv` so history is preserved.

- [ ] **Step 2: Typecheck + tests**

Run: `cd calculate-date; npm run type-check; npm test`  
Expected: PASS (existing Vitest suite green)

- [ ] **Step 3: Commit**

```bash
git add calculate-date/src/components/results calculate-date/src/components/ResultDisplay.vue calculate-date/src/App.vue
git commit -m "refactor(calculate-date): move ResultDisplay into results/"
```

---

### Task 3: Extract `useHolidayExclude` + `HolidayExclude`

**Files:**
- Create: `calculate-date/src/composables/useHolidayExclude.ts`
- Create: `calculate-date/src/components/exclude/HolidayExclude.vue`
- Modify: `calculate-date/src/components/CalculatorForm.vue`

**Interfaces:**
- Consumes: form props `calcType`, `startDate`, `endDate`, `excludedDates`; emit `update:excludedDates`
- Produces `useHolidayExclude(props, emit)` returning at least:
  - `excludeHolidays`, `selectedCountries`, `selectedHolidayKeys`, `holidayChips`, `canUseHolidays`
  - `onToggleMaster(checked: boolean)`, `toggleCountry(code: CountryCode)`, `toggleHolidayChip(key: string)`
  - `removeExcludedDate(key: string): void` — if key is a selected holiday chip under master-on, toggle chip sync; else emit filtered `excludedDates` (port current `removeExcludedDate` behavior verbatim)
  - calls `applyRehydratedHolidayState()` once on setup (same as today)

Port watchers/helpers from `CalculatorForm.vue` **verbatim** — no algorithm tweaks.

- [ ] **Step 1: Create `useHolidayExclude.ts` by moving holiday state + sync + rehydrate + `removeExcludedDate` out of CalculatorForm**

- [ ] **Step 2: Create presentational `HolidayExclude.vue` bound to the composable API (props/events or injected return object from parent)**

Preferred: shell calls `useHolidayExclude` and passes values/handlers as props to `HolidayExclude` so Task 4 can reuse `removeExcludedDate`.

- [ ] **Step 3: Replace inline holiday block in CalculatorForm with `<HolidayExclude … />`**

- [ ] **Step 4: Typecheck + tests**

Run: `cd calculate-date; npm run type-check; npm test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add calculate-date/src/composables/useHolidayExclude.ts calculate-date/src/components/exclude/HolidayExclude.vue calculate-date/src/components/CalculatorForm.vue
git commit -m "refactor(calculate-date): extract useHolidayExclude and HolidayExclude"
```

---

### Task 4: Extract `ExcludeWeekdays` + `ExcludeSpecificDates`

**Files:**
- Create: `calculate-date/src/components/exclude/ExcludeWeekdays.vue`
- Create: `calculate-date/src/components/exclude/ExcludeSpecificDates.vue`
- Modify: `calculate-date/src/components/CalculatorForm.vue`

**Interfaces:**
- Consumes: `excludedDays`, `excludedDates`, `startDate`; holiday `removeExcludedDate` from Task 3
- Produces:
  - `ExcludeWeekdays`: `modelValue: number[]` (or `excludedDays` + `update:excludedDays`); uses `daysOfWeek` from `useDateCalculator`
  - `ExcludeSpecificDates`: props `excludedDates`, `startDate`; emit `update:excludedDates` for adds; emit `remove: [key: string]` for chip remove (shell calls `holiday.removeExcludedDate(key)`)

Port exclude-picker month memory (`lastExcludeView`, remount key, PrimeVue month-change) verbatim into `ExcludeSpecificDates`.

- [ ] **Step 1: Create both exclude components and wire them in the shell**

Shell: `@remove="holiday.removeExcludedDate"` (or equivalent).

- [ ] **Step 2: Typecheck + tests**

Run: `cd calculate-date; npm run type-check; npm test`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add calculate-date/src/components/exclude calculate-date/src/components/CalculatorForm.vue
git commit -m "refactor(calculate-date): extract weekday and specific-date excludes"
```

---

### Task 5: Extract `DateCalcFields` and thin the shell (modes 1|2 only)

**Files:**
- Create: `calculate-date/src/components/modes/DateCalcFields.vue`
- Modify: `calculate-date/src/components/CalculatorForm.vue`

**Interfaces:**
- Consumes: `calcType`, `startDate`, `endDate`, `totalDays`, `methodType` + matching `update:*` emits
- Produces: `DateCalcFields` containing start/end or totalDays + method segment (uses `DateField` + `SegmentControl`)

Shell target after this task: mode segment (still 2 options) + `DateCalcFields` + three exclude components + Calculate footer. Aim for shell roughly ≤ 200 lines.

- [ ] **Step 1: Move date/method fields into `DateCalcFields.vue` and leave shell as orchestrator**

- [ ] **Step 2: Typecheck + tests**

Run: `cd calculate-date; npm run type-check; npm test`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add calculate-date/src/components/modes/DateCalcFields.vue calculate-date/src/components/CalculatorForm.vue
git commit -m "refactor(calculate-date): extract DateCalcFields mode panel"
```

---

### Task 6: `useAgeCalculator` (TDD)

**Files:**
- Create: `calculate-date/src/composables/useAgeCalculator.ts`
- Create: `calculate-date/src/composables/useAgeCalculator.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces:

```ts
export type AgeResultData = {
  years: number
  months: number
  days: number
  totalDays: number
  birthKey: string  // dd/MM/yyyy
  asOfKey: string
}

export function useAgeCalculator(): {
  birthDate: Ref<Date | null>
  asOfMode: Ref<'today' | 'date'>
  asOfDate: Ref<Date | null>
  result: ComputedRef<AgeResultData | null>
  asOfInvalid: ComputedRef<boolean> // true when both dates set and asOf < birth
}
```

Rules: `asOfEffective = startOfDay(now)` when mode `today`, else `startOfDay(asOfDate)`; incomplete → `result null`; `asOf < birth` → `result null` and `asOfInvalid true`; equal → zeros; use `differenceInYears` / `differenceInMonths` / remainder days + `differenceInCalendarDays` for `totalDays`. No `useStorage`.

- [ ] **Step 1: Write failing tests in `useAgeCalculator.test.ts`**

```ts
test("same calendar day → zeros", () => { /* birth=asOf=2020-01-15 → 0,0,0,totalDays 0 */ })
test("simple Y/M/D breakdown", () => {
  // birth 2000-01-10, asOf 2028-03-15 → 28 years, 2 months, 5 days
  // totalDays === differenceInCalendarDays(asOf, birth)
})
test("asOf before birth → null result and asOfInvalid", () => { /* ... */ })
test("today mode uses startOfDay(new Date())", () => {
  // birth = today → zeros; do not rely on fake timers unless needed
})
test("incomplete birth → null", () => { /* birthDate null */ })
test("leap-day birth to non-leap asOf does not throw and returns finite numbers", () => {
  // birth 2000-02-29, asOf 2025-03-01
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd calculate-date; npx vitest run src/composables/useAgeCalculator.test.ts`  
Expected: FAIL (module missing)

- [ ] **Step 3: Implement `useAgeCalculator` to satisfy tests**

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd calculate-date; npx vitest run src/composables/useAgeCalculator.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add calculate-date/src/composables/useAgeCalculator.ts calculate-date/src/composables/useAgeCalculator.test.ts
git commit -m "feat(calculate-date): add useAgeCalculator with tests"
```

---

### Task 7: `AgeResult` + `AgeFields`

**Files:**
- Create: `calculate-date/src/components/results/AgeResult.vue`
- Create: `calculate-date/src/components/modes/AgeFields.vue`

**Interfaces:**
- Consumes: `AgeResultData` from Task 6; `DateField.focus` from Task 1; `SegmentControl`
- Produces:
  - `AgeResult` props: `result: AgeResultData`, optional `asOfIsToday?: boolean` for context copy (`hôm nay` vs `asOfKey`)
  - Display copy: primary `Y năm · M tháng · D ngày`; secondary `Tổng N ngày`; context `birthKey → …`
  - `AgeFields` props: `birthDate`, `asOfMode`, `asOfDate`, `result`, `asOfInvalid`; matching `update:*` emits
  - On mount / when parent signals active: call `birthFieldRef.focus()`
  - If `asOfInvalid`, show inline hint text (e.g. `Ngày tính phải từ ngày sinh trở đi`) — no `alert`

Visual: match existing result card glass language; `animate-scale-in` + `motion-reduce:animate-none`.

- [ ] **Step 1: Implement `AgeResult.vue` and `AgeFields.vue`**

- [ ] **Step 2: Typecheck**

Run: `cd calculate-date; npm run type-check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add calculate-date/src/components/results/AgeResult.vue calculate-date/src/components/modes/AgeFields.vue
git commit -m "feat(calculate-date): add AgeFields and AgeResult UI"
```

---

### Task 8: Wire age mode into shell + App

**Files:**
- Modify: `calculate-date/src/components/CalculatorForm.vue`
- Modify: `calculate-date/src/App.vue`
- Modify: header subtitle copy in `App.vue` to mention tuổi (one line)

**Interfaces:**
- Consumes: Tasks 5–7
- Produces: working three-mode app

Shell changes:
- Mode segment options: `{ value:'1', label:'Khoảng ngày' }`, `{ value:'2', label:'Cộng dồn' }`, `{ value:'3', label:'Tính tuổi' }`
- `v-if="calcType !== '3'"` around `DateCalcFields`, all `exclude/*`, and Calculate footer
- `v-else` → `AgeFields` with age v-models
- Accept additional props/emits for `birthDate`, `asOfMode`, `asOfDate` **or** bind age state only in App by nesting `useAgeCalculator` inside shell — **prefer App owns `useAgeCalculator` and passes props** (matches spec diagram)

App changes:
- `const age = useAgeCalculator()`
- Show form when `calcType === '3' || editing`
- Show `CriteriaSummary` only when `!editing && calcType !== '3'`
- Show `ResultDisplay` only when `calcType !== '3'` (and existing result visibility)
- When `calcType` becomes `'3'`, keep form visible (set `editing = true` on that transition so leaving summary into age works)
- Pass age props into `CalculatorForm`; do not pass age into CriteriaSummary

- [ ] **Step 1: Wire shell + App as above**

- [ ] **Step 2: Typecheck + full test suite**

Run: `cd calculate-date; npm run type-check; npm test`  
Expected: PASS

- [ ] **Step 3: Browser verify (required)**

Run: `cd calculate-date; npm run dev`  
Check:
- Types 1|2: calculate → summary → calendar; holiday exclude still works; chip remove of holiday key stays synced
- Type 3: no Calculate/excludes; autofocus birth; live AgeResult; as-of before birth shows inline hint; switch back to 1|2 restores prior flow
- Desktop + narrow mobile viewport on age card

- [ ] **Step 4: Commit**

```bash
git add calculate-date/src/components/CalculatorForm.vue calculate-date/src/App.vue
git commit -m "feat(calculate-date): wire live age mode into form shell"
```

---

## Self-review checklist (author)

- Spec coverage: shared controls, exclude extract, DateCalcFields, results move, useAgeCalculator, Age UI, App wiring, no CriteriaSummary for age, no birth persist — all tasked.
- Review Focus lines mapped: holiday master off (T3), holiday chip remove (T3/T4), hide calc/excludes on age (T8), restore 1|2 flow (T8), asOf before birth (T6+T7).
- `removeExcludedDate` ownership pinned to `useHolidayExclude` for T4 coordination.
