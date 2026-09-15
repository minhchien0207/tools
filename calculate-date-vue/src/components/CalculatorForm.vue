<script setup lang="ts">
import { nextTick, ref } from "vue";
import { format } from "date-fns";
import DatePicker from "primevue/datepicker";
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

const emit = defineEmits<{
  "update:calcType": [value: string];
  "update:startDate": [value: any];
  "update:endDate": [value: any];
  "update:totalDays": [value: number | null];
  "update:methodType": [value: string];
  "update:excludedDays": [value: number[]];
  "update:excludedDates": [value: string[]];
  calculate: [];
}>();

const shortDay = (label: string) =>
  label === "Chủ nhật" ? "CN" : label.replace("Thứ ", "T");

const toggleExcluded = (value: number) => {
  const next = props.excludedDays.includes(value)
    ? props.excludedDays.filter((d) => d !== value)
    : [...props.excludedDays, value];
  emit("update:excludedDays", next);
};

const pickDate = ref<Date | null>(null);
const excludePickerKey = ref(0);
const excludePickerRef = ref<{
  currentMonth: number;
  currentYear: number;
} | null>(null);

/** Last month the user opened/navigated/selected in the exclude picker. */
const lastExcludeView = ref<{ month: number; year: number } | null>(null);

const rememberExcludeView = (month: number, year: number) => {
  lastExcludeView.value = { month, year };
};

const applyExcludePickerMonth = () => {
  const picker = excludePickerRef.value;
  if (!picker) return;

  // Prefer last user choice; first open falls back to startDate month.
  const view = lastExcludeView.value;
  if (view) {
    picker.currentMonth = view.month;
    picker.currentYear = view.year;
    return;
  }

  const anchor = props.startDate;
  if (anchor) {
    picker.currentMonth = anchor.getMonth();
    picker.currentYear = anchor.getFullYear();
  }
};

// PrimeVue can emit an empty value (`undefined`) and nullable entries for
// range/multiple selection modes, even though this picker uses single mode.
const addExcludedDate = (
  value: Date | Date[] | (Date | null)[] | null | undefined,
) => {
  const date = Array.isArray(value) ? value[0] : value;
  // Ignore null emits from remount/clear.
  if (!date) return;

  rememberExcludeView(date.getMonth(), date.getFullYear());
  const key = format(date, "dd/MM/yyyy");
  if (!props.excludedDates.includes(key)) {
    emit("update:excludedDates", [...props.excludedDates, key]);
  }

  // Remount picker so PrimeVue cannot leave the selected date in the input.
  pickDate.value = null;
  excludePickerKey.value += 1;
};

const syncExcludePickerMonth = async () => {
  // PrimeVue may reset month from viewDate during open — re-apply after that.
  await nextTick();
  applyExcludePickerMonth();
  setTimeout(applyExcludePickerMonth, 0);
};

/** PrimeVue month-change uses 1-based month. */
const onExcludeMonthChange = (event: { month: number; year: number }) => {
  rememberExcludeView(event.month - 1, event.year);
};

const removeExcludedDate = (key: string) => {
  emit(
    "update:excludedDates",
    props.excludedDates.filter((d) => d !== key),
  );
};

const segmentItem =
  "flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-2 text-center text-[0.8125rem] font-medium tracking-[-0.01em] text-[#1d1d1f] transition-[background-color,box-shadow,transform] duration-100 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
const segmentOn = "bg-white font-semibold shadow-sm";
</script>

