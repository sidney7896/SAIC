const MS_PER_DAY = 1000 * 60 * 60 * 24;

function formatDateParts(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isoToday() {
  return formatDateParts(new Date());
}

export function daysBetween(fromIso: string, toIso: string) {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);

  return Math.max(0, Math.round((to.getTime() - from.getTime()) / MS_PER_DAY));
}

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return formatDateParts(date);
}

export function parseApproximateDate(input: string | undefined) {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  const monthDayYear = trimmed.match(
    /([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/,
  );

  if (monthDayYear) {
    const [, monthName, dayText, yearText] = monthDayYear;
    const monthIndex = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].findIndex((month) => month === monthName);

    if (monthIndex >= 0) {
      return `${yearText}-${String(monthIndex + 1).padStart(2, "0")}-${String(
        Number(dayText),
      ).padStart(2, "0")}`;
    }
  }

  const direct = Date.parse(trimmed);

  if (!Number.isNaN(direct)) {
    return formatDateParts(new Date(direct));
  }

  return null;
}
