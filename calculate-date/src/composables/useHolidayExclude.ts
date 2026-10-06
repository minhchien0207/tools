import { computed, ref, watch, type Ref, type ComputedRef } from "vue";
import {
  HOLIDAY_COUNTRIES,
  type CountryCode,
  type HolidayChip,
  getHolidaysForCountries,
  mergeHolidayChips,
  resolveHolidayWindow,
  filterHolidaysForWindow,
  toExcludedKey,
  mergeHolidaySelection,
  removeKeys,
  rehydrateHolidaySelection,
} from "@/lib/holidays";

export type HolidayExcludeProps = {
  calcType: string;
  startDate: Date | null;
  endDate: Date | null;
  excludedDates: string[];
};

export type HolidayExcludeEmit = {
  (e: "update:excludedDates", value: string[]): void;
};

export type UseHolidayExcludeReturn = {
  excludeHolidays: Ref<boolean>;
  selectedCountries: Ref<CountryCode[]>;
  selectedHolidayKeys: Ref<string[]>;
  holidayChips: ComputedRef<HolidayChip[]>;
  canUseHolidays: ComputedRef<boolean>;
  onToggleMaster: (checked: boolean) => void;
  toggleCountry: (code: CountryCode) => void;
  toggleHolidayChip: (key: string) => void;
  removeExcludedDate: (key: string) => void;
};

export function useHolidayExclude(
  props: HolidayExcludeProps,
  emit: HolidayExcludeEmit,
): UseHolidayExcludeReturn {
  const excludeHolidays = ref(false);
  /** Multi-select country codes; persists across master off→on */
  const selectedCountries = ref<CountryCode[]>([]);
  /** Keys (`dd/MM/yyyy`) currently selected in the holiday chip list */
  const selectedHolidayKeys = ref<string[]>([]);
  /** Previous window's selected keys — used to strip stale holiday keys on window change */
  const prevHolidayKeysInWindow = ref<string[]>([]);

  const holidayWindow = computed(() =>
    resolveHolidayWindow(props.calcType, props.startDate, props.endDate),
  );

  const holidaysInWindow = computed(() => {
    const w = holidayWindow.value;
    if (!w || selectedCountries.value.length === 0) return [];
    return filterHolidaysForWindow(
      getHolidaysForCountries(selectedCountries.value),
      w,
    );
  });

  const holidayChips = computed(() => mergeHolidayChips(holidaysInWindow.value));

  const canUseHolidays = computed(() => !!props.startDate);

  function applyRehydratedHolidayState() {
    const w = holidayWindow.value;
    const countriesWithHits: CountryCode[] = [];
    if (w) {
      const excluded = new Set(props.excludedDates);
      for (const { code } of HOLIDAY_COUNTRIES) {
        const keys = filterHolidaysForWindow(
          getHolidaysForCountries([code]),
          w,
        ).map((h) => toExcludedKey(h.date));
        if (keys.some((k) => excluded.has(k))) countriesWithHits.push(code);
      }
    }

    selectedCountries.value = countriesWithHits;

    const keysInWindow = w
      ? mergeHolidayChips(
          filterHolidaysForWindow(
            getHolidaysForCountries(countriesWithHits),
            w,
          ),
        ).map((c) => c.key)
      : [];

    const { selectedKeys, masterOn } = rehydrateHolidaySelection(
      props.excludedDates,
      keysInWindow,
    );
    selectedHolidayKeys.value = selectedKeys;
    excludeHolidays.value = masterOn;
    // Keep prev in sync with selected so later applyHolidaySync won't strip wrongly.
    prevHolidayKeysInWindow.value = masterOn ? [...selectedKeys] : [];
  }

  applyRehydratedHolidayState();

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
    excludeHolidays.value = checked;
    const keysInWindow = holidayChips.value.map((c) => c.key);
    if (!checked) {
      selectedHolidayKeys.value = [];
      applyHolidaySync([], keysInWindow);
      // Keep selectedCountries so pills restore on next master on.
      return;
    }
    selectedHolidayKeys.value = [...keysInWindow];
    applyHolidaySync(selectedHolidayKeys.value, keysInWindow);
  }

  function toggleCountry(code: CountryCode) {
    if (!excludeHolidays.value) return;
    const set = new Set(selectedCountries.value);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    selectedCountries.value = HOLIDAY_COUNTRIES.map((c) => c.code).filter((c) =>
      set.has(c),
    );
  }

  function toggleHolidayChip(key: string) {
    if (!excludeHolidays.value) return;
    const set = new Set(selectedHolidayKeys.value);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    selectedHolidayKeys.value = [...set];
    const keysInWindow = holidayChips.value.map((c) => c.key);
    applyHolidaySync(selectedHolidayKeys.value, keysInWindow);
  }

  watch(
    holidayChips,
    (chips) => {
      if (!excludeHolidays.value) {
        prevHolidayKeysInWindow.value = [];
        return;
      }
      const keysInWindow = chips.map((c) => c.key);
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

  const removeExcludedDate = (key: string) => {
    // Route holiday removals through chip sync so selection/prev stay aligned.
    if (excludeHolidays.value && selectedHolidayKeys.value.includes(key)) {
      toggleHolidayChip(key);
      return;
    }
    emit(
      "update:excludedDates",
      props.excludedDates.filter((d) => d !== key),
    );
  };

  return {
    excludeHolidays,
    selectedCountries,
    selectedHolidayKeys,
    holidayChips,
    canUseHolidays,
    onToggleMaster,
    toggleCountry,
    toggleHolidayChip,
    removeExcludedDate,
  };
}
