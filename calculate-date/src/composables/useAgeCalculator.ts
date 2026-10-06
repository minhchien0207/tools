import { computed, ref, type ComputedRef, type Ref } from "vue";
import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  format,
  startOfDay,
} from "date-fns";

export type AgeResultData = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  birthKey: string; // dd/MM/yyyy
  asOfKey: string;
};

export function useAgeCalculator(): {
  birthDate: Ref<Date | null>;
  asOfMode: Ref<"today" | "date">;
  asOfDate: Ref<Date | null>;
  result: ComputedRef<AgeResultData | null>;
  asOfInvalid: ComputedRef<boolean>; // true when both dates set and asOf < birth
} {
  const birthDate = ref<Date | null>(null);
  const asOfMode = ref<"today" | "date">("today");
  const asOfDate = ref<Date | null>(null);

  const asOfEffective = computed(() => {
    if (asOfMode.value === "today") {
      return startOfDay(new Date());
    }
    if (!asOfDate.value) return null;
    return startOfDay(asOfDate.value);
  });

  const asOfInvalid = computed(() => {
    if (!birthDate.value || !asOfEffective.value) return false;
    const birth = startOfDay(birthDate.value);
    return asOfEffective.value < birth;
  });

  const result = computed((): AgeResultData | null => {
    if (!birthDate.value || !asOfEffective.value) return null;

    const birth = startOfDay(birthDate.value);
    const asOf = asOfEffective.value;

    if (asOf < birth) return null;

    const years = differenceInYears(asOf, birth);
    const afterYears = addYears(birth, years);
    const months = differenceInMonths(asOf, afterYears);
    const afterMonths = addMonths(afterYears, months);
    const days = differenceInDays(asOf, afterMonths);
    const totalDays = differenceInCalendarDays(asOf, birth);

    return {
      years,
      months,
      days,
      totalDays,
      birthKey: format(birth, "dd/MM/yyyy"),
      asOfKey: format(asOf, "dd/MM/yyyy"),
    };
  });

  return {
    birthDate,
    asOfMode,
    asOfDate,
    result,
    asOfInvalid,
  };
}
