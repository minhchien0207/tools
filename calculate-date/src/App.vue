<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useDateCalculator } from "@/composables/useDateCalculator";
import { useAgeCalculator } from "@/composables/useAgeCalculator";
import CalculatorForm from "@/components/CalculatorForm.vue";
import CriteriaSummary from "@/components/CriteriaSummary.vue";
import ResultDisplay from "@/components/results/ResultDisplay.vue";
import {
  getHolidaysForCountries,
  resolveHolidayWindow,
  filterHolidaysForWindow,
  holidayKeys,
  countExcludedHolidays,
} from "@/lib/holidays";

const {
  calcType,
  startDate,
  endDate,
  totalDays,
  methodType,
  excludedDays,
  excludedDates,
  result,
  maxRow,
  totalCount,
  calculate,
} = useDateCalculator();

const {
  birthDate,
  asOfMode,
  asOfDate,
  result: ageResult,
  asOfInvalid,
} = useAgeCalculator();

const holidayExcludedCount = computed(() => {
  const w = resolveHolidayWindow(
    calcType.value,
    startDate.value,
    endDate.value,
  );
  if (!w) return 0;
  const keys = [
    ...new Set(
      holidayKeys(
        filterHolidaysForWindow(
          getHolidaysForCountries(["vn", "jp", "us", "cn"]),
          w,
        ),
      ),
    ),
  ];
  return countExcludedHolidays(excludedDates.value, keys);
});

/** Full form while editing; compact summary after a successful calculate. */
const editing = ref(true);

watch(calcType, (t) => {
  if (t === "3") editing.value = true;
});

const onCalculate = async () => {
  if (!calculate()) return;
  editing.value = false;
  await nextTick();
  document.querySelector(".result-card")?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
};

const onExcludeDate = (date: string) => {
  if (!excludedDates.value.includes(date)) {
    excludedDates.value = [...excludedDates.value, date];
  }
  calculate();
};

const onRestoreDate = (date: string) => {
  excludedDates.value = excludedDates.value.filter((d) => d !== date);
  calculate();
};

const showDateResult = computed(
  () => calcType.value !== "3" && result.value !== null,
);
</script>

<template>
  <div
    class="min-h-dvh bg-[radial-gradient(900px_420px_at_50%_-8%,rgba(0,122,255,0.07),transparent_55%),var(--color-canvas)] font-[system-ui,-apple-system,'SF_Pro_Text','Segoe_UI',sans-serif] text-label"
  >
    <div
      class="mx-auto px-4 py-8 sm:px-6 lg:px-8"
      :class="showDateResult ? 'max-w-5xl' : 'max-w-[28rem]'"
    >
      <header class="mb-6" :class="showDateResult ? '' : 'text-center'">
        <h1
          class="text-[1.5rem] leading-tight font-semibold tracking-[-0.022em] text-label"
        >
          Tính ngày
        </h1>
      </header>

      <div
        :class="
          showDateResult
            ? 'grid items-start gap-5 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]'
            : 'flex flex-col'
        "
      >
        <div :class="showDateResult ? 'lg:sticky lg:top-4' : ''">
          <CalculatorForm
            v-if="calcType === '3' || editing"
            v-model:calcType="calcType"
            v-model:startDate="startDate"
            v-model:endDate="endDate"
            v-model:totalDays="totalDays"
            v-model:methodType="methodType"
            v-model:excludedDays="excludedDays"
            v-model:excludedDates="excludedDates"
            v-model:birthDate="birthDate"
            v-model:asOfMode="asOfMode"
            v-model:asOfDate="asOfDate"
            :ageResult="ageResult"
            :asOfInvalid="asOfInvalid"
            @calculate="onCalculate"
          />
          <CriteriaSummary
            v-else-if="calcType !== '3'"
            :calcType="calcType"
            :startDate="startDate"
            :endDate="endDate"
            :totalDays="totalDays"
            :methodType="methodType"
            :excludedDays="excludedDays"
            :excludedDates="excludedDates"
            :holidayExcludedCount="holidayExcludedCount"
            @edit="editing = true"
          />
        </div>
        <ResultDisplay
          v-if="showDateResult"
          :result="result"
          :maxRow="maxRow"
          :totalCount="totalCount"
          @exclude="onExcludeDate"
          @restore="onRestoreDate"
        />
      </div>
    </div>
  </div>
</template>

<style>
@reference "tailwindcss";

/* Shared enter animations (Form / Summary / Result). */
.animate-fade-in {
  animation: fadeIn 0.28s ease-out;
}
.animate-scale-in {
  animation: scaleIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: top center;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-scale-in {
    animation: none;
  }
}

/* PrimeVue DatePicker — cannot put utilities on its internals. */
.p-datepicker {
  @apply flex w-full;
}
.p-datepicker .p-datepicker-input {
  border-radius: 0.625rem 0 0 0.625rem;
  border-color: var(--color-separator);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: none;
  transition:
    border-color 120ms ease-out,
    box-shadow 120ms ease-out;
}
.p-datepicker .p-datepicker-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.18);
  outline: none;
}
.p-datepicker .p-datepicker-dropdown {
  border-radius: 0 0.625rem 0.625rem 0;
  border-color: var(--color-separator);
  border-left: 0;
  background: #f5f5f7;
  color: var(--color-tertiary);
  transition:
    background-color 120ms ease-out,
    transform 100ms ease-out;
}
.p-datepicker .p-datepicker-dropdown:hover {
  background: #e8e8ed;
  color: #1d1d1f;
}
.p-datepicker .p-datepicker-dropdown:active {
  transform: scale(0.97);
}
@media (prefers-reduced-transparency: reduce) {
  .p-datepicker .p-datepicker-input {
    background: #fff;
  }
}
</style>
