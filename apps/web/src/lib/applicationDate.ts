const isDateOnlyValue = (value: string, date: Date): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ||
  date.toISOString() === `${value.slice(0, 10)}T00:00:00.000Z`;

const localDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateValue = (): string => localDateValue(new Date());

export const getApplicationDateValue = (value: string): string => {
  const date = new Date(value);
  return isDateOnlyValue(value, date) ? value.slice(0, 10) : localDateValue(date);
};

export const formatApplicationDate = (
  value: string,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions,
): string => {
  const [year, month, day] = getApplicationDateValue(value).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locales, options);
};
