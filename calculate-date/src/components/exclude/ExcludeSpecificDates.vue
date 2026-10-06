<script setup lang="ts">
import { nextTick, ref } from "vue";
import { format } from "date-fns";
import DatePicker from "primevue/datepicker";
import { vMaska } from "maska/vue";

const props = defineProps<{
  excludedDates: string[];
  startDate: Date | null;
}>();

const emit = defineEmits<{
  "update:excludedDates": [value: string[]];
  remove: [key: string];
}>();

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
</script>

<template>
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
        v-maska="'##/##/####'"
        :modelValue="pickDate"
        dateFormat="dd/mm/yy"
        showIcon
        placeholder="dd/mm/yyyy"
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
          @click="emit('remove', key)"
        >
          <span class="tabular-nums">{{ key }}</span>
          <span class="text-[0.95rem] leading-none opacity-70" aria-hidden="true"
            >×</span
          >
        </button>
      </div>
    </div>
  </div>
</template>
