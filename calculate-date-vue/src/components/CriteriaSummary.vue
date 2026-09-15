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
  <div class="summary-card animate-fade-in">
    <div class="summary-body">
      <div class="summary-kicker">Điều kiện đã chọn</div>
      <div class="summary-title">{{ typeLabel }}</div>
      <div class="summary-range tabular-nums">{{ rangeLabel }}</div>
      <div class="summary-chips">
        <span v-if="methodLabel" class="chip">{{ methodLabel }}</span>
        <span v-if="excludedLabel" class="chip">{{ excludedLabel }}</span>
        <span v-if="excludedDatesLabel" class="chip">{{ excludedDatesLabel }}</span>
        <span
          v-if="!excludedLabel && !excludedDatesLabel"
          class="chip chip--muted"
          >Không loại trừ</span
        >
      </div>
    </div>
    <button type="button" class="edit-btn" @click="$emit('edit')">
      Sửa
    </button>
  </div>
</template>

<style scoped>
.summary-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 6px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  padding: 0.875rem 0.875rem 0.875rem 1rem;
}

.summary-body {
  min-width: 0;
  flex: 1;
}

.summary-kicker {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #8e8e93;
}

.summary-title {
  margin-top: 0.125rem;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: #1c1c1e;
}

.summary-range {
  margin-top: 0.125rem;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #3a3a3c;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(0, 113, 227, 0.08);
  color: #0071e3;
  padding: 0.2rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.chip--muted {
  background: rgba(60, 60, 67, 0.08);
  color: #86868b;
}

.edit-btn {
  flex-shrink: 0;
  border: none;
  border-radius: 0.75rem;
  background: #0071e3;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  padding: 0.625rem 0.9rem;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.25) inset;
  transition:
    background-color 120ms ease-out,
    transform 100ms ease-out;
}

.edit-btn:hover {
  background: #0077ed;
}

.edit-btn:active {
  transform: scale(0.97);
}

@media (prefers-reduced-transparency: reduce) {
  .summary-card {
    background: #fff;
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .edit-btn {
    transition: none;
  }

  .edit-btn:active {
    transform: none;
  }
}
</style>
