<script setup lang="ts">
import {
  HOLIDAY_COUNTRIES,
  type CountryCode,
  type HolidayChip,
  colorForCountry,
} from "@/lib/holidays";

defineProps<{
  excludeHolidays: boolean;
  selectedCountries: CountryCode[];
  selectedHolidayKeys: string[];
  holidayChips: HolidayChip[];
  canUseHolidays: boolean;
  onToggleMaster: (checked: boolean) => void;
  toggleCountry: (code: CountryCode) => void;
  toggleHolidayChip: (key: string) => void;
}>();
</script>

<template>
  <div class="min-w-0">
    <div class="flex items-center justify-between gap-3">
      <label
        class="text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
        for="exclude-holidays"
      >
        Loại trừ ngày lễ
      </label>
      <input
        id="exclude-holidays"
        type="checkbox"
        class="size-4 accent-[#0071e3] disabled:opacity-40"
        :checked="excludeHolidays"
        :disabled="!canUseHolidays"
        @change="
          onToggleMaster(($event.target as HTMLInputElement).checked)
        "
      />
    </div>
    <p
      v-if="!canUseHolidays"
      class="mt-1 text-xs tracking-[-0.01em] text-[#86868b]"
    >
      Chọn ngày bắt đầu trước
    </p>
    <div
      v-else-if="excludeHolidays"
      class="animate-fade-in mt-2 motion-reduce:animate-none"
    >
      <div
        class="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Quốc gia ngày lễ"
      >
        <button
          v-for="country in HOLIDAY_COUNTRIES"
          :key="country.code"
          type="button"
          class="inline-flex min-w-10 cursor-pointer items-center gap-1.5 rounded-full border px-[0.65rem] py-[0.4rem] text-xs font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          :class="
            selectedCountries.includes(country.code)
              ? 'border-[#0071e3]/35 bg-[#0071e3]/10 text-[#0071e3]'
              : 'border-[#d2d2d7] bg-white/85 text-[#1d1d1f]'
          "
          :aria-pressed="selectedCountries.includes(country.code)"
          :aria-label="country.label"
          :title="country.label"
          @click="toggleCountry(country.code)"
        >
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :style="{ backgroundColor: colorForCountry(country.code) }"
            aria-hidden="true"
          />
          {{ country.short }}
        </button>
      </div>
      <p
        v-if="!selectedCountries.length"
        class="mt-2 text-xs tracking-[-0.01em] text-[#86868b]"
      >
        Chọn quốc gia
      </p>
      <template v-else>
        <p
          v-if="!holidayChips.length"
          class="mt-2 text-xs tracking-[-0.01em] text-[#86868b]"
        >
          Không có ngày lễ trong khoảng này
        </p>
        <div v-else class="relative mt-2 max-h-40 overflow-y-auto">
          <div class="flex flex-wrap gap-1.5 pb-1">
            <button
              v-for="chip in holidayChips"
              :key="chip.key"
              type="button"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border py-[0.3rem] px-[0.65rem] text-xs font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              :class="
                selectedHolidayKeys.includes(chip.key)
                  ? 'border-[#0071e3]/30 bg-[#0071e3]/10 text-[#0071e3]'
                  : 'border-[#d2d2d7] bg-white/85 text-[#86868b]'
              "
              :aria-pressed="selectedHolidayKeys.includes(chip.key)"
              :title="chip.label"
              @click="toggleHolidayChip(chip.key)"
            >
              <span
                class="inline-flex shrink-0 items-center gap-0.5"
                aria-hidden="true"
              >
                <span
                  v-for="code in chip.countries"
                  :key="code"
                  class="h-1.5 w-1.5 rounded-full"
                  :style="{ backgroundColor: colorForCountry(code) }"
                />
              </span>
              <span class="tabular-nums">{{ chip.label }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
