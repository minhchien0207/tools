import { expect, test } from "vitest";
import { useDateCalculator } from "./useDateCalculator";

function setupRange() {
  const calc = useDateCalculator();
  calc.calcType.value = "1";
  calc.startDate.value = new Date(2026, 0, 1);
  calc.endDate.value = new Date(2026, 0, 5);
  calc.excludedDays.value = [];
  calc.excludedDates.value = [];
  return calc;
}

test("calculate snapshots excludedDates onto result", () => {
  const { excludedDates, result, calculate } = setupRange();
  excludedDates.value = ["02/01/2026"];

  expect(calculate()).toBe(true);
  expect(result.value?.excludedDates).toEqual(["02/01/2026"]);
});

test("mutating excludedDates after calculate does not change result snapshot", () => {
  const { excludedDates, result, totalCount, calculate } = setupRange();

  expect(calculate()).toBe(true);
  expect(result.value?.excludedDates).toEqual([]);
  const countAfterCalc = totalCount.value;

  excludedDates.value = ["01/01/2026", "02/01/2026"];

  expect(result.value?.excludedDates).toEqual([]);
  expect(totalCount.value).toBe(countAfterCalc);
});

test("next calculate refreshes excludedDates snapshot", () => {
  const { excludedDates, result, calculate } = setupRange();
  expect(calculate()).toBe(true);

  excludedDates.value = ["01/01/2026"];
  expect(calculate()).toBe(true);
  expect(result.value?.excludedDates).toEqual(["01/01/2026"]);
});
