import type { CalendarDate } from "./types";

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeap(year) ? 29 : 28;
  return DAYS[month - 1] ?? 30;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  let { year, month, day } = date;
  day += days;
  while (day > daysInMonth(year, month)) {
    day -= daysInMonth(year, month);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return { year, month, day };
}

export function dateKey(date: CalendarDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function formatDate(date: CalendarDate): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.month - 1]} ${date.day}, ${date.year}`;
}

export function isMonthStart(date: CalendarDate): boolean {
  return date.day === 1;
}

export function isWeekStart(date: CalendarDate): boolean {
  const t = Date.UTC(date.year, date.month - 1, date.day);
  return new Date(t).getUTCDay() === 1;
}

export function isQuarterStart(date: CalendarDate): boolean {
  return date.day === 1 && [1, 4, 7, 10].includes(date.month);
}

export function isYearStart(date: CalendarDate): boolean {
  return date.month === 1 && date.day === 1;
}

export function monthsBetween(a: CalendarDate, b: CalendarDate): number {
  return (b.year - a.year) * 12 + (b.month - a.month);
}
