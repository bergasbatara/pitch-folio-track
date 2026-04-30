import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDateId(value: string | Date, opts?: { withTime?: boolean }) {
  const withTime = opts?.withTime ?? false;

  const date =
    typeof value === 'string'
      ? parseDateFromApi(value)
      : value instanceof Date
        ? value
        : new Date(value as any);

  if (Number.isNaN(date.getTime())) return '-';

  return format(date, withTime ? 'd MMM yyyy HH:mm' : 'd MMM yyyy', { locale: id });
}

export function parseApiDateToLocalDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return parseDateFromApi(value);
}

function parseDateFromApi(value: string): Date {
  // If the API returns either `YYYY-MM-DD` or an ISO string, we always
  // interpret the calendar date in local time to avoid off-by-one due to UTC.
  const datePart = value.split('T')[0];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    return new Date(year, month, day, 12, 0, 0);
  }
  return new Date(value);
}

export function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
