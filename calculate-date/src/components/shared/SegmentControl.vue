<script setup lang="ts">
import { useId } from "vue";

defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const groupId = useId();

const segmentItem =
  "flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-2 text-center text-[0.8125rem] font-medium tracking-[-0.01em] text-[#1d1d1f] transition-[background-color,box-shadow,transform] duration-100 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
const segmentOn = "bg-white font-semibold shadow-sm";
</script>

<template>
  <div
    class="grid gap-0.5 rounded-[0.625rem] bg-[#e8e8ed] p-0.5"
    :style="{
      gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
    }"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <label
      v-for="opt in options"
      :key="opt.value"
      :class="[segmentItem, modelValue === opt.value ? segmentOn : '']"
    >
      <input
        class="sr-only"
        type="radio"
        :name="groupId"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="emit('update:modelValue', opt.value)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
