import type { BarberShop } from "../types";

const DAY_CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const DAY_INDEX: Record<string, number> = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};

function parseDaySegment(segment: string): Set<number> {
  const result = new Set<number>();
  const parts = segment.split(",").map((part) => part.trim()).filter(Boolean);

  parts.forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((value) => value.trim());
      const startIndex = DAY_INDEX[start];
      const endIndex = DAY_INDEX[end];
      if (startIndex === undefined || endIndex === undefined) {
        return;
      }

      if (startIndex <= endIndex) {
        for (let day = startIndex; day <= endIndex; day += 1) {
          result.add(day);
        }
      } else {
        for (let day = startIndex; day < DAY_CODES.length; day += 1) {
          result.add(day);
        }
        for (let day = 0; day <= endIndex; day += 1) {
          result.add(day);
        }
      }
      return;
    }

    const dayIndex = DAY_INDEX[part];
    if (dayIndex !== undefined) {
      result.add(dayIndex);
    }
  });

  return result;
}

function parseTimeToMinutes(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

function isNowInsideRange(nowMinutes: number, startMinutes: number, endMinutes: number) {
  if (startMinutes === endMinutes) {
    return true;
  }
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function evaluateSegment(
  segment: string,
  currentDay: number,
  nowMinutes: number
): "open" | "closed" | "no-match" {
  const normalized = segment.trim();
  if (!normalized) {
    return "no-match";
  }

  const firstTimeIndex = normalized.search(/\d{1,2}:\d{2}/);
  const hasOff = /\boff\b/i.test(normalized);

  const dayExpression =
    firstTimeIndex > 0
      ? normalized.slice(0, firstTimeIndex).trim()
      : normalized.split(" ").slice(0, 1).join("").trim();

  const days = parseDaySegment(dayExpression);
  if (days.size > 0 && !days.has(currentDay)) {
    return "no-match";
  }

  if (hasOff && firstTimeIndex < 0) {
    return "closed";
  }

  const ranges = normalized.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/g) ?? [];
  if (ranges.length === 0) {
    return "no-match";
  }

  const isOpen = ranges.some((range) => {
    const [start, end] = range.split("-").map((value) => value.trim());
    const startMinutes = parseTimeToMinutes(start);
    const endMinutes = parseTimeToMinutes(end);
    if (startMinutes === null || endMinutes === null) {
      return false;
    }
    return isNowInsideRange(nowMinutes, startMinutes, endMinutes);
  });

  return isOpen ? "open" : "closed";
}

export function computeOpenStatus(openingHours: string | null): BarberShop["openStatus"] {
  if (!openingHours) {
    return "unknown";
  }

  const normalized = openingHours.trim();
  if (!normalized) {
    return "unknown";
  }

  if (/24\s*\/\s*7/i.test(normalized)) {
    return "open";
  }

  const now = new Date();
  const currentDay = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const segments = normalized
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean);

  let hasMatch = false;
  let hasClosed = false;

  for (const segment of segments) {
    const result = evaluateSegment(segment, currentDay, nowMinutes);
    if (result === "no-match") {
      continue;
    }
    hasMatch = true;
    if (result === "open") {
      return "open";
    }
    if (result === "closed") {
      hasClosed = true;
    }
  }

  if (hasMatch || hasClosed) {
    return "closed";
  }

  return "unknown";
}
