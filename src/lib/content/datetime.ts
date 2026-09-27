const HOUSTON_TIME_ZONE = "America/Chicago";

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function isoToHoustonInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = zonedParts(date, HOUSTON_TIME_ZONE);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function houstonInputToIso(value: string) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Choose a valid publication date and time.");
  const [, year, month, day, hour, minute] = match;
  const expected = `${year}-${month}-${day}T${hour}:${minute}`;
  const wallClock = Date.UTC(+year, +month - 1, +day, +hour, +minute);
  let instant = wallClock;

  // Converge from the requested Houston wall clock to its UTC instant. Two passes
  // cover both standard and daylight-saving offsets without shipping timezone data.
  for (let pass = 0; pass < 3; pass++) {
    const parts = zonedParts(new Date(instant), HOUSTON_TIME_ZONE);
    const observed = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour,
      +parts.minute,
      +parts.second,
    );
    instant += wallClock - observed;
  }

  const result = new Date(instant);
  if (isoToHoustonInput(result.toISOString()) !== expected) {
    throw new Error(
      "That Houston time does not exist because of daylight saving. Choose another time.",
    );
  }
  return result.toISOString();
}
