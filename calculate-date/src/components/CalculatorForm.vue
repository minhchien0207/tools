<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { format } from "date-fns";
import DatePicker from "primevue/datepicker";
import { daysOfWeek } from "@/composables/useDateCalculator";
import {
  HOLIDAY_COUNTRIES,
  type CountryCode,
  colorForCountry,
  getHolidaysForCountries,
  mergeHolidayChips,
  resolveHolidayWindow,
  filterHolidaysForWindow,
  toExcludedKey,
  mergeHolidaySelection,
  removeKeys,
  rehydrateHolidaySelection,
} from "@/lib/holidays";
import SegmentControl from "@/components/shared/SegmentControl.vue";
import DateField from "@/components/shared/DateField.vue";

const calcTypeOptions = [
  { value: "1", label: "Khoảng ngày" },
  { value: "2", label: "Cộng dồn" },
];

const methodTypeOptions = [
  { value: "1", label: "Đủ số ngày chọn" },
  { value: "2", label: "Đúng thời gian thực tế" },
];

const props = defineProps<{
  calcType: string;
  startDate: Date | null;
  endDate: Date | null;
  totalDays: number | null;
  methodType: string;
  excludedDays: number[];
  excludedDates: string[];
}>();

const emit = defineEmits<{
  "update:calcType": [value: string];
  "update:startDate": [value: any];
  "update:endDate": [value: any];
  "update:totalDays": [value: number | null];
  "update:methodType": [value: string];
  "update:excludedDays": [value: number[]];
  "update:excludedDates": [value: string[]];
  calculate: [];
}>();

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

const shortDay = (label: string) =>
  label === "Chủ nhật" ? "CN" : label.replace("Thứ ", "T");

const toggleExcluded = (value: number) => {
  const next = props.excludedDays.includes(value)
    ? props.excludedDays.filter((d) => d !== value)
    : [...props.excludedDays, value];
  emit("update:excludedDays", next);
};

const pickDate = ref<Date | null>(null);
const excludePickerKey = ref(0);
const excludePickerRef = ref<{
  currentMonth: number;
  currentYear: number;
} | null>(null);

/** Last month the user opened/navigated/selected in the exclude picker. */
const lastExcludeView = ref<{ month: number; year: number } | null>(null);

const rememberExcludeView = (month: number, year: number) => {
  lastExcludeView.value = { month, year };
};

const applyExcludePickerMonth = () => {
  const picker = excludePickerRef.value;
  if (!picker) return;

  // Prefer last user choice; first open falls back to startDate month.
  const view = lastExcludeView.value;
  if (view) {
    picker.currentMonth = view.month;
    picker.currentYear = view.year;
    return;
  }

  const anchor = props.startDate;
  if (anchor) {
    picker.currentMonth = anchor.getMonth();
    picker.currentYear = anchor.getFullYear();
  }
};

// PrimeVue can emit an empty value (`undefined`) and nullable entries for
// range/multiple selection modes, even though this picker uses single mode.
const addExcludedDate = (
  value: Date | Date[] | (Date | null)[] | null | undefined,
) => {
  const date = Array.isArray(value) ? value[0] : value;
  // Ignore null emits from remount/clear.
  if (!date) return;

  rememberExcludeView(date.getMonth(), date.getFullYear());
  const key = format(date, "dd/MM/yyyy");
  if (!props.excludedDates.includes(key)) {
    emit("update:excludedDates", [...props.excludedDates, key]);
  }

  // Remount picker so PrimeVue cannot leave the selected date in the input.
  pickDate.value = null;
  excludePickerKey.value += 1;
};

const syncExcludePickerMonth = async () => {
  // PrimeVue may reset month from viewDate during open — re-apply after that.
  await nextTick();
  applyExcludePickerMonth();
  setTimeout(applyExcludePickerMonth, 0);
};

/** PrimeVue month-change uses 1-based month. */
const onExcludeMonthChange = (event: { month: number; year: number }) => {
  rememberExcludeView(event.month - 1, event.year);
};

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

