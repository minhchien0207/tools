<script setup lang="ts">
import DatePicker from "primevue/datepicker";
import { daysOfWeek } from "@/composables/useDateCalculator";

const props = defineProps<{
  calcType: string;
  startDate: Date | null;
  endDate: Date | null;
  totalDays: number | null;
  methodType: string;
  excludedDays: number[];
}>();

const emit = defineEmits<{
  (e: "update:calcType", value: string): void;
  (e: "update:startDate", value: Date | null): void;
  (e: "update:endDate", value: Date | null): void;
  (e: "update:totalDays", value: number | null): void;
  (e: "update:methodType", value: string): void;
  (e: "update:excludedDays", value: number[]): void;
  (e: "calculate"): void;
}>();
</script>

<template>
  <div
    class="relative h-fit overflow-hidden rounded-3xl border border-white bg-white/70 shadow-xl backdrop-blur-md lg:col-span-5"
  >
    <div
      class="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-blue-400 to-indigo-400"
    ></div>
    <div class="space-y-6 p-6 sm:p-8">
      <!-- Kiểu Tính -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700">Kiểu tính</label>
        <div class="flex flex-col gap-3">
          <label
            class="group inline-flex cursor-pointer items-center rounded-xl border p-3 transition-colors hover:bg-blue-50"
            :class="
              calcType === '1' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
            "
          >
            <input
              type="radio"
              :value="'1'"
              :checked="calcType === '1'"
              @change="emit('update:calcType', '1')"
              class="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span
              class="ml-3 font-medium text-gray-700 transition-colors group-hover:text-blue-700"
              >Tính theo khoảng ngày</span
            >
          </label>
          <label
            class="group inline-flex cursor-pointer items-center rounded-xl border p-3 transition-colors hover:bg-blue-50"
            :class="
              calcType === '2' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
            "
          >
            <input
              type="radio"
              :value="'2'"
              :checked="calcType === '2'"
              @change="emit('update:calcType', '2')"
              class="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span
              class="ml-3 font-medium text-gray-700 transition-colors group-hover:text-blue-700"
              >Cộng dồn số ngày</span
            >
          </label>
        </div>
      </div>

      <!-- Ngày bắt đầu -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">Ngày bắt đầu</label>
        <DatePicker
          :modelValue="startDate"
          @update:modelValue="emit('update:startDate', $event)"
          dateFormat="dd/mm/yy"
          showIcon
          placeholder="Chọn ngày"
          fluid
        />
      </div>

      <!-- Ngày kết thúc (Nếu kiểu tính 1) -->
      <div v-if="calcType === '1'" class="animate-fade-in space-y-2">
        <label class="block text-sm font-semibold text-gray-700">Ngày kết thúc</label>
        <DatePicker
          :modelValue="endDate"
          @update:modelValue="emit('update:endDate', $event)"
          dateFormat="dd/mm/yy"
          showIcon
          placeholder="Chọn ngày"
          fluid
        />
      </div>

      <!-- Tổng số ngày (Nếu kiểu tính 2) -->
      <div v-if="calcType === '2'" class="animate-fade-in space-y-2">
        <label class="block text-sm font-semibold text-gray-700">Tổng số ngày</label>
        <input
          type="number"
          :value="totalDays"
          @input="emit('update:totalDays', ($event.target as HTMLInputElement).valueAsNumber)"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm transition-shadow focus:border-blue-500 focus:ring-blue-500"
          placeholder="Nhập số ngày"
        />
      </div>

      <!-- Cách tính (Nếu kiểu tính 2) -->
      <div v-if="calcType === '2'" class="animate-fade-in space-y-3">
        <label class="block text-sm font-semibold text-gray-700">Cách tính</label>
        <div class="flex flex-col gap-3">
          <label class="inline-flex cursor-pointer items-center">
            <input
              type="radio"
              :value="'1'"
              :checked="methodType === '1'"
              @change="emit('update:methodType', '1')"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700"
              >Đủ số lượng ngày chọn
              <span class="text-xs text-gray-500">(Bỏ qua ngày loại trừ)</span></span
            >
          </label>
          <label class="inline-flex cursor-pointer items-center">
            <input
              type="radio"
              :value="'2'"
              :checked="methodType === '2'"
              @change="emit('update:methodType', '2')"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700">Đúng thời gian thực tế</span>
          </label>
        </div>
      </div>

      <!-- Ngoại trừ -->
      <div class="space-y-3 border-t border-gray-100 pt-2">
        <label class="block text-sm font-semibold text-gray-700"
          >Loại trừ thứ trong tuần</label
        >
        <div class="grid grid-cols-2 gap-3">
          <label
            v-for="day in daysOfWeek"
            :key="day.value"
            class="group inline-flex cursor-pointer items-center"
          >
            <input
              type="checkbox"
              :value="day.value"
              :checked="excludedDays.includes(day.value)"
              @change="
                (e) => {
                  const target = e.target as HTMLInputElement;
                  const newExcludedDays = target.checked
                    ? [...excludedDays, day.value]
                    : excludedDays.filter((d) => d !== day.value);
                  emit('update:excludedDays', newExcludedDays);
                }
              "
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 transition-colors focus:ring-indigo-500"
            />
            <span
              class="ml-2 text-sm text-gray-600 transition-colors group-hover:text-indigo-700"
              >{{ day.label }}</span
            >
          </label>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="border-t border-gray-100 bg-gray-50/80 p-6 backdrop-blur-sm">
      <button
        @click="emit('calculate')"
        class="inline-flex w-full transform items-center justify-center rounded-xl border border-transparent bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
      >
        <svg
          class="mr-2 -ml-1 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        Tính Kết Quả
      </button>
    </div>
  </div>
</template>
