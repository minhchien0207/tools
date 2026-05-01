import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import { addDays, isBefore, format, getDay, startOfDay } from "date-fns";

export interface ResultData {
  data: Record<number, string[]>;
  lastDate: string | null;
  startDate: string;
}

export interface DayOfWeek {
  label: string;
  value: number;
}

export const daysOfWeek: DayOfWeek[] = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
  { label: "Chủ nhật", value: 7 },
];

export function useDateCalculator() {
  const calcType = useStorage<string>("calcType", "1"); // 1: Ngày, 2: Số ngày
  const startDate = ref<Date | null>(null);
  const endDate = ref<Date | null>(null);
  const totalDays = ref<number | null>(null);
  const methodType = useStorage<string>("methodType", "1"); // 1: Đủ số lượng ngày đã chọn, 2: Đúng thời gian
  const excludedDays = useStorage<number[]>("excludedDays", []); // 1 to 7

  const result = ref<ResultData | null>(null);
  const maxRow = ref<number>(0);
  const totalCount = ref<number>(0);

  const calculate = () => {
    if (!startDate.value) {
      alert("Vui lòng nhập ngày bắt đầu!!!");
      return;
    }

    const sDate = startOfDay(startDate.value);
    const formattedSDate = format(sDate, "dd/MM/yyyy");
    const arrResult: Record<number, string[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    };
    let countDate = 0;
    let lastDate: string | null = null;

    const getIsoWeekday = (date: Date) => {
      const day = getDay(date);
      return day === 0 ? 7 : day;
    };

    if (calcType.value === "1") {
      if (!endDate.value) {
        alert("Vui lòng nhập ngày kết thúc!!!");
        return;
      }
      const eDate = startOfDay(endDate.value);

      if (isBefore(eDate, sDate)) {
        alert("Ngày kết thúc phải lớn hơn ngày bắt đầu!!!");
        return;
      }

      let currentDate = sDate;
      while (!isBefore(eDate, currentDate)) {
        const isoWeekday = getIsoWeekday(currentDate);

        if (!excludedDays.value.includes(isoWeekday)) {
          arrResult[isoWeekday].push(format(currentDate, "dd/MM/yyyy"));
          countDate++;
        }
        lastDate = format(currentDate, "dd/MM/yyyy");
        currentDate = addDays(currentDate, 1);
      }
    } else {
      if (!totalDays.value) {
        alert("Vui lòng nhập tổng số ngày!!!");
        return;
      }

      if (excludedDays.value.length === 7) {
        alert("Bạn đã ngoại trừ tất cả các ngày trong tuần!");
        return;
      }

      let tempTotal = 0;
      let currentDate = sDate;

      while (tempTotal < (totalDays.value ?? 0)) {
        const isoWeekday = getIsoWeekday(currentDate);
        const isExcluded = excludedDays.value.includes(isoWeekday);

        if (!isExcluded) {
          arrResult[isoWeekday].push(format(currentDate, "dd/MM/yyyy"));
          countDate++;
          if (methodType.value === "1") {
            tempTotal++;
          }
        }

        lastDate = format(currentDate, "dd/MM/yyyy");
        currentDate = addDays(currentDate, 1);
        if (methodType.value === "2") {
          tempTotal++;
        }
      }
    }

    // Calculate maxRow
    let max = 0;
    for (let i = 1; i <= 7; i++) {
      if (arrResult[i].length > max) {
        max = arrResult[i].length;
      }
    }

    maxRow.value = max;
    totalCount.value = countDate;
    result.value = {
      data: arrResult,
      lastDate,
      startDate: formattedSDate,
    };
  };

  return {
    calcType,
    startDate,
    endDate,
    totalDays,
    methodType,
    excludedDays,
    result,
    maxRow,
    totalCount,
    calculate,
  };
}
