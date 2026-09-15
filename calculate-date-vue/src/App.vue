<script setup lang="ts">
import { nextTick, ref } from "vue";
import { useDateCalculator } from "@/composables/useDateCalculator";
import CalculatorForm from "@/components/CalculatorForm.vue";
import CriteriaSummary from "@/components/CriteriaSummary.vue";
import ResultDisplay from "@/components/ResultDisplay.vue";

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

/** Full form while editing; compact summary after a successful calculate. */
const editing = ref(true);

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
</script>

<template>
  <div
    class="min-h-dvh bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(0,122,255,0.08),transparent_60%),#f2f2f7] font-[system-ui,-apple-system,'SF_Pro_Text','Segoe_UI',sans-serif] text-[#1c1c1e]"
  >
    <div class="mx-auto max-w-5xl space-y-7 px-4 py-10 sm:px-6 lg:px-8">
      <header class="text-center">
        <h1
          class="text-[clamp(1.75rem,4vw,2.25rem)] leading-[1.1] font-bold tracking-[-0.025em] text-[#1c1c1e]"
        >
          Công cụ Tính toán Ngày
        </h1>
        <p
          class="mx-auto mt-2 max-w-md text-[0.9375rem] leading-snug tracking-[-0.01em] text-[#8e8e93]"
        >
          Tính khoảng ngày hoặc cộng dồn, có loại trừ thứ
        </p>
      </header>

      <div class="flex flex-col gap-5">
        <CalculatorForm
          v-if="editing"
          v-model:calcType="calcType"
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          v-model:totalDays="totalDays"
          v-model:methodType="methodType"
          v-model:excludedDays="excludedDays"
          v-model:excludedDates="excludedDates"
          @calculate="onCalculate"
        />
        <CriteriaSummary
          v-else
          :calcType="calcType"
          :startDate="startDate"
          :endDate="endDate"
          :totalDays="totalDays"
          :methodType="methodType"
          :excludedDays="excludedDays"
          :excludedDates="excludedDates"
          @edit="editing = true"
        />
        <ResultDisplay
          :result="result"
          :maxRow="maxRow"
          :totalCount="totalCount"
          :excludedDates="excludedDates"
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
  border-color: #d2d2d7;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: none;
  transition:
    border-color 120ms ease-out,
    box-shadow 120ms ease-out;
}
.p-datepicker .p-datepicker-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.18);
  outline: none;
}
.p-datepicker .p-datepicker-dropdown {
  border-radius: 0 0.625rem 0.625rem 0;
  border-color: #d2d2d7;
  border-left: 0;
  background: #f5f5f7;
  color: #86868b;
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
