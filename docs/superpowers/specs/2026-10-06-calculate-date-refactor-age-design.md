# Design: Refactor calculate-date components + age mode

**Date:** 2026-10-06  
**Status:** Approved for planning  
**Scope:** Restructure `calculate-date/src/components` by feature folders and calc modes; add age calculation (live, default today)  
**App:** `calculate-date`  
**Builds on:** Existing range/accumulate calculator + multi-country holidays (`2026-09-28-multi-country-holidays-design.md`)

## Problem

`CalculatorForm.vue` (~550 lines) and `ResultDisplay.vue` (~415 lines) have grown dense. Holiday sync, exclude UI, and date-mode fields share one file, which makes adding a third mode (tính tuổi) risky and hard to reuse. Age needs a different UX (no excludes, no Calculate gate, live result) and should not bloat the weekday-calendar result path.

## Goal

- Refactor form UI into a **thin shell + mode panels + shared controls**, grouped in **feature-named folders**.
- Extract holiday exclude state/sync into `useHolidayExclude` without changing holiday behavior.
- Add **Tính tuổi**: birth date → today (default) or a specific as-of date; show **years · months · days · total days** live.
- Keep range/accumulate + `ResultDisplay` calendar behavior intact.
- Age UI follows existing glass-card language and `/apple-design` (clarity, restraint, autofocus, reduced-motion).

## Non-goals

- Splitting `ResultDisplay` internals (month grid / infinite scroll / cells) in this pass.
- Changing holiday algorithms, ICS pipeline, or country set.
- Persisting birth date in `localStorage` (privacy).
- Age hours/minutes or “next birthday” countdowns.
- New animation libraries.
- Changing Vite base / GitHub Pages deploy path.

## Decisions (from brainstorming)

| Topic | Choice |
| --- | --- |
| Path | Architectural: refactor then age in one design |
| Primary split | By **calc mode** (khoảng ngày / cộng dồn / tuổi) |
| Form chrome | One **CalculatorForm shell** + swap mode panels |
| Approach | **A** — shell + panels + shared controls (not minimal B, not full ResultDisplay split C) |
| Folder layout | Feature folders: `shared/`, `exclude/`, `modes/`, `results/` |
| Age excludes | **None** (no weekday / holiday / specific-date blocks) |
| Age result UI | Dedicated `results/AgeResult.vue` |
| Age content | Years + months + days + total days |
| Age commit UX | **No Calculate button**; live preview **is** the result |
| Age default as-of | **Today** (`startOfDay(new Date())` at read time) |
| Age autofocus | Focus birth `DateField` when entering age mode |
| Mode storage | Keep `calcType` as `'1' \| '2' \| '3'` (age = `'3'`) |
| Birth persistence | **Do not** persist `birthDate` |
| ResultDisplay | Move file into `results/` only; no internal refactor |
| Age + CriteriaSummary | Not required for age live flow; skip unless a later pass wants compact chrome |

## Target tree

```
src/components/
  CalculatorForm.vue                 # thin shell
  CriteriaSummary.vue                # range/accumulate summary (unchanged role)
  shared/
    SegmentControl.vue
    DateField.vue
  exclude/
    ExcludeWeekdays.vue
    HolidayExclude.vue
    ExcludeSpecificDates.vue
  modes/
    DateCalcFields.vue               # range + accumulate fields
    AgeFields.vue                    # birth + as-of segment/picker
  results/
    ResultDisplay.vue                # moved from components root
    AgeResult.vue

src/composables/
  useDateCalculator.ts               # existing range/accumulate
  useHolidayExclude.ts               # extracted from CalculatorForm
  useAgeCalculator.ts                # birth + asOf → breakdown
```

## Architecture

```
App.vue
  ├─ useDateCalculator()             # calcType, dates, excludes, range result
  ├─ useAgeCalculator()              # birthDate, asOfMode, asOfDate, ageResult (live)
  ├─ CalculatorForm (shell)
  │    ├─ shared/SegmentControl      # modes 1 | 2 | 3
  │    ├─ modes/DateCalcFields       # if calcType 1|2
  │    ├─ modes/AgeFields            # if calcType 3 (+ autofocus)
  │    │    └─ live → results/AgeResult (inline under fields)
  │    ├─ exclude/*                  # only if calcType 1|2
  │    │    └─ HolidayExclude + useHolidayExclude → excludedDates
  │    └─ Calculate button           # only if calcType 1|2
  ├─ CriteriaSummary                 # after calculate, calcType 1|2
  └─ results/ResultDisplay           # after calculate, calcType 1|2
```

### Shell rules

1. Top segment always visible: Khoảng ngày | Cộng dồn | Tính tuổi.
2. Body swaps `DateCalcFields` vs `AgeFields`.
3. Exclude stack + Calculate render **only** when `calcType !== '3'`.
4. For age: shell does not emit `calculate`; App keeps `editing` irrelevant for age (always show live age UI while on that tab).
5. Leaving age for 1|2 restores prior editing/summary behavior for those modes.

### Shared controls

**`SegmentControl`**  
Props: `modelValue`, `options: { value, label }[]`, `ariaLabel`. Emits `update:modelValue`. Reuses existing segment visual classes (`segmentItem` / `segmentOn`).

