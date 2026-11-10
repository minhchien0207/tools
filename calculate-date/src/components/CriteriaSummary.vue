<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { daysOfWeek } from "@/composables/useDateCalculator";
import { specificExcludedChipLabel } from "@/lib/holidays";

const props = defineProps<{
  calcType: string;
  startDate: Date | null;
  endDate: Date | null;
  totalDays: number | null;
  methodType: string;
  excludedDays: number[];
  excludedDates: string[];
  holidayExcludedCount: number;
}>();

defineEmits<{
  edit: [];
}>();

const fmt = (d: Date | null) => (d ? format(d, "dd/MM/yyyy") : "—");

const typeLabel = computed(() =>
  props.calcType === "1" ? "Khoảng ngày" : "Cộng dồn",
);

const rangeLabel = computed(() => {
  if (props.calcType === "1") {
    return `${fmt(props.startDate)} → ${fmt(props.endDate)}`;
  }
  return `Từ ${fmt(props.startDate)} · ${props.totalDays ?? "—"} ngày`;
});

const methodLabel = computed(() => {
  if (props.calcType !== "2") return null;
  return props.methodType === "1"
    ? "Đủ số ngày chọn"
    : "Đúng thời gian thực tế";
});

const excludedLabel = computed(() => {
  if (!props.excludedDays.length) return null;
  const labels = daysOfWeek
    .filter((d) => props.excludedDays.includes(d.value))
    .map((d) => (d.label === "Chủ nhật" ? "CN" : d.label.replace("Thứ ", "T")));
  return `Thứ: ${labels.join(", ")}`;
});

const excludedDatesLabel = computed(() =>
  specificExcludedChipLabel(props.excludedDates, props.holidayExcludedCount),
);
</script>

<template>
  <div
    class="animate-fade-in flex items-center gap-3 rounded-[1.25rem] border border-white/80 bg-white/92 p-3.5 pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.05)] backdrop-blur-[20px] backdrop-saturate-150"
  >
    <div class="min-w-0 flex-1">
      <div
        class="text-[0.6875rem] font-semibold tracking-[0.02em] text-secondary uppercase"
      >
        Điều kiện đã chọn
      </div>
      <div
        class="mt-0.5 text-[0.9375rem] font-semibold tracking-[-0.015em] text-label"
      >
        {{ typeLabel }}
      </div>
      <div
        class="mt-0.5 text-sm font-medium tracking-[-0.01em] text-[#3a3a3c] tabular-nums"
      >
        {{ rangeLabel }}
      </div>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-if="methodLabel"
          class="inline-flex items-center whitespace-nowrap rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#3a3a3c]"
          >{{ methodLabel }}</span
        >
        <span
          v-if="excludedLabel"
          class="inline-flex items-center whitespace-nowrap rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#3a3a3c]"
          >{{ excludedLabel }}</span
        >
        <span
          v-if="excludedDatesLabel"
          class="inline-flex items-center whitespace-nowrap rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#3a3a3c]"
          >{{ excludedDatesLabel }}</span
        >
        <span
          v-if="holidayExcludedCount > 0"
          class="inline-flex items-center whitespace-nowrap rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#3a3a3c]"
          >Lễ · {{ holidayExcludedCount }}</span
        >
        <span
          v-if="!excludedLabel && !excludedDatesLabel && holidayExcludedCount === 0"
          class="inline-flex items-center rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-tertiary"
          >Không loại trừ</span
        >
      </div>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-xl bg-accent px-3.5 py-2.5 text-[0.9375rem] font-semibold tracking-[-0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[background-color,transform] duration-100 ease-out hover:bg-accent-hover active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
      @click="$emit('edit')"
    >
      Sửa
    </button>
  </div>
</template>
