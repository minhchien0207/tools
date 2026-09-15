<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { daysOfWeek } from "@/composables/useDateCalculator";

const props = defineProps<{
  calcType: string;
  startDate: Date | null;
  endDate: Date | null;
  totalDays: number | null;
  methodType: string;
  excludedDays: number[];
  excludedDates: string[];
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

const excludedDatesLabel = computed(() => {
  if (!props.excludedDates.length) return null;
  const list = props.excludedDates.slice(0, 3).join(", ");
  const more =
    props.excludedDates.length > 3
      ? ` +${props.excludedDates.length - 3}`
      : "";
  return `Ngày: ${list}${more}`;
});
</script>

<template>
  <div
    class="animate-fade-in flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_6px_20px_rgba(0,0,0,0.05)] backdrop-blur-[20px] backdrop-saturate-150"
  >
    <div class="min-w-0 flex-1">
      <div
        class="text-[0.6875rem] font-semibold tracking-[0.02em] text-[#8e8e93] uppercase"
      >
        Điều kiện đã chọn
      </div>
      <div
        class="mt-0.5 text-[0.9375rem] font-semibold tracking-[-0.015em] text-[#1c1c1e]"
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
          class="inline-flex items-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#0071e3]"
          >{{ methodLabel }}</span
        >
        <span
          v-if="excludedLabel"
          class="inline-flex items-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#0071e3]"
          >{{ excludedLabel }}</span
        >
        <span
          v-if="excludedDatesLabel"
          class="inline-flex items-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#0071e3]"
          >{{ excludedDatesLabel }}</span
        >
        <span
          v-if="!excludedLabel && !excludedDatesLabel"
          class="inline-flex items-center rounded-full bg-black/8 px-2.5 py-0.5 text-xs font-medium tracking-[-0.01em] text-[#86868b]"
          >Không loại trừ</span
        >
      </div>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-xl bg-[#0071e3] px-3.5 py-2.5 text-[0.9375rem] font-semibold tracking-[-0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[background-color,transform] duration-100 ease-out hover:bg-[#0077ed] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
      @click="$emit('edit')"
    >
      Sửa
    </button>
  </div>
</template>
