<script setup lang="ts">
import { useDateCalculator } from "@/composables/useDateCalculator";
import CalculatorForm from "@/components/CalculatorForm.vue";
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
</script>

<template>
  <div
    class="min-h-screen bg-linear-to-br from-slate-50 to-blue-100/50 px-4 py-10 font-sans text-gray-800 sm:px-6 lg:px-8"
  >
    <div class="mx-auto max-w-5xl space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1
          class="bg-linear-to-r from-slate-700 to-blue-800 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent"
        >
          Công cụ Tính toán Ngày
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-base text-slate-500">
          Nhanh chóng và chính xác với giao diện hiện đại, chuyên nghiệp
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <!-- Form Section -->
        <CalculatorForm
          v-model:calcType="calcType"
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          v-model:totalDays="totalDays"
          v-model:methodType="methodType"
          v-model:excludedDays="excludedDays"
          @calculate="calculate"
        />

        <!-- Result Section -->
        <ResultDisplay :result="result" :maxRow="maxRow" :totalCount="totalCount" />
      </div>
    </div>
  </div>
</template>

<style>
@reference "tailwindcss";

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.97) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Ensure inputs take up full width properly */
.p-datepicker {
  @apply w-full;
}

/* Customizing PrimeVue Input to match our theme */
.p-datepicker .p-inputtext {
  @apply rounded-r-none border-gray-200 shadow-xs transition-all duration-200;
}

.p-datepicker .p-inputtext:focus {
  @apply border-blue-400 ring-2 ring-blue-100 outline-hidden;
}

/* Fix for broken icon layout in some browsers */
.p-datepicker.p-inputwrapper {
  @apply flex w-full;
}

.p-datepicker .p-datepicker-trigger {
  @apply rounded-l-none border-l-0 border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100;
}
</style>
