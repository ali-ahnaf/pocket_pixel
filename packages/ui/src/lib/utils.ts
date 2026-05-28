export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function normalizeDateInput(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) return toDateInputValue(value);
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toDateInputValue(parsed);
  }
  return '';
}

export function normalizeTimeInput(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const timeMatch = value.match(/^([01]\d|2[0-3]):([0-5]\d)/);
    if (timeMatch) return `${timeMatch[1]}:${timeMatch[2]}`;

    const dateTimeMatch = value.match(/[T\s]([01]\d|2[0-3]):([0-5]\d)/);
    if (dateTimeMatch) return `${dateTimeMatch[1]}:${dateTimeMatch[2]}`;

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toTimeInputValue(parsed);
  }
  if (value instanceof Date) return toTimeInputValue(value);
  return '';
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const match = timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (!match) return '';

  const [, hours, minutes] = match;
  const formatted = new Date(2000, 0, 1, Number(hours), Number(minutes));
  return formatted.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTransactionDateTime(dateStr: string, timeStr?: string | null): string {
  const formattedDate = formatDate(dateStr);
  const formattedTime = formatTime(timeStr);
  return formattedTime ? `${formattedDate} at ${formattedTime}` : formattedDate;
}

export function compareTransactionsByMomentDesc<T extends { date: string; time?: string | null; createdAt?: string | null }>(a: T, b: T): number {
  const dateDiff = b.date.localeCompare(a.date);
  if (dateDiff !== 0) return dateDiff;

  if (a.time && b.time) {
    const timeDiff = b.time.localeCompare(a.time);
    if (timeDiff !== 0) return timeDiff;
  } else if (a.time) {
    return -1;
  } else if (b.time) {
    return 1;
  }

  if (a.createdAt && b.createdAt) {
    const createdAtDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (createdAtDiff !== 0) return createdAtDiff;
  } else if (a.createdAt) {
    return -1;
  } else if (b.createdAt) {
    return 1;
  }

  return 0;
}