</script>

<template>
  <div
    class="relative h-fit overflow-hidden rounded-[1.125rem] border border-[#d2d2d7]/70 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_18px_rgba(0,0,0,0.04)] backdrop-blur-[20px] backdrop-saturate-150"
  >
    <div
      class="flex flex-col gap-3.5 px-4 pt-4 pb-3.5 sm:gap-4 sm:px-5 sm:pt-4.5 sm:pb-4"
    >
      <!-- Kiểu tính -->
      <div class="min-w-0">
        <div
          class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        >
          Kiểu tính
        </div>
        <SegmentControl
          :modelValue="calcType"
          :options="calcTypeOptions"
          ariaLabel="Kiểu tính"
          @update:modelValue="emit('update:calcType', $event)"
        />
      </div>

      <!-- Ngày -->
      <div class="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <DateField
          label="Ngày bắt đầu"
          :modelValue="startDate"
          placeholder="Chọn ngày"
          @update:modelValue="emit('update:startDate', $event)"
        />

        <DateField
          v-if="calcType === '1'"
          class="animate-fade-in"
          label="Ngày kết thúc"
          :modelValue="endDate"
          placeholder="Chọn ngày"
          @update:modelValue="emit('update:endDate', $event)"
        />

        <div v-else class="animate-fade-in min-w-0">
          <div
            class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
          >
            Tổng số ngày
          </div>
          <input
            type="number"
            :value="totalDays"
            @input="
              emit(
                'update:totalDays',
                ($event.target as HTMLInputElement).valueAsNumber,
              )
            "
            class="w-full rounded-[0.625rem] border border-[#d2d2d7] bg-white/90 px-3 py-[0.55rem] text-[0.9375rem] text-[#1d1d1f] outline-none transition-[border-color,box-shadow] duration-100 ease-out focus:border-[#0071e3] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.18)]"
            placeholder="Nhập số ngày"
          />
        </div>
      </div>

      <!-- Cách tính (type 2) -->
      <div v-if="calcType === '2'" class="animate-fade-in min-w-0">
        <div
          class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        >
          Cách tính
        </div>
        <SegmentControl
          :modelValue="methodType"
          :options="methodTypeOptions"
          ariaLabel="Cách tính"
          @update:modelValue="emit('update:methodType', $event)"
        />
      </div>

      <!-- Loại trừ thứ -->
      <div class="min-w-0 border-t border-black/5 pt-1">
        <div
          class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        >
          Loại trừ thứ
        </div>
        <div
          class="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Loại trừ thứ trong tuần"
        >
          <button
            v-for="day in daysOfWeek"
            :key="day.value"
            type="button"
            class="min-w-10 flex-1 basis-[calc(14.28%-0.375rem)] cursor-pointer rounded-full border px-[0.35rem] py-[0.4rem] text-xs font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
            :class="
              excludedDays.includes(day.value)
                ? 'border-[#0071e3]/35 bg-[#0071e3]/10 text-[#0071e3]'
                : 'border-[#d2d2d7] bg-white/85 text-[#1d1d1f]'
            "
            :aria-pressed="excludedDays.includes(day.value)"
            @click="toggleExcluded(day.value)"
          >
            {{ shortDay(day.label) }}
          </button>
        </div>
      </div>

      <!-- Loại trừ ngày lễ -->
      <div class="min-w-0">
        <div class="flex items-center justify-between gap-3">
          <label
            class="text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
            for="exclude-holidays"
          >
            Loại trừ ngày lễ
          </label>
          <input
            id="exclude-holidays"
            type="checkbox"
            class="size-4 accent-[#0071e3] disabled:opacity-40"
            :checked="excludeHolidays"
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
          v-else-if="excludeHolidays"
          class="animate-fade-in mt-2 motion-reduce:animate-none"
        >
          <div
            class="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Quốc gia ngày lễ"
          >
            <button
              v-for="country in HOLIDAY_COUNTRIES"
              :key="country.code"
              type="button"
              class="inline-flex min-w-10 cursor-pointer items-center gap-1.5 rounded-full border px-[0.65rem] py-[0.4rem] text-xs font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              :class="
                selectedCountries.includes(country.code)
                  ? 'border-[#0071e3]/35 bg-[#0071e3]/10 text-[#0071e3]'
                  : 'border-[#d2d2d7] bg-white/85 text-[#1d1d1f]'
              "
              :aria-pressed="selectedCountries.includes(country.code)"
              :aria-label="country.label"
              :title="country.label"
              @click="toggleCountry(country.code)"
            >
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :style="{ backgroundColor: colorForCountry(country.code) }"
                aria-hidden="true"
              />
              {{ country.short }}
            </button>
          </div>
          <p
            v-if="!selectedCountries.length"
            class="mt-2 text-xs tracking-[-0.01em] text-[#86868b]"
          >
            Chọn quốc gia
          </p>
          <template v-else>
            <p
              v-if="!holidayChips.length"
              class="mt-2 text-xs tracking-[-0.01em] text-[#86868b]"
            >
              Không có ngày lễ trong khoảng này
            </p>
            <div
              v-else
              class="relative mt-2 max-h-40 overflow-y-auto"
            >
              <div class="flex flex-wrap gap-1.5 pb-1">
                <button
                  v-for="chip in holidayChips"
                  :key="chip.key"
                  type="button"
                  class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border py-[0.3rem] px-[0.65rem] text-xs font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                  :class="
                    selectedHolidayKeys.includes(chip.key)
                      ? 'border-[#0071e3]/30 bg-[#0071e3]/10 text-[#0071e3]'
                      : 'border-[#d2d2d7] bg-white/85 text-[#86868b]'
                  "
                  :aria-pressed="selectedHolidayKeys.includes(chip.key)"
                  :title="chip.label"
                  @click="toggleHolidayChip(chip.key)"
                >
                  <span
                    class="inline-flex shrink-0 items-center gap-0.5"
                    aria-hidden="true"
                  >
                    <span
                      v-for="code in chip.countries"
                      :key="code"
                      class="h-1.5 w-1.5 rounded-full"
                      :style="{ backgroundColor: colorForCountry(code) }"
                    />
                  </span>
                  <span class="tabular-nums">{{ chip.label }}</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Loại trừ ngày cụ thể -->
      <div class="min-w-0">
        <div
          class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        >
          Loại trừ ngày cụ thể
        </div>
        <div class="flex flex-col gap-2">
          <DatePicker
            :key="excludePickerKey"
            ref="excludePickerRef"
            :modelValue="pickDate"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Thêm ngày"
            fluid
            @update:modelValue="addExcludedDate"
            @show="syncExcludePickerMonth"
            @month-change="onExcludeMonthChange"
          />
          <div v-if="excludedDates.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="key in excludedDates"
              :key="key"
              type="button"
              class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#0071e3]/30 bg-[#0071e3]/10 py-[0.3rem] pr-[0.55rem] pl-[0.65rem] text-xs font-medium tracking-[-0.01em] text-[#0071e3] transition-[background-color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              :title="`Bỏ loại trừ ${key}`"
              @click="removeExcludedDate(key)"
            >
              <span class="tabular-nums">{{ key }}</span>
              <span class="text-[0.95rem] leading-none opacity-70" aria-hidden="true"
                >×</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="border-t border-black/5 bg-[#f5f5f7]/65 px-4 pt-3 pb-4 backdrop-blur-md sm:px-5 sm:pt-3.5 sm:pb-4.5"
    >
      <button
        type="button"
        class="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#0071e3] px-4.5 py-3 text-[0.9375rem] font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-[background-color,transform] duration-100 ease-out hover:bg-[#0077ed] active:scale-[0.98] active:bg-[#006edb] motion-reduce:transition-none motion-reduce:active:scale-100"
        @click="emit('calculate')"
      >
        Tính kết quả
      </button>
    </div>
  </div>
</template>
