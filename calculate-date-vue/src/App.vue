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
</script>

<template>
  <div class="app-shell">
    <div class="mx-auto max-w-5xl space-y-7 px-4 py-10 sm:px-6 lg:px-8">
      <header class="text-center">
        <h1 class="app-title">Công cụ Tính toán Ngày</h1>
        <p class="app-subtitle">Tính khoảng ngày hoặc cộng dồn, có loại trừ thứ</p>
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
          @edit="editing = true"
        />
        <ResultDisplay :result="result" :maxRow="maxRow" :totalCount="totalCount" />
      </div>
    </div>
  </div>
</template>

<style>
@reference "tailwindcss";

.app-shell {
  min-height: 100dvh;
  font-family:
    system-ui,
    -apple-system,
    "SF Pro Text",
    "Segoe UI",
    sans-serif;
  color: #1c1c1e;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(0, 122, 255, 0.08), transparent 60%),
    #f2f2f7;
}

.app-title {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-optical-sizing: auto;
  color: #1c1c1e;
}

.app-subtitle {
  margin: 0.5rem auto 0;
  max-width: 28rem;
  font-size: 0.9375rem;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: #8e8e93;
}

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
  .app-shell {
    background: #f2f2f7;
  }

  .p-datepicker .p-datepicker-input {
    background: #fff;
  }
}
</style>
