<script setup lang="ts">
import { computed } from "vue";
import type { AgeResultData } from "@/composables/useAgeCalculator";

const props = defineProps<{
  result: AgeResultData;
  asOfIsToday?: boolean;
}>();

const primaryLine = computed(
  () =>
    `${props.result.years} năm · ${props.result.months} tháng · ${props.result.days} ngày`,
);

const secondaryLine = computed(() => `Tổng ${props.result.totalDays} ngày`);

const contextLine = computed(() => {
  const asOfLabel = props.asOfIsToday ? "hôm nay" : props.result.asOfKey;
  return `${props.result.birthKey} → ${asOfLabel}`;
});
</script>

<template>
  <div
    class="animate-scale-in motion-reduce:animate-none rounded-[1.25rem] border border-white/70 bg-white/70 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_28px_rgba(0,0,0,0.06)] backdrop-blur-[20px] backdrop-saturate-150 sm:px-5 sm:py-4.5"
  >
    <div
      class="text-[clamp(1.25rem,4.5vw,1.625rem)] font-semibold leading-tight tracking-[-0.03em] text-[#1c1c1e] tabular-nums"
    >
      {{ primaryLine }}
    </div>
    <div
      class="mt-1.5 text-[0.9375rem] font-medium tracking-[-0.015em] text-[#3a3a3c] tabular-nums"
    >
      {{ secondaryLine }}
    </div>
    <div
      class="mt-2 text-sm font-medium tracking-[-0.01em] text-[#8e8e93] tabular-nums"
    >
      {{ contextLine }}
    </div>
  </div>
</template>
