<script setup lang="ts">
import { useHolidayExclude } from "@/composables/useHolidayExclude";
import SegmentControl from "@/components/shared/SegmentControl.vue";
import DateField from "@/components/shared/DateField.vue";
import HolidayExclude from "@/components/exclude/HolidayExclude.vue";
import ExcludeWeekdays from "@/components/exclude/ExcludeWeekdays.vue";
import ExcludeSpecificDates from "@/components/exclude/ExcludeSpecificDates.vue";

const calcTypeOptions = [
  { value: "1", label: "Khoảng ngày" },
  { value: "2", label: "Cộng dồn" },
];

const methodTypeOptions = [
  { value: "1", label: "Đủ số ngày chọn" },
  { value: "2", label: "Đúng thời gian thực tế" },
];

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

const {
  excludeHolidays,
  selectedCountries,
  selectedHolidayKeys,
  holidayChips,
  canUseHolidays,
  onToggleMaster,
  toggleCountry,
  toggleHolidayChip,
  removeExcludedDate,
} = useHolidayExclude(props, emit);
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
        <SegmentControl
          :modelValue="calcType"
          :options="calcTypeOptions"
          ariaLabel="Kiểu tính"
          @update:modelValue="emit('update:calcType', $event)"
        />
      </div>

      <!-- Ngày -->
      <div class="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <DateField
          label="Ngày bắt đầu"
          :modelValue="startDate"
          placeholder="Chọn ngày"
          @update:modelValue="emit('update:startDate', $event)"
        />

        <DateField
          v-if="calcType === '1'"
          class="animate-fade-in"
          label="Ngày kết thúc"
          :modelValue="endDate"
          placeholder="Chọn ngày"
          @update:modelValue="emit('update:endDate', $event)"
        />

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
        <SegmentControl
          :modelValue="methodType"
          :options="methodTypeOptions"
          ariaLabel="Cách tính"
          @update:modelValue="emit('update:methodType', $event)"
        />
      </div>

      <ExcludeWeekdays
        :modelValue="excludedDays"
        @update:modelValue="emit('update:excludedDays', $event)"
      />

      <HolidayExclude
        :excludeHolidays="excludeHolidays"
        :selectedCountries="selectedCountries"
        :selectedHolidayKeys="selectedHolidayKeys"
        :holidayChips="holidayChips"
        :canUseHolidays="canUseHolidays"
        :onToggleMaster="onToggleMaster"
        :toggleCountry="toggleCountry"
        :toggleHolidayChip="toggleHolidayChip"
      />

      <ExcludeSpecificDates
        :excludedDates="excludedDates"
        :startDate="startDate"
        @update:excludedDates="emit('update:excludedDates', $event)"
        @remove="removeExcludedDate"
      />
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
