<script setup lang="ts">
import { onMounted, ref } from "vue";
import SegmentControl from "@/components/shared/SegmentControl.vue";
import DateField from "@/components/shared/DateField.vue";
import AgeResult from "@/components/results/AgeResult.vue";
import type { AgeResultData } from "@/composables/useAgeCalculator";

const asOfModeOptions = [
  { value: "today", label: "Hôm nay" },
  { value: "date", label: "Chọn ngày" },
];

defineProps<{
  birthDate: Date | null;
  asOfMode: "today" | "date";
  asOfDate: Date | null;
  result: AgeResultData | null;
  asOfInvalid: boolean;
}>();

const emit = defineEmits<{
  "update:birthDate": [value: Date | null];
  "update:asOfMode": [value: "today" | "date"];
  "update:asOfDate": [value: Date | null];
}>();

const birthFieldRef = ref<{ focus: () => void } | null>(null);

onMounted(() => {
  birthFieldRef.value?.focus();
});
</script>

<template>
  <div class="flex flex-col gap-3.5 sm:gap-4">
    <DateField
      ref="birthFieldRef"
      label="Ngày sinh"
      :modelValue="birthDate"
      placeholder="Chọn ngày"
      @update:modelValue="emit('update:birthDate', $event)"
    />

    <div class="min-w-0">
      <div
        class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
      >
        Tính đến
      </div>
      <SegmentControl
        :modelValue="asOfMode"
        :options="asOfModeOptions"
        ariaLabel="Tính đến"
        @update:modelValue="
          emit('update:asOfMode', $event as 'today' | 'date')
        "
      />
    </div>

    <DateField
      v-if="asOfMode === 'date'"
      class="animate-fade-in"
      label="Ngày tính"
      :modelValue="asOfDate"
      placeholder="Chọn ngày"
      @update:modelValue="emit('update:asOfDate', $event)"
    />

    <p
      v-if="asOfInvalid"
      class="animate-fade-in text-sm font-medium tracking-[-0.01em] text-[#d70015]"
      role="status"
    >
      Ngày tính phải từ ngày sinh trở đi
    </p>

    <AgeResult
      v-if="result"
      :result="result"
      :asOfIsToday="asOfMode === 'today'"
    />
  </div>
</template>
