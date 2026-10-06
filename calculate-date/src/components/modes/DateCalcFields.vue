<script setup lang="ts">
import SegmentControl from "@/components/shared/SegmentControl.vue";
import DateField from "@/components/shared/DateField.vue";

const methodTypeOptions = [
  { value: "1", label: "Đủ số ngày chọn" },
  { value: "2", label: "Đúng thời gian thực tế" },
];

defineProps<{
  calcType: string;
  startDate: Date | null;
  endDate: Date | null;
  totalDays: number | null;
  methodType: string;
}>();

const emit = defineEmits<{
  "update:startDate": [value: any];
  "update:endDate": [value: any];
  "update:totalDays": [value: number | null];
  "update:methodType": [value: string];
}>();
</script>

<template>
  <div class="contents">
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
  </div>
</template>
