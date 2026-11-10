<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  isBefore,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { ResultData } from "@/composables/useDateCalculator";
import { daysOfWeek } from "@/composables/useDateCalculator";
import { holidayInfoByKey } from "@/lib/holidays";

type CalCell = {
  key: string;
  label: string;
  inResult: boolean;
  excluded: boolean;
  holidayLabel: string | null;
  /** One accent color per country that marks this date as a holiday. */
  holidayColors: string[];
};

/** Union of all bundled country holidays — independent of form selection. */
const holidayByKey = holidayInfoByKey();

/** `null` = empty pad (other month / leading-trailing gap). */
type CalWeek = {
  id: string;
  cells: (CalCell | null)[];
};

type CalMonth = {
  id: string;
  label: string;
  weeks: CalWeek[];
};

const props = defineProps<{
  result: ResultData | null;
  maxRow: number;
  totalCount: number;
}>();

const emit = defineEmits<{
  exclude: [date: string];
  restore: [date: string];
}>();

const shortLabel = (label: string) =>
  label === "Chủ nhật" ? "CN" : label.replace("Thứ ", "T");

const parseKey = (key: string) => parse(key, "dd/MM/yyyy", new Date());

const dateSet = computed(() => {
  const set = new Set<string>();
  if (!props.result) return set;
  for (const list of Object.values(props.result.data)) {
    for (const d of list) set.add(d);
  }
  return set;
});

const excludedSet = computed(
  () => new Set(props.result?.excludedDates ?? []),
);

/**
 * One grid per month (normal calendar): leading/trailing cells empty.
 * No adjacent-month bleed — month boundary = blank pads + gap.
 */
const calendarMonths = computed(() => {
  if (!props.result?.lastDate) return [] as CalMonth[];

  const rangeStart = parseKey(props.result.startDate);
  const rangeEnd = parseKey(props.result.lastDate);
  const months: CalMonth[] = [];
  let cursor = startOfMonth(rangeStart);
  const lastMonth = startOfMonth(rangeEnd);

  while (!isBefore(lastMonth, cursor)) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridFrom = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridTo = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridFrom, end: gridTo });
    const weeks: CalWeek[] = [];

    for (let i = 0; i < days.length; i += 7) {
      const slice = days.slice(i, i + 7);
      const cells = slice.map((d) => {
        if (!isSameMonth(d, monthStart)) return null;
        const key = format(d, "dd/MM/yyyy");
        const info = holidayByKey.get(key);
        const raw = info?.label ?? null;
        // Chip labels are `${key} · names · codes`; strip key for title/aria.
        const holidayLabel =
          raw?.startsWith(`${key} · `) ? raw.slice(key.length + 3) : raw;
        return {
          key,
          label: String(getDate(d)),
          inResult: dateSet.value.has(key),
          excluded: excludedSet.value.has(key),
          holidayLabel,
          holidayColors: info?.colors ?? [],
        };
      });
      if (cells.some(Boolean)) {
        weeks.push({
          id: `${format(monthStart, "yyyy-MM")}-${cells.find(Boolean)!.key}`,
          cells,
        });
      }
    }

    months.push({
      id: format(monthStart, "yyyy-MM"),
      label: format(monthStart, "'Tháng' M/yyyy"),
      weeks,
    });
    cursor = addMonths(cursor, 1);
  }

  return months;
});

const PAGE = 2;

const scroller = ref<HTMLElement | null>(null);
const visibleMonths = ref(PAGE);
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

const onChipClick = (cell: CalCell) => {
  if (cell.excluded) emit("restore", cell.key);
  else if (cell.inResult) emit("exclude", cell.key);
};

const cellActionLabel = (cell: CalCell) => {
  const action = cell.excluded
    ? `Khôi phục ${cell.key}`
    : `Loại trừ ${cell.key}`;
  return cell.holidayLabel ? `${action} — ${cell.holidayLabel}` : action;
};

