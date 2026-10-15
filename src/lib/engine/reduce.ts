import type { ArcanaValue } from "./types";

export function sumDigits(n: number): number {
  return Math.abs(Math.trunc(n))
    .toString()
    .split("")
    .reduce((acc, d) => acc + Number(d), 0);
}

/**
 * Reduce any positive integer to the 22-arcana system.
 * 1–22 stay as-is. Values > 22 are digit-summed until ≤ 22.
 */
export function reduceToArcana(input: number): ArcanaValue {
  const steps: string[] = [];
  let value = Math.trunc(input);
  if (value < 0) value = Math.abs(value);

  steps.push(`start ${value}`);

  while (value > 22) {
    const next = sumDigits(value);
    steps.push(`${value} > 22 → ${String(value).split("").join("+")} = ${next}`);
    value = next;
  }

  if (value === 0) {
    steps.push("0 is not an arcana; keeping 0 as a sentinel");
  } else {
    steps.push(`${value} is in 1–22 → keep`);
  }

  return { value, raw: input, steps };
}

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}