<template>
  <div
    class="relative h-fit overflow-hidden rounded-[1.125rem] border border-[#d2d2d7]/70 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_18px_rgba(0,0,0,0.04)] backdrop-blur-[20px] backdrop-saturate-150"
  >
    <div
      class="flex flex-col gap-3.5 px-4 pt-4 pb-3.5 sm:gap-4 sm:px-5 sm:pt-4.5 sm:pb-4"
    >
      <!-- Kiểu tính -->
      <div class="min-w-0">
        <div
          class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        >
          Kiểu tính
        </div>
        <div
          class="grid grid-cols-2 gap-0.5 rounded-[0.625rem] bg-[#e8e8ed] p-0.5"
          role="radiogroup"
          aria-label="Kiểu tính"
        >
          <label
            :class="[segmentItem, calcType === '1' ? segmentOn : '']"
          >
            <input
              class="sr-only"
              type="radio"
              name="calcType"
              value="1"
              :checked="calcType === '1'"
              @change="emit('update:calcType', '1')"
            />
            Khoảng ngày
          </label>
          <label
            :class="[segmentItem, calcType === '2' ? segmentOn : '']"
          >
            <input
              class="sr-only"
              type="radio"
              name="calcType"
              value="2"
              :checked="calcType === '2'"
              @change="emit('update:calcType', '2')"
            />
            Cộng dồn
          </label>
        </div>
      </div>

      <!-- Ngày -->
      <div class="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <div class="min-w-0">
          <div
            class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
          >
            Ngày bắt đầu
          </div>
          <DatePicker
            :modelValue="startDate"
            @update:modelValue="emit('update:startDate', $event)"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Chọn ngày"
            fluid
          />
        </div>

        <div v-if="calcType === '1'" class="animate-fade-in min-w-0">
          <div
            class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
          >
            Ngày kết thúc
          </div>
          <DatePicker
            :modelValue="endDate"
            @update:modelValue="emit('update:endDate', $event)"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Chọn ngày"
            fluid
          />
        </div>

        <div v-else class="animate-fade-in min-w-0">
          <div
            class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
          >
            Tổng số ngày
          </div>
          <input
            type="number"
            :value="totalDays"
            @input="
              emit(
                'update:totalDays',
                ($event.target as HTMLInputElement).valueAsNumber,
              )
            "
            class="w-full rounded-[0.625rem] border border-[#d2d2d7] bg-white/90 px-3 py-[0.55rem] text-[0.9375rem] text-[#1d1d1f] outline-none transition-[border-color,box-shadow] duration-100 ease-out focus:border-[#0071e3] focus:shadow-[0_0_0_3px_rgba(0,113,227,0.18)]"
            placeholder="Nhập số ngày"
          />
        </div>
      </div>

      <!-- Cách tính (type 2) -->
      <div v-if="calcType === '2'" class="animate-fade-in min-w-0">
        <div
          class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        >
          Cách tính
        </div>
        <div
          class="grid grid-cols-1 gap-0.5 rounded-[0.625rem] bg-[#e8e8ed] p-0.5 min-[360px]:grid-cols-2"
          role="radiogroup"
          aria-label="Cách tính"
        >
          <label
            :class="[segmentItem, methodType === '1' ? segmentOn : '']"
          >
            <input
              class="sr-only"
              type="radio"
              name="methodType"
              value="1"
              :checked="methodType === '1'"
              @change="emit('update:methodType', '1')"
            />
            Đủ số ngày chọn
          </label>
          <label
            :class="[segmentItem, methodType === '2' ? segmentOn : '']"
          >
            <input
              class="sr-only"
              type="radio"
              name="methodType"
              value="2"
              :checked="methodType === '2'"
              @change="emit('update:methodType', '2')"
            />
            Đúng thời gian thực tế
          </label>
        </div>
      </div>

      <!-- Loại trừ thứ -->
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
              excludedDays.includes(day.value)
                ? 'border-[#0071e3]/35 bg-[#0071e3]/10 text-[#0071e3]'
                : 'border-[#d2d2d7] bg-white/85 text-[#1d1d1f]'
            "
            :aria-pressed="excludedDays.includes(day.value)"
            @click="toggleExcluded(day.value)"
          >
            {{ shortDay(day.label) }}
          </button>
        </div>
      </div>

      <!-- Loại trừ ngày cụ thể -->
      <div class="min-w-0">
        <div
          class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        >
          Loại trừ ngày cụ thể
        </div>
        <div class="flex flex-col gap-2">
          <DatePicker
            :key="excludePickerKey"
            ref="excludePickerRef"
            :modelValue="pickDate"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Thêm ngày"
            fluid
            @update:modelValue="addExcludedDate"
            @show="syncExcludePickerMonth"
            @month-change="onExcludeMonthChange"
          />
          <div v-if="excludedDates.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="key in excludedDates"
              :key="key"
              type="button"
              class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#0071e3]/30 bg-[#0071e3]/10 py-[0.3rem] pr-[0.55rem] pl-[0.65rem] text-xs font-medium tracking-[-0.01em] text-[#0071e3] transition-[background-color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              :title="`Bỏ loại trừ ${key}`"
              @click="removeExcludedDate(key)"
            >
              <span class="tabular-nums">{{ key }}</span>
              <span class="text-[0.95rem] leading-none opacity-70" aria-hidden="true"
                >×</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="border-t border-black/5 bg-[#f5f5f7]/65 px-4 pt-3 pb-4 backdrop-blur-md sm:px-5 sm:pt-3.5 sm:pb-4.5"
    >
      <button
        type="button"
        class="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#0071e3] px-4.5 py-3 text-[0.9375rem] font-semibold tracking-[-0.015em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-[background-color,transform] duration-100 ease-out hover:bg-[#0077ed] active:scale-[0.98] active:bg-[#006edb] motion-reduce:transition-none motion-reduce:active:scale-100"
        @click="emit('calculate')"
      >
        Tính kết quả
      </button>
    </div>
  </div>
</template>
