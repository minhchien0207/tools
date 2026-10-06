import { expect, test } from "vitest";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { useAgeCalculator } from "./useAgeCalculator";

test("same calendar day → zeros", () => {
  const { birthDate, asOfMode, asOfDate, result, asOfInvalid } =
    useAgeCalculator();
  const day = new Date(2020, 0, 15);
  birthDate.value = day;
  asOfMode.value = "date";
  asOfDate.value = day;

  expect(result.value).toEqual({
    years: 0,
    months: 0,
    days: 0,
    totalDays: 0,
    birthKey: "15/01/2020",
    asOfKey: "15/01/2020",
  });
  expect(asOfInvalid.value).toBe(false);
});

test("simple Y/M/D breakdown", () => {
  const { birthDate, asOfMode, asOfDate, result } = useAgeCalculator();
  const birth = new Date(2000, 0, 10);
  const asOf = new Date(2028, 2, 15);
  birthDate.value = birth;
  asOfMode.value = "date";
  asOfDate.value = asOf;

  expect(result.value).toEqual({
    years: 28,
    months: 2,
    days: 5,
    totalDays: differenceInCalendarDays(startOfDay(asOf), startOfDay(birth)),
    birthKey: "10/01/2000",
    asOfKey: "15/03/2028",
  });
});

test("asOf before birth → null result and asOfInvalid", () => {
  const { birthDate, asOfMode, asOfDate, result, asOfInvalid } =
    useAgeCalculator();
  birthDate.value = new Date(2000, 5, 15);
  asOfMode.value = "date";
  asOfDate.value = new Date(1999, 0, 1);

  expect(result.value).toBeNull();
  expect(asOfInvalid.value).toBe(true);
});

test("today mode uses startOfDay(new Date())", () => {
  const { birthDate, asOfMode, result, asOfInvalid } = useAgeCalculator();
  const today = startOfDay(new Date());
  birthDate.value = today;
  asOfMode.value = "today";

  expect(result.value).toEqual({
    years: 0,
    months: 0,
    days: 0,
    totalDays: 0,
    birthKey: expect.any(String),
    asOfKey: expect.any(String),
  });
  expect(result.value?.birthKey).toBe(result.value?.asOfKey);
  expect(asOfInvalid.value).toBe(false);
});

test("incomplete birth → null", () => {
  const { birthDate, asOfMode, asOfDate, result, asOfInvalid } =
    useAgeCalculator();
  birthDate.value = null;
  asOfMode.value = "date";
  asOfDate.value = new Date(2020, 0, 1);

  expect(result.value).toBeNull();
  expect(asOfInvalid.value).toBe(false);
});

test("leap-day birth to non-leap asOf does not throw and returns finite numbers", () => {
  const { birthDate, asOfMode, asOfDate, result } = useAgeCalculator();
  birthDate.value = new Date(2000, 1, 29);
  asOfMode.value = "date";
  asOfDate.value = new Date(2025, 2, 1);

  expect(() => result.value).not.toThrow();
  expect(result.value).not.toBeNull();
  const r = result.value!;
  expect(Number.isFinite(r.years)).toBe(true);
  expect(Number.isFinite(r.months)).toBe(true);
  expect(Number.isFinite(r.days)).toBe(true);
  expect(Number.isFinite(r.totalDays)).toBe(true);
  expect(r.totalDays).toBe(
    differenceInCalendarDays(
      startOfDay(new Date(2025, 2, 1)),
      startOfDay(new Date(2000, 1, 29)),
    ),
  );
});
