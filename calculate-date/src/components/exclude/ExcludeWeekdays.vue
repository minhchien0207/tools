<script setup lang="ts">
import { daysOfWeek } from "@/composables/useDateCalculator";

const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: number[]];
}>();

const shortDay = (label: string) =>
  label === "Chủ nhật" ? "CN" : label.replace("Thứ ", "T");

const toggleExcluded = (value: number) => {
  const next = props.modelValue.includes(value)
    ? props.modelValue.filter((d) => d !== value)
    : [...props.modelValue, value];
  emit("update:modelValue", next);
};
</script>

<template>
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
          modelValue.includes(day.value)
            ? 'border-[#0071e3]/35 bg-[#0071e3]/10 text-[#0071e3]'
            : 'border-[#d2d2d7] bg-white/85 text-[#1d1d1f]'
        "
        :aria-pressed="modelValue.includes(day.value)"
        @click="toggleExcluded(day.value)"
      >
        {{ shortDay(day.label) }}
      </button>
    </div>
  </div>
</template>
