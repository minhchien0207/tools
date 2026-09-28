# Design: Multi-country holiday exclude (calculate-date-vue)

**Date:** 2026-09-28  
**Status:** Approved for planning  
**Scope:** Phase 2 — Việt Nam + Nhật Bản + Hoa Kỳ + Trung Quốc  
**App:** `calculate-date-vue`  
**Builds on:** `docs/superpowers/specs/2026-09-28-vn-holidays-exclude-design.md` (phase 1)

## Problem

Phase 1 chỉ loại trừ ngày lễ Việt Nam từ một snapshot ICS. Người dùng làm việc với lịch nhiều nước cần cùng lúc loại trừ lễ JP / US / CN (và VN) trong cùng một phép tính, với UI chọn quốc gia rõ ràng và cảm giác phản hồi tức thì.

## Goal

- Mở rộng pipeline snapshot ICS theo registry quốc gia (JSON riêng từng nước).
- Cho phép **chọn nhiều quốc gia cùng lúc**; hợp nhất ngày lễ trong cửa sổ tính.
- Chip ngày lễ **gộp theo ngày** (một chip / một `yyyy-MM-dd`).
- Nâng cấp khối UI loại trừ lễ trong `CalculatorForm.vue` (vùng master + list chip) theo hướng Apple: phản hồi tức thì, agency, simplicity, reduced-motion.
- Giữ `excludedDates` làm nguồn sự thật cho `calculate()` — không đổi công thức lõi.

## Non-goals

- Fetch ICS / JSON lúc runtime trên GitHub Pages.
- Quốc gia ngoài bộ phase 2 (`vn`, `jp`, `us`, `cn`) — registry phải dễ thêm sau, nhưng không ship thêm nước trong phase này.
- Tách chip theo quốc gia cho cùng một ngày (user đã chối).
- CI cron tự refresh snapshot.
- Đổi layout tổng thể form ngoài khối loại trừ ngày lễ.
- Thêm thư viện animation mới (dùng CSS transition / utilities hiện có).

## Decisions (from brainstorming)

| Topic | Choice |
| --- | --- |
| Country selection | Multi-select (nhiều quốc gia cùng lúc) |
| Same date, multiple countries | One chip per date; label merges names / country codes |
| Default form state | Master **off**; **no** countries pre-selected |
| Data layout | Approach A: country registry + per-country JSON files |
| Master off behavior | Clear holiday keys from `excludedDates`; **keep** `selectedCountries` for when master turns back on |

## Architecture

```
scripts/lib/holidaySources.mjs     # registry: code, label, icsUrl, includeRule
scripts/lib/parseIcsHolidays.mjs   # shared ICS unfold/parse + rule hook
scripts/fetch-holidays.mjs         # fetch one or all countries → holidays-{code}.json
        │
        ▼
src/data/holidays-vn.json
src/data/holidays-jp.json
src/data/holidays-us.json
src/data/holidays-cn.json
        │  static imports (bundled)
        ▼
src/lib/holidays.ts                # datasets map + filter window + merge-by-date chips
        │
        ▼
CalculatorForm.vue                 # master + country pills + holiday chips → excludedDates
        │
        ▼
useDateCalculator.ts               # unchanged: reads excludedDates
        │
        ▼
CriteriaSummary.vue / App.vue      # badge “Lễ · N” (count of excluded holiday dates in window)
```

### Country registry (phase 2)

| code | UI label | ICS source | Include rule |
| --- | --- | --- | --- |
| `vn` | Việt Nam | `vi.vietnamese#holiday@group.v.calendar.google.com` (existing) | First `DESCRIPTION` line (after unfold) equals `Ngày lễ` |
| `jp` | Nhật Bản | `en.japanese.official#holiday@group.v.calendar.google.com` | Every `VEVENT` with `DTSTART` + `SUMMARY` |
| `us` | Hoa Kỳ | `en.usa.official#holiday@group.v.calendar.google.com` | Same as `jp` |
| `cn` | Trung Quốc | `en.china.official#holiday@group.v.calendar.google.com` | Same as `jp` |

Public ICS URL pattern (encode `#` as `%23`):

`https://calendar.google.com/calendar/ical/<calendar-id>/public/basic.ics`

