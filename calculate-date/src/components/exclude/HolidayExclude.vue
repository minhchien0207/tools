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
    <div class="flex min-h-11 items-center justify-between gap-3">
      <label
        class="text-xs font-semibold tracking-[-0.01em] text-tertiary"
        for="exclude-holidays"
      >
        Loại trừ ngày lễ
      </label>
      <span class="relative inline-flex h-[31px] w-[51px] shrink-0 has-[:disabled]:opacity-40">
        <input
          id="exclude-holidays"
          type="checkbox"
          class="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          :checked="excludeHolidays"
          :disabled="!canUseHolidays"
          @change="
            onToggleMaster(($event.target as HTMLInputElement).checked)
          "
        />
        <span
          class="pointer-events-none h-[31px] w-[51px] rounded-full bg-[#e9e9eb] transition-colors duration-200 ease-out peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 motion-reduce:transition-none"
        />
        <span
          class="pointer-events-none absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out peer-checked:translate-x-[20px] motion-reduce:transition-none"
        />
      </span>
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
        class="grid grid-cols-4 gap-1.5"
        role="group"
        aria-label="Quốc gia ngày lễ"
      >
        <button
          v-for="country in HOLIDAY_COUNTRIES"
          :key="country.code"
          type="button"
          class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-1 py-[0.4rem] text-xs font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          :class="
            selectedCountries.includes(country.code)
              ? 'border-accent/35 bg-accent/10 text-accent'
              : 'border-separator bg-white/85 text-[#1d1d1f]'
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
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-separator bg-white/85 text-tertiary'
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
