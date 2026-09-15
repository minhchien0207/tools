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
</script>

<template>
  <div class="surface-card relative h-fit overflow-hidden">
    <div class="form-body">
      <!-- Kiểu tính: segmented control (1 hàng) -->
      <div class="field">
        <div class="field-label">Kiểu tính</div>
        <div class="segment" role="radiogroup" aria-label="Kiểu tính">
          <label class="segment-item" :class="{ 'is-on': calcType === '1' }">
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
          <label class="segment-item" :class="{ 'is-on': calcType === '2' }">
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

      <!-- Ngày: 2 cột ngang -->
      <div class="date-row">
        <div class="field">
          <div class="field-label">Ngày bắt đầu</div>
          <DatePicker
            :modelValue="startDate"
            @update:modelValue="emit('update:startDate', $event)"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Chọn ngày"
            fluid
          />
        </div>

        <div v-if="calcType === '1'" class="field animate-fade-in">
          <div class="field-label">Ngày kết thúc</div>
          <DatePicker
            :modelValue="endDate"
            @update:modelValue="emit('update:endDate', $event)"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Chọn ngày"
            fluid
          />
        </div>

        <div v-else class="field animate-fade-in">
          <div class="field-label">Tổng số ngày</div>
          <input
            type="number"
            :value="totalDays"
            @input="
              emit(
                'update:totalDays',
                ($event.target as HTMLInputElement).valueAsNumber,
              )
            "
            class="field-input"
            placeholder="Nhập số ngày"
          />
        </div>
      </div>

      <!-- Cách tính (type 2): segmented ngang -->
      <div v-if="calcType === '2'" class="field animate-fade-in">
        <div class="field-label">Cách tính</div>
        <div class="segment segment--wrap" role="radiogroup" aria-label="Cách tính">
          <label class="segment-item" :class="{ 'is-on': methodType === '1' }">
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
          <label class="segment-item" :class="{ 'is-on': methodType === '2' }">
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

      <!-- Loại trừ thứ: 1 hàng pill -->
      <div class="field field--exclude">
        <div class="field-label">Loại trừ thứ</div>
        <div class="day-pills" role="group" aria-label="Loại trừ thứ trong tuần">
          <button
            v-for="day in daysOfWeek"
            :key="day.value"
            type="button"
            class="day-pill"
            :class="{ 'is-on': excludedDays.includes(day.value) }"
            :aria-pressed="excludedDays.includes(day.value)"
            @click="toggleExcluded(day.value)"
          >
            {{ shortDay(day.label) }}
          </button>
        </div>
      </div>

      <!-- Loại trừ ngày cụ thể -->
      <div class="field">
        <div class="field-label">Loại trừ ngày cụ thể</div>
        <div class="exclude-dates">
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
          <div v-if="excludedDates.length" class="date-chips">
            <button
              v-for="key in excludedDates"
              :key="key"
              type="button"
              class="date-chip"
              :title="`Bỏ loại trừ ${key}`"
              @click="removeExcludedDate(key)"
            >
              <span class="tabular-nums">{{ key }}</span>
              <span class="date-chip-x" aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="primary-btn" @click="emit('calculate')">
        Tính kết quả
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Apple-soft palette: #1d1d1f / #86868b / #0071e3 / #e8e8ed / #d2d2d7 */
.surface-card {
  border-radius: 1.125rem;
  border: 1px solid rgba(210, 210, 215, 0.7);
  background: rgba(255, 255, 255, 0.78);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.85) inset,
    0 4px 18px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(20px) saturate(160%);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem 1rem 0.875rem;
}

@media (min-width: 640px) {
  .form-body {
    padding: 1.125rem 1.25rem 1rem;
    gap: 1rem;
  }
}

.field {
  min-width: 0;
}

.field-label {
  margin-bottom: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #86868b;
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 359px) {
  .date-row {
    grid-template-columns: 1fr;
  }
}

.segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
  padding: 0.2rem;
  border-radius: 0.625rem;
  background: #e8e8ed;
}

.segment--wrap {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 359px) {
  .segment--wrap {
    grid-template-columns: 1fr;
  }
}

.segment-item {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  padding: 0.5rem 0.625rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  transition:
    background-color 120ms ease-out,
    box-shadow 120ms ease-out,
    transform 100ms ease-out;
}

.segment-item:active {
  transform: scale(0.98);
}

.segment-item.is-on {
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  font-weight: 600;
  color: #1d1d1f;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.field-input {
  width: 100%;
  border-radius: 0.625rem;
  border: 1px solid #d2d2d7;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.55rem 0.75rem;
  font-size: 0.9375rem;
  color: #1d1d1f;
  outline: none;
  transition:
    border-color 120ms ease-out,
    box-shadow 120ms ease-out;
}

.field-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.18);
}

.field--exclude {
  padding-top: 0.25rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.day-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.day-pill {
  flex: 1 1 calc(14.28% - 0.375rem);
  min-width: 2.5rem;
  border: 1px solid #d2d2d7;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  padding: 0.4rem 0.35rem;
  font-size: 0.75rem;
  font-weight: 560;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  cursor: pointer;
  transition:
    background-color 120ms ease-out,
    border-color 120ms ease-out,
    color 120ms ease-out,
    transform 100ms ease-out;
}

.day-pill:active {
  transform: scale(0.96);
}

.day-pill.is-on {
  border-color: rgba(0, 113, 227, 0.35);
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
}

.exclude-dates {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid rgba(0, 113, 227, 0.28);
  border-radius: 999px;
  background: rgba(0, 113, 227, 0.08);
  padding: 0.3rem 0.55rem 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #0071e3;
  cursor: pointer;
  transition:
    background-color 120ms ease-out,
    transform 100ms ease-out;
}

.date-chip:active {
  transform: scale(0.97);
}

.date-chip-x {
  font-size: 0.95rem;
  line-height: 1;
  opacity: 0.7;
}

.form-actions {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(245, 245, 247, 0.65);
  padding: 0.75rem 1rem 1rem;
  backdrop-filter: blur(12px);
}

@media (min-width: 640px) {
  .form-actions {
    padding: 0.875rem 1.25rem 1.125rem;
  }
}

.primary-btn {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.75rem;
  background: #0071e3;
  padding: 0.75rem 1.125rem;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: #fff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.22) inset;
  transition:
    background-color 120ms ease-out,
    transform 100ms ease-out;
}

.primary-btn:hover {
  background: #0077ed;
}

.primary-btn:active {
  transform: scale(0.98);
  background: #006edb;
}

@media (prefers-reduced-transparency: reduce) {
  .surface-card,
  .form-actions {
    background: #fff;
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .segment-item,
  .day-pill,
  .date-chip,
  .primary-btn {
    transition: none;
  }

  .segment-item:active,
  .day-pill:active,
  .date-chip:active,
  .primary-btn:active {
    transform: none;
  }
}
</style>