**`DateField`**  
Props: `label`, `modelValue`, `placeholder`, optional `inputId` / autofocus flag. Wraps PrimeVue `DatePicker` (`dd/mm/yy`, `showIcon`, `fluid`). Used for start/end, birth, as-of, and as the labeled wrapper pattern (exclude picker may stay specialized in `ExcludeSpecificDates`).

### Exclude extraction

Move template + logic for:

- Weekday toggles → `ExcludeWeekdays.vue`
- Holiday master / countries / chips + rehydrate/sync → `HolidayExclude.vue` + `useHolidayExclude.ts`
- Specific date picker + chip remove → `ExcludeSpecificDates.vue`

Behavioral contract unchanged from multi-country holidays spec: `excludedDates` remains source of truth for `calculate()`; master off clears holiday keys but keeps `selectedCountries`; window changes sync via existing helpers in `lib/holidays.ts`.

### Mode fields

**`DateCalcFields`**  
Start date; end date if type `1`; total days + method segment if type `2`. Same validation ownership as today (still enforced in `useDateCalculator.calculate()`).

**`AgeFields`**  
- Birth `DateField` (required for a defined result).
- As-of `SegmentControl`: `today` | `date`; default `today`.
- If `date`, show as-of `DateField`.
- On mode enter: autofocus birth input (PrimeVue text input inside DatePicker; fallback to container).
- Renders or slots `AgeResult` when birth is set and as-of ≥ birth.

### Age logic (`useAgeCalculator`)

Inputs:

- `birthDate: Date | null` (not persisted)
- `asOfMode: 'today' | 'date'` (default `'today'`; not persisted — always start on today when opening age)
- `asOfDate: Date | null` (when mode is `date`; not persisted)

Derived `asOfEffective`: `startOfDay(new Date())` when mode is `today`, else `startOfDay(asOfDate)`.

Output when valid:

```ts
{
  years: number
  months: number
  days: number
  totalDays: number
  birthKey: string      // dd/MM/yyyy
  asOfKey: string
}
```

Rules:

- Invalid / incomplete → `result = null` (no alert spam while typing).
- `asOfEffective < birth` → `result = null`; optional inline hint (prefer inline over `alert` for live mode).
- Breakdown via `date-fns` (`differenceInYears` / `differenceInMonths` / remainder days pattern); `totalDays = differenceInCalendarDays(asOf, birth)`.
- Equal dates → all zeros, `totalDays = 0`.

### `AgeResult` UI

- Card material aligned with existing result card (glass, radius, border, shadow).
- Primary line: `Y năm · M tháng · D ngày` (large, tabular, tightened tracking).
- Secondary: `Tổng N ngày`.
- Context: `birthKey → asOfKey` (or “hôm nay” label when mode is today).
- Motion: reuse `animate-scale-in` / fade; honor `prefers-reduced-motion`.
- Implementation details follow `/apple-design` (hierarchy, press feedback already on controls, no decorative motion).

### App wiring

- Import paths updated for `results/ResultDisplay.vue`.
- `onCalculate` only for types `1|2`.
- When `calcType === '3'`: show form + live `AgeResult`; hide CriteriaSummary + ResultDisplay.
- When `calcType` is `1|2`: existing editing → summary + ResultDisplay flow.
- `holidayExcludedCount` computation unchanged for types `1|2`.

## Implementation order

1. **Extract-only refactor** (behavior-identical): `shared/*`, `exclude/*`, `useHolidayExclude`, move `ResultDisplay` → `results/`, thin shell still with modes 1|2 only. Verify tests + manual holiday/exclude.
2. **`DateCalcFields`** extraction into `modes/`. Verify.
3. **Age feature**: `useAgeCalculator`, `AgeFields`, `AgeResult`, segment option `3`, hide Calculate/excludes on age, live result + autofocus + default today.
4. **UI polish** pass with apple-design on age surfaces; browser check desktop + mobile.

## Testing

- Unit: `useAgeCalculator` — leap day birthdays, same-day zero, as-of before birth → null, today mode uses calendar today, totalDays matches `differenceInCalendarDays`.
- Existing Vitest suite (holidays + any form helpers) stays green after file moves.
- Manual / browser:
  - Mode switches preserve range/accumulate state.
  - Holiday master/countries/chips sync still correct after extract.
  - Age: autofocus on tab enter; typing updates live result; switch to specific as-of; reduced-motion.
  - Age: Calculate button and exclude blocks absent.
  - Types 1|2: Calculate + summary + calendar still work; scroll-into-view selector noted separately (existing `.result-card` dead selector — fix only if touched).

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Import churn moving ResultDisplay | Update App + any tests in same commit as move |
| PrimeVue autofocus awkward | Focus underlying input via ref/`querySelector('input')`; degrade gracefully |
| Live age recomputes every render | Cheap date-fns diffs; computed only |
| Accidental persist of birthDate | Do not wrap birth in `useStorage` |
| Regressing holiday sync while extracting | Port logic verbatim first; no algorithm tweaks in step 1 |

## Success criteria

- `CalculatorForm.vue` shell roughly ≤ ~150–200 lines.
- Holiday UI/logic no longer inline in the shell.
- Age mode usable without Calculate; default as-of today; autofocus birth; shows Y/M/D + total days.
- Range/accumulate + multi-country holidays behave as before.
- Folders `shared/`, `exclude/`, `modes/`, `results/` make feature ownership obvious at a glance.
