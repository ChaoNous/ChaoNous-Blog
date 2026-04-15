const PAGE_DAILY_STATS_TABLE = "page_daily_stats";

function buildAnalyticsDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function buildRecentDayKeys(
  count: number,
  endTimestamp: number = Date.now(),
): string[] {
  const days: string[] = [];
  const endDate = new Date(endTimestamp);
  endDate.setUTCHours(0, 0, 0, 0);

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const current = new Date(endDate);
    current.setUTCDate(endDate.getUTCDate() - offset);
    days.push(buildAnalyticsDayKey(current.getTime()));
  }

  return days;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return String(error || "");
}

export function isMissingPageDailyStatsTableError(error: unknown): boolean {
  return getErrorMessage(error)
    .toLowerCase()
    .includes(`no such table: ${PAGE_DAILY_STATS_TABLE}`);
}
