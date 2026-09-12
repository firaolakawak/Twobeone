// Settings saves a calendar date. Treat it as local midnight; timestamps retain
// their explicit timezone so the displayed date and elapsed counter agree.
export function parseRelationshipStart(
  start: string | Date | null | undefined,
) {
  if (!start) return null;
  const dateOnly =
    typeof start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start);
  const date =
    start instanceof Date
      ? new Date(start.getTime())
      : new Date(dateOnly ? `${start}T00:00:00` : start);
  if (!Number.isFinite(date.getTime())) return null;
  if (dateOnly) {
    const [year, month, day] = (start as string).split("-").map(Number);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    )
      return null;
  }
  return date;
}

export function getElapsedRelationshipTime(
  start: string | Date | undefined,
  now = Date.now(),
) {
  const date = parseRelationshipStart(start);
  if (!date) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const diffMs = Math.max(0, now - date.getTime());
  return {
    days: Math.floor(diffMs / 86_400_000),
    hours: Math.floor((diffMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((diffMs % 3_600_000) / 60_000),
    seconds: Math.floor((diffMs % 60_000) / 1_000),
  };
}

function calendarDayNumber(date: Date): number {
  // Compare calendar days independently of local 23-hour or 25-hour DST days.
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return calendarDate.getTime() / 86_400_000;
}

export function getNextRelationshipAnniversary(
  start: string | Date | undefined,
  now = Date.now(),
): { date: Date; daysUntil: number; isToday: boolean } | null {
  const startDate = parseRelationshipStart(start);
  const today = new Date(now);
  if (
    !startDate ||
    !Number.isFinite(today.getTime()) ||
    startDate.getTime() > now
  ) {
    return null;
  }

  const anniversaryInYear = (year: number): Date => {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const day =
      startDate.getMonth() === 1 && startDate.getDate() === 29 && !leapYear
        ? 28
        : startDate.getDate();
    const anniversary = new Date(0);
    anniversary.setFullYear(year, startDate.getMonth(), day);
    anniversary.setHours(0, 0, 0, 0);
    return anniversary;
  };

  let anniversaryYear = Math.max(
    today.getFullYear(),
    startDate.getFullYear() + 1,
  );
  let date = anniversaryInYear(anniversaryYear);
  const todayNumber = calendarDayNumber(today);
  if (calendarDayNumber(date) < todayNumber) {
    date = anniversaryInYear(++anniversaryYear);
  }

  const daysUntil = calendarDayNumber(date) - todayNumber;
  return { date, daysUntil, isToday: daysUntil === 0 };
}
