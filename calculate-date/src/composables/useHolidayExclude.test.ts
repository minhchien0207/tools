import { expect, test, beforeEach } from "vitest";
import { nextTick, reactive } from "vue";
import { useHolidayExclude } from "./useHolidayExclude";
import type { HolidayExcludeProps } from "./useHolidayExclude";

beforeEach(() => {
  const { api } = setup();
  api.selectedCountries.value = [];
  api.selectedHolidayKeys.value = [];
});

function setup(excludedDates: string[] = []) {
  const state = reactive<HolidayExcludeProps>({
    calcType: "1",
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 2, 31),
    excludedDates: [...excludedDates],
  });
  const api = useHolidayExclude(state, (e, value) => {
    if (e === "update:excludedDates") state.excludedDates = value;
  });
  return { state, api };
}

test("remount after master off restores last country, not every country", async () => {
  const first = setup();
  first.api.onToggleMaster(true);
  first.api.toggleCountry("vn");
  await nextTick();
  expect(first.api.selectedCountries.value).toEqual(["vn"]);
  first.api.onToggleMaster(false);

  const second = setup(first.state.excludedDates);
  second.api.onToggleMaster(true);
  await nextTick();

  expect(second.api.selectedCountries.value).toEqual(["vn"]);
});

test("master off then on restores last holiday chips, not every chip in the list", async () => {
  const { api } = setup();
  api.onToggleMaster(true);
  api.toggleCountry("vn");
  await nextTick();

  const all = [...api.selectedHolidayKeys.value];
  expect(all.length).toBeGreaterThan(1);
  const keep = all[0];
  for (const key of all.slice(1)) api.toggleHolidayChip(key);
  expect(api.selectedHolidayKeys.value).toEqual([keep]);

  api.onToggleMaster(false);
  api.onToggleMaster(true);
  await nextTick();

  expect(api.selectedHolidayKeys.value).toEqual([keep]);
});
