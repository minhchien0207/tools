<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import type { ResultData } from "@/composables/useDateCalculator";
import { daysOfWeek } from "@/composables/useDateCalculator";

const props = defineProps<{
  result: ResultData | null;
  maxRow: number;
  totalCount: number;
}>();

const shortLabel = (label: string) =>
  label === "Chủ nhật" ? "CN" : label.replace("Thứ ", "T");

const shortDate = (date: string) => date.slice(0, 5);

/** Initial / per-scroll batch size — keeps DOM light until needed. */
const PAGE = 20;

const scroller = ref<HTMLElement | null>(null);
const visibleRows = ref(PAGE);
const edgeTop = ref(false);
const edgeBottom = ref(false);

const updateEdges = () => {
  const el = scroller.value;
  if (!el) {
    edgeTop.value = false;
    edgeBottom.value = false;
    return;
  }
  const { scrollTop, scrollHeight, clientHeight } = el;
  edgeTop.value = scrollTop > 2;
  edgeBottom.value = scrollTop + clientHeight < scrollHeight - 2;
};

const { isLoading, reset } = useInfiniteScroll(
  scroller,
  () => {
    visibleRows.value = Math.min(visibleRows.value + PAGE, props.maxRow);
    nextTick(updateEdges);
  },
  {
    distance: 80,
    interval: 100,
    canLoadMore: () => !!props.result && visibleRows.value < props.maxRow,
  },
);

watch(
  () => [props.result, props.maxRow] as const,
  async () => {
    visibleRows.value = PAGE;
    reset();
    await nextTick();
    updateEdges();
  },
);
</script>

<template>
  <div>
    <div
      v-if="result"
      class="animate-scale-in result-card flex max-h-[min(70dvh,52rem)] flex-col overflow-hidden"
    >
      <!-- Fixed chrome: title -->
      <div class="result-title shrink-0">
        <h2 class="text-[1.0625rem] font-semibold tracking-[-0.02em] text-[#1c1c1e]">
          Bảng kết quả
        </h2>
        <span class="text-sm tabular-nums text-[#8e8e93]">{{ totalCount }} ngày</span>
      </div>

      <div v-if="maxRow === 0" class="px-4 py-12 text-center text-[#8e8e93]">
        Không có ngày nào phù hợp
      </div>

      <template v-else>
        <!-- Fixed chrome: weekdays -->
        <div class="week-heads shrink-0" aria-hidden="true">
          <div v-for="day in daysOfWeek" :key="day.value" class="week-head">
            {{ shortLabel(day.label) }}
          </div>
        </div>

        <!-- Scroll only the dates -->
        <div
          ref="scroller"
          class="week-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          :class="{ 'edge-top': edgeTop, 'edge-bottom': edgeBottom }"
          @scroll.passive="updateEdges"
        >
          <div class="week-board">
            <div v-for="day in daysOfWeek" :key="day.value" class="week-col">
              <div
                v-for="(date, idx) in result.data[day.value].slice(0, visibleRows)"
                :key="`${day.value}-${idx}`"
                class="day-chip"
                :class="{
                  'day-chip--end': date === result.lastDate,
                  'day-chip--start': date === result.startDate,
                }"
                :title="date"
              >
                {{ shortDate(date) }}
              </div>
            </div>
          </div>
          <div
            v-if="visibleRows < maxRow"
            class="load-more tabular-nums"
            aria-live="polite"
          >
            {{ isLoading ? "Đang tải…" : `Đã hiện ${visibleRows}/${maxRow} hàng` }}
          </div>
        </div>

        <!-- Fixed chrome: per-day counts + total -->
        <div class="result-footer shrink-0">
          <div class="week-counts">
            <div
              v-for="day in daysOfWeek"
              :key="day.value"
              class="week-count tabular-nums"
            >
              {{ result.data[day.value].length }}
            </div>
          </div>
          <div class="total-bar flex items-center justify-between px-5 py-3.5">
            <span class="text-[0.9375rem] font-medium text-white/90"
              >Tổng số ngày hợp lệ</span
            >
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-bold tracking-[-0.03em] tabular-nums">{{
                totalCount
              }}</span>
              <span class="text-sm font-medium text-white/70">ngày</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      v-else
      class="empty-card flex min-h-[220px] flex-col items-center justify-center p-8 text-center"
    >
      <div
        class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#007aff]/10 text-[#007aff]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 class="text-base font-semibold tracking-[-0.01em] text-[#1c1c1e]">Chưa có dữ liệu</h3>
      <p class="mt-1.5 max-w-sm text-sm leading-relaxed text-[#8e8e93]">
        Điền biểu mẫu phía trên rồi nhấn “Tính kết quả”.
      </p>
    </div>
  </div>