const { isLoading, reset } = useInfiniteScroll(
  scroller,
  () => {
    visibleMonths.value = Math.min(
      visibleMonths.value + PAGE,
      calendarMonths.value.length,
    );
    nextTick(updateEdges);
  },
  {
    distance: 80,
    interval: 100,
    canLoadMore: () =>
      !!props.result && visibleMonths.value < calendarMonths.value.length,
  },
);

// Reset infinite-scroll window only when the calculation range identity changes
// (new start date). Exclude/restore rebuilds `result` + `excludedDates` but must
// keep the user's place in the month list.
watch(
  () => props.result?.startDate ?? null,
  async () => {
    visibleMonths.value = PAGE;
    reset();
    await nextTick();
    updateEdges();
  },
);

watch(
  () => calendarMonths.value.length,
  async (len) => {
    if (visibleMonths.value > len) {
      visibleMonths.value = Math.max(len, 0);
    }
    await nextTick();
    updateEdges();
  },
);

const cellBase =
  "relative flex min-h-[2.15rem] w-full items-center justify-center rounded-lg px-0.5 py-[0.3rem] text-[clamp(0.625rem,2.2vw,0.8125rem)] font-medium tracking-[-0.02em] whitespace-nowrap tabular-nums";
</script>

<template>
  <div v-if="result" class="result-card">
    <div
      class="animate-scale-in flex max-h-[min(70dvh,52rem)] flex-col overflow-hidden rounded-[1.25rem] border border-white/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_28px_rgba(0,0,0,0.06)]"
    >
      <div
        class="flex shrink-0 items-center border-b border-black/8 bg-white px-4 py-3 sm:px-5"
      >
        <h2 class="text-[1.0625rem] font-semibold tracking-[-0.02em] text-label">
          Kết quả
        </h2>
      </div>

      <div v-if="calendarMonths.length === 0" class="px-4 py-12 text-center text-secondary">
        Không có ngày nào phù hợp
      </div>

      <template v-else>
        <div
          class="grid w-full shrink-0 grid-cols-7 border-b border-black/8 bg-canvas"
          aria-hidden="true"
        >
          <div
            v-for="day in daysOfWeek"
            :key="day.value"
            class="px-0.5 py-2.5 text-center text-[0.6875rem] font-semibold tracking-[0.02em] text-secondary"
          >
            {{ shortLabel(day.label) }}
          </div>
        </div>

        <div
          ref="scroller"
          class="week-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain motion-reduce:scroll-auto"
          :class="{ 'edge-top': edgeTop, 'edge-bottom': edgeBottom }"
          @scroll.passive="updateEdges"
        >
          <div class="flex flex-col gap-4 px-1 py-2 pb-3">
            <section
              v-for="month in calendarMonths.slice(0, visibleMonths)"
              :key="month.id"
              class="flex flex-col gap-1"
            >
              <div
                class="mx-1 px-2 py-1 text-xs font-semibold tracking-[-0.01em] text-secondary"
              >
                {{ month.label }}
              </div>
              <div
                v-for="week in month.weeks"
                :key="week.id"
                class="grid w-full grid-cols-7 gap-1 px-0.5"
              >
                <template
                  v-for="(cell, ci) in week.cells"
                  :key="cell?.key ?? `${week.id}-${ci}`"
                >
                  <button
                    v-if="cell && (cell.inResult || cell.excluded)"
                    type="button"
                    :class="[
                      cellBase,
                      'group cursor-pointer border transition duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
                      cell.excluded
                        ? 'border-red-500/55 bg-red-500/10 text-[#d70015] line-through hover:border-green-500/55 hover:bg-green-500/15 hover:text-[#248a3d] hover:no-underline'
                        : cell.inResult && cell.key === result.startDate
                          ? 'border-orange-500/45 bg-orange-500/15 font-semibold text-[#c93400] hover:border-red-500/35 hover:bg-red-500/10 hover:text-[#d70015]'
                          : cell.inResult && cell.key === result.lastDate
                            ? 'border-green-500/50 bg-green-500/15 font-semibold text-[#248a3d] hover:border-red-500/35 hover:bg-red-500/10 hover:text-[#d70015]'
                            : 'border-black/10 bg-white/95 text-[#3a3a3c] hover:border-red-500/35 hover:bg-red-500/10 hover:text-[#d70015]',
                    ]"
                    :title="cellActionLabel(cell)"
                    :aria-label="cellActionLabel(cell)"
                    @click="onChipClick(cell)"
                  >
                    <span
                      v-if="cell.holidayColors.length"
                      class="pointer-events-none absolute top-0.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5"
                      aria-hidden="true"
                    >
                      <span
                        v-for="(color, di) in cell.holidayColors"
                        :key="di"
                        class="h-1 w-1 shrink-0 rounded-full"
                        :style="{ backgroundColor: color }"
                      />
                    </span>
                    <span>{{ cell.label }}</span>
                    <span
                      v-if="cell.excluded"
                      class="cal-hint pointer-events-none absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[0.6875rem] leading-none font-bold text-white opacity-0 shadow-sm transition-opacity motion-reduce:transition-none"
                      aria-hidden="true"
                      >+</span
                    >
                    <span
                      v-else
                      class="cal-hint pointer-events-none absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[0.6875rem] leading-none font-bold text-white opacity-0 shadow-sm transition-opacity motion-reduce:transition-none"
                      aria-hidden="true"
                      >×</span
                    >
                  </button>
                  <div
                    v-else-if="cell"
                    :class="[
                      cellBase,
                      'border border-transparent text-black/30',
                      cell.holidayLabel ? '' : 'pointer-events-none',
                    ]"
                    :title="
                      cell.holidayLabel
                        ? `${cell.key} — ${cell.holidayLabel}`
                        : undefined
                    "
                    aria-hidden="true"
                  >
                    <span
                      v-if="cell.holidayColors.length"
                      class="pointer-events-none absolute top-0.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5"
                      aria-hidden="true"
                    >
                      <span
                        v-for="(color, di) in cell.holidayColors"
                        :key="di"
                        class="h-1 w-1 shrink-0 rounded-full"
                        :style="{ backgroundColor: color }"
                      />
                    </span>
                    {{ cell.label }}
                  </div>
                  <div
                    v-else
                    :class="[cellBase, 'pointer-events-none border border-transparent']"
                    aria-hidden="true"
                  />
                </template>
              </div>
            </section>
          </div>
          <div
            v-if="visibleMonths < calendarMonths.length"
            class="px-3 pt-2 pb-3 text-center text-xs text-secondary tabular-nums"
            aria-live="polite"
          >
            {{
              isLoading
                ? "Đang tải…"
                : `Đã hiện ${visibleMonths}/${calendarMonths.length} tháng`
            }}
          </div>
        </div>

        <div class="shrink-0 bg-white shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
          <div class="grid w-full grid-cols-7 border-t border-black/8 bg-canvas">
            <div
              v-for="day in daysOfWeek"
              :key="day.value"
              class="flex flex-col items-center gap-0.5 border-r border-black/8 px-0.5 py-2 last:border-r-0"
            >
              <span class="text-[0.625rem] font-semibold tracking-[0.02em] text-secondary">{{
                shortLabel(day.label)
              }}</span>
              <span class="text-[0.8125rem] font-semibold text-label tabular-nums">{{
                result.data[day.value].length
              }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between bg-accent px-5 py-3.5 text-white">
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
  </div>
</template>

<style scoped>
@media (hover: hover) and (pointer: fine) {
  .group:hover .cal-hint {
    opacity: 1;
  }
}

/* Scroll-edge fade — mask combos are awkward as pure utilities. */
.week-scroll {
  -webkit-overflow-scrolling: touch;
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

@media (prefers-reduced-transparency: reduce) {
  .week-scroll.edge-top,
  .week-scroll.edge-bottom,
  .week-scroll.edge-top.edge-bottom {
    mask-image: none;
  }
}
</style>