### Data file shape

Unchanged per file (compatible with phase 1):

```json
{
  "updatedAt": "2026-09-28",
  "source": "<ics-url>",
  "holidays": [
    { "date": "2026-01-01", "name": "New Year's Day" }
  ]
}
```

- `date`: ISO `yyyy-MM-dd`.
- No `country` field inside each JSON file — country is implied by filename / registry key.
- Refresh refuses to write if parse yields **0** holidays.
- On fetch/HTTP/parse failure: do **not** overwrite an existing JSON for that country.

### npm scripts

| Script | Behavior |
| --- | --- |
| `holidays:vn` / `holidays:jp` / `holidays:us` / `holidays:cn` | Fetch + write that country only |
| `holidays:all` | Fetch all registry countries sequentially; fail the run if any country fails (already-written successes may remain — document in README) |

Generalize `scripts/fetch-vn-holidays.mjs` into `scripts/fetch-holidays.mjs` (CLI arg or env for country / `all`). Keep a thin `fetch-vn-holidays.mjs` re-export/wrapper **or** update `package.json` to point at the new script — prefer one implementation file to avoid drift.

### Runtime API (`holidays.ts`)

- Import all four datasets; export `HOLIDAY_COUNTRIES` metadata for UI labels/order: `vn`, `jp`, `us`, `cn`.
- Extend record type used across countries: `{ date: string; name: string; country: CountryCode }`.
- `getHolidaysForCountries(codes: CountryCode[]): HolidayRecord[]` — concat selected datasets, tagging each row with `country` (merge step needs this; JSON files stay without `country`).
- Keep existing helpers: `resolveHolidayWindow`, `filterHolidaysForWindow`, `toExcludedKey`, `mergeHolidaySelection`, `removeKeys`, `rehydrateHolidaySelection`, `countExcludedHolidays`.
- **New:** `mergeHolidayChips(records): { key, date, label, names, countries }[]`:
  - Group by `date`.
  - Chip `key` remains `dd/MM/yyyy` (same as today) so `excludedDates` stays date-based.
  - Label format: `dd/MM/yyyy · <names> · <COUNTRY_CODES>`
    - Names: distinct `name` values joined with ` / `, ordered by first appearance in stable country order (`vn`→`jp`→`us`→`cn`).
    - Country codes on the chip: uppercase short codes joined by `, ` (e.g. `VN, US`), same country order.
- Stop using `vnHolidaysDataset` in UI; export a `holidayDatasets` map (and optionally keep `vnHolidaysDataset` as a thin alias only while tests migrate).

### Window rules

Unchanged from phase 1:

| Mode | Holiday list window |
| --- | --- |
| Range (`calcType === "1"`) | `[startDate, endDate]` inclusive; start-only → that single day |
| Accumulate (`calcType === "2"`) | Full calendar year of `startDate` |

On window or selected-country change while master is on:

- Keys still in the new chip set: preserve user unchecked state.
- Newly appeared keys: default **selected** (on).
- Keys that left the set: remove from `excludedDates` via existing sync pattern.

## UI / UX (`CalculatorForm.vue`)

Replace the phase 1 block labeled “Loại trừ ngày lễ VN” with:

1. **Master control** — label `Loại trừ ngày lễ`; checkbox; disabled until `startDate` is set (same `canUseHolidays` gate). Hint when disabled: `Chọn ngày bắt đầu trước`.
2. **Country pills** — visible only when master is on. Multi-select toggles for `VN` / `JP` / `US` / `CN` (short labels on pills; full names via `title` or `aria-label`).
3. **Empty countries** — when master on and `selectedCountries.length === 0`: short copy `Chọn quốc gia` (no holiday chips).
4. **Holiday chips** — when master on and ≥1 country: scrollable chip row as today; empty window copy `Không có ngày lễ trong khoảng này`.
5. **Criteria summary** — replace `Lễ VN · N` with `Lễ · N`. `App.vue` computes `N` like phase 1, without lifting `selectedCountries`: intersect `excludedDates` with holiday keys from `getHolidaysForCountries(['vn','jp','us','cn'])` filtered to the current window (distinct dates). Manual “ngày cụ thể” that happens to equal a holiday still counts — same edge class as phase 1.