</template>

<style scoped>
.result-card,
.empty-card {
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 8px 28px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(20px) saturate(180%);
}

.empty-card {
  border-style: dashed;
  border-color: rgba(60, 60, 67, 0.18);
  background: rgba(255, 255, 255, 0.45);
}

.result-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

@media (min-width: 640px) {
  .result-title {
    padding-inline: 1.25rem;
  }
}

.week-heads,
.week-counts,
.week-board {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  width: 100%;
}

.week-heads {
  background: rgba(242, 242, 247, 0.92);
  backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.week-head {
  padding: 0.625rem 0.125rem;
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #8e8e93;
}

.week-scroll {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  /* Apple scroll-edge fade instead of hard dividers */
  mask-image: linear-gradient(#000, #000);
}

.week-scroll.edge-top {
  mask-image: linear-gradient(to bottom, transparent, #000 12px, #000);
}

.week-scroll.edge-bottom {
  mask-image: linear-gradient(to bottom, #000, #000 calc(100% - 12px), transparent);
}

.week-scroll.edge-top.edge-bottom {
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 12px,
    #000 calc(100% - 12px),
    transparent
  );
}

.week-board {
  align-items: start;
}

.week-col {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem 0.25rem 0.75rem;
  border-right: 1px solid rgba(60, 60, 67, 0.08);
}

.week-col:last-child {
  border-right: none;
}

.load-more {
  padding: 0.5rem 0.75rem 0.75rem;
  text-align: center;
  font-size: 0.75rem;
  color: #8e8e93;
}

.result-footer {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.04);
}

.week-counts {
  border-top: 1px solid rgba(60, 60, 67, 0.08);
  background: rgba(242, 242, 247, 0.85);
}

.week-count {
  padding: 0.5rem 0.125rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1c1c1e;
  border-right: 1px solid rgba(60, 60, 67, 0.08);
}

.week-count:last-child {
  border-right: none;
}

.day-chip {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid rgba(60, 60, 67, 0.1);
  background: rgba(255, 255, 255, 0.95);
  padding: 0.35rem 0.1rem;
  font-size: clamp(0.625rem, 2.4vw, 0.8125rem);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: #3a3a3c;
  white-space: nowrap;
}

.day-chip--start {
  border-color: rgba(255, 149, 0, 0.35);
  background: rgba(255, 149, 0, 0.12);
  color: #c93400;
}

.day-chip--end {
  border-color: rgba(52, 199, 89, 0.4);
  background: rgba(52, 199, 89, 0.12);
  color: #248a3d;
}

.total-bar {
  background: #007aff;
  color: white;
}

@media (prefers-reduced-transparency: reduce) {
  .result-card,
  .empty-card,
  .result-title,
  .result-footer {
    background: #fff;
    backdrop-filter: none;
  }

  .week-heads,
  .week-counts {
    background: #f2f2f7;
    backdrop-filter: none;
  }

  .week-scroll.edge-top,
  .week-scroll.edge-bottom,
  .week-scroll.edge-top.edge-bottom {
    mask-image: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .week-scroll {
    scroll-behavior: auto;
  }
}
</style>
