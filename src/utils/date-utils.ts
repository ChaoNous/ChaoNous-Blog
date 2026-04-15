export function formatDateToYYYYMMDD(date: Date): string {
  return date.toISOString().substring(0, 10);
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateAtTimeZoneMidnight(
  dateString: string,
  timeZoneOffsetHours: number,
): Date | null {
  const [year, month, day] = dateString
    .split("-")
    .map((value) => Number.parseInt(value, 10));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(
    Date.UTC(year, month - 1, day, -timeZoneOffsetHours, 0, 0, 0),
  );
}

function getDayIndexAtTimeZone(
  date: Date,
  timeZoneOffsetHours: number,
): number {
  return Math.floor(
    (date.getTime() + timeZoneOffsetHours * 60 * 60 * 1000) / DAY_IN_MS,
  );
}

export function getRunningDays(
  startDateString: string,
  timeZoneOffsetHours: number,
  referenceDate: Date = new Date(),
): number {
  const startDate = parseDateAtTimeZoneMidnight(
    startDateString,
    timeZoneOffsetHours,
  );

  if (!startDate) {
    return 0;
  }

  return Math.max(
    0,
    getDayIndexAtTimeZone(referenceDate, timeZoneOffsetHours) -
      getDayIndexAtTimeZone(startDate, timeZoneOffsetHours),
  );
}
