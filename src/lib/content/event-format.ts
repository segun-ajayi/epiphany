import type { PublicEvent } from "./public.types";

const DEFAULT_TIMEZONE = "America/Chicago";

function eventDate(event: PublicEvent) {
  return new Date(event.startsAt);
}

export function formatEventDate(
  event: PublicEvent,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  },
) {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: event.timezone || DEFAULT_TIMEZONE,
  }).format(eventDate(event));
}

export function formatEventTime(event: PublicEvent) {
  const timezone = event.timezone || DEFAULT_TIMEZONE;
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
  const start = formatter.format(eventDate(event));

  if (!event.endsAt) return start;

  const end = formatter.format(new Date(event.endsAt));
  return `${start} – ${end}`;
}

export function getEventDateKey(event: PublicEvent) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: event.timezone || DEFAULT_TIMEZONE,
  }).formatToParts(eventDate(event));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getCalendarDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
