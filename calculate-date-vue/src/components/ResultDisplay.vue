<script setup lang="ts">
import type { ResultData } from "@/composables/useDateCalculator";
import { daysOfWeek } from "@/composables/useDateCalculator";

defineProps<{
  result: ResultData | null;
  maxRow: number;
  totalCount: number;
}>();
</script>

<template>
  <div class="lg:col-span-7">
    <div
      v-if="result"
      class="animate-scale-in flex h-full flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-md"
    >
      <div
        class="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5"
      >
        <h2 class="flex items-center gap-2 text-xl font-bold text-gray-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Bảng Kết Quả
        </h2>
      </div>

      <div class="grow overflow-x-auto p-4">
        <table class="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th
                v-for="day in daysOfWeek"
                :key="day.value"
                class="w-1/7 border-b-2 border-gray-100 px-2 pt-2 pb-4 text-center text-sm font-semibold tracking-wider text-gray-500 uppercase"
              >
                {{ day.label }}
              </th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <!-- Rows -->
            <tr
              v-for="i in maxRow"
              :key="i"
              class="group transition-colors hover:bg-indigo-50/30"
            >
              <td v-for="day in 7" :key="day" class="h-12 p-2 text-center">
                <div
                  v-if="result.data[day][i - 1]"
                  class="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 font-medium shadow-sm transition-all duration-200"
                  :class="{
                    'border border-emerald-200 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-500/10':
                      result.data[day][i - 1] === result.lastDate,
                    'border border-amber-200 bg-amber-50 text-amber-700 ring-4 ring-amber-500/10':
                      result.data[day][i - 1] === result.startDate,
                    'border border-slate-100 bg-white text-slate-600 shadow-xs group-hover:border-blue-200':
                      result.data[day][i - 1] !== result.lastDate &&
                      result.data[day][i - 1] !== result.startDate,
                  }"
                >
                  {{ result.data[day][i - 1] }}
                </div>
              </td>
            </tr>

            <!-- Empty state for no results -->
            <tr v-if="maxRow === 0">
              <td colspan="7" class="py-12 text-center text-gray-400">
                Không có ngày nào phù hợp
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals Footer -->
      <div class="mt-auto">
        <div class="grid grid-cols-7 border-t border-gray-100 bg-gray-50/50 px-4">
          <div v-for="day in 7" :key="day" class="p-3 text-center">
            <div class="mb-1 text-xs text-gray-400">Cột {{ day }}</div>
            <div class="text-lg font-bold text-gray-700">
              {{ result.data[day].length }}
            </div>
          </div>
        </div>

        <!-- Final Total -->
        <div
          class="flex items-center justify-between bg-linear-to-r from-indigo-500 to-blue-600 px-8 py-6 text-white"
        >
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-white/20 p-2">
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
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span class="text-lg font-medium text-blue-50">Tổng số ngày hợp lệ</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-extrabold tracking-tight">{{ totalCount }}</span>
            <span class="font-medium text-blue-200">ngày</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Placeholder when no result -->
    <div
      v-else
      class="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white/40 p-12 text-center"
    >
      <div
        class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10 text-blue-300"
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
      <h3 class="text-lg font-semibold text-gray-700">Chưa có dữ liệu</h3>
      <p class="mt-2 max-w-sm text-gray-500">
        Vui lòng điền thông tin vào biểu mẫu bên trái và nhấn "Tính Kết Quả" để xem bảng
        dữ liệu chi tiết.
      </p>
    </div>
  </div>
</template>
