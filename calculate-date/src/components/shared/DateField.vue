<script setup lang="ts">
import { ref } from "vue";
import DatePicker from "primevue/datepicker";
import { vMaska } from "maska/vue";

withDefaults(
  defineProps<{
    label: string;
    modelValue: Date | null;
    placeholder?: string;
    inputId?: string;
    /** When false, calendar opens via the icon only (better for masked typing). */
    showOnFocus?: boolean;
  }>(),
  {
    placeholder: "dd/mm/yyyy",
    showOnFocus: true,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: Date | null];
}>();

const rootRef = ref<HTMLElement | null>(null);

function onUpdate(
  value: Date | Date[] | (Date | null)[] | null | undefined,
) {
  const next = Array.isArray(value) ? value[0] : value;
  emit("update:modelValue", next ?? null);
}

function focus() {
  const input = rootRef.value?.querySelector("input");
  input?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div ref="rootRef" class="min-w-0">
    <label
      v-if="inputId"
      class="mb-1.5 block text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
      :for="inputId"
    >
      {{ label }}
    </label>
    <div
      v-else
      class="mb-1.5 text-xs font-semibold tracking-[-0.01em] text-[#86868b]"
    >
      {{ label }}
    </div>
    <DatePicker
      v-maska="'##/##/####'"
      :modelValue="modelValue"
      :inputId="inputId"
      dateFormat="dd/mm/yy"
      showIcon
      :showOnFocus="showOnFocus"
      :placeholder="placeholder"
      fluid
      @update:modelValue="onUpdate"
    />
  </div>
</template>