### Apple-design constraints (implementation bar)

- **Response:** pill/chip visual pressed state on pointer-down (`active:scale-[0.97]`, ~100ms ease-out); no wait-for-click-only feedback.
- **Agency:** multi-country choice; per-chip opt-out; turning master off does not wipe country picks.
- **Familiarity:** reuse existing blue selected styling (`border-[#0071e3]/…`, `bg-[#0071e3]/10`) already used for weekday chips.
- **Simplicity:** country row and holiday chips only appear when useful (master on; chips after countries chosen).
- **Spatial consistency:** country row sits directly under the master row; holiday chips under countries — same vertical rhythm as phase 1.
- **Reduced motion:** honor `motion-reduce:` / `prefers-reduced-motion` (disable scale / fade-in animations).
- **No new motion library** in this phase.

### State

| State | Default | Notes |
| --- | --- | --- |
| `excludeHolidays` | `false` | Renames/replaces `excludeVnHolidays` |
| `selectedCountries` | `[]` | Persists across master off→on |
| `selectedHolidayKeys` | `[]` | Keys `dd/MM/yyyy` currently checked |
| `excludedDates` (prop) | parent-owned | Source of truth for calculation |

Master **off**:

- Clear holiday keys that belong to the current (or last) holiday chip set from `excludedDates` using the existing remove/sync helpers.
- Leave `selectedCountries` intact.

Master **on** with countries:

- Build chips from selected countries + window; sync selection into `excludedDates` as phase 1.

Rehydrate on remount (edit flow): if `excludedDates` intersects holiday keys for any registry country in the current window, set `excludeHolidays` true, derive `selectedCountries` as countries that have at least one intersecting holiday date in-window, and restore chip selection. Prefer minimal surprise: only auto-enable countries that actually contribute intersecting keys.

## Error handling

| Case | Behavior |
| --- | --- |
| ICS HTTP error | Exit non-zero; leave that country's JSON untouched |
| Parse yields 0 events | Exit non-zero; refuse overwrite |
| Missing JSON at build (dev forgot fetch) | TypeScript/import failure — ship committed JSON for all four countries in the PR |
| Empty chip list | UI copy only; not an error |

## Testing

- **Parser:** keep VN fixture behavior; add at least one English official-calendar fixture proving “all VEVENT” include rule and date/name extraction.
- **Merge chips:** same date from two countries → one chip; label includes both country codes; distinct names joined stably.
- **Window + multi-country filter:** selecting `vn`+`us` only returns those datasets’ dates in range.
- **Selection sync:** master off removes holiday keys; master on restores from selected chips; country deselect drops that country’s dates from the chip set and from selection sync.
- **Rehydrate:** excluded holiday dates restore master + countries + chips without forcing unchecked holidays back on.
- **Manual / browser:** enable master → select VN+US → verify chips merge on shared dates → toggle chips → calculate → summary shows `Lễ · N`; resize mobile + desktop; reduced-motion path.

## Files likely touched

- `scripts/lib/holidaySources.mjs` (new)
- `scripts/lib/parseIcsHolidays.mjs` (new or rename from `parseVnIcs.mjs`)
- `scripts/lib/*.test.mjs`
- `scripts/fixtures/` (add EN sample)
- `scripts/fetch-holidays.mjs` (+ retire or wrap `fetch-vn-holidays.mjs`)
- `package.json` scripts + `README.md`
- `src/data/holidays-{jp,us,cn}.json` (generated + committed)
- `src/lib/holidays.ts` / `holidays.test.ts`
- `src/components/CalculatorForm.vue`
- `src/components/CriteriaSummary.vue`
- `src/App.vue`

## Success criteria

1. `npm run holidays:all` produces four non-empty JSON snapshots without wiping a file on a failed country fetch mid-run for that failed country.
2. User can exclude holidays from any non-empty subset of `{vn,jp,us,cn}` in one calculation.
3. Shared calendar dates appear as a single chip with merged labeling.
4. Default open form does not exclude holidays and has no countries selected.
5. Summary badge reads `Lễ · N` with correct distinct-date count.
6. UI matches existing form language and meets the Apple-design constraints above; verified in browser on desktop and mobile widths.
