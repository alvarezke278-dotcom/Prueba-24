/**
 * Utilities for calculating elapsed time, formatting dates and hours
 */

export interface DurationResult {
  hoursDecimal: number;      // e.g. 8.50
  hoursInteger: number;      // e.g. 8
  minutesRemainder: number;  // e.g. 30
  formatted: string;         // e.g. "8h 30m"
  rawMilliseconds: number;
  isValid: boolean;
  error?: string;
}

/**
 * Calculates duration between two ISO or datetime-local strings
 */
export function calculateDuration(startStr: string, endStr: string): DurationResult {
  if (!startStr || !endStr) {
    return {
      hoursDecimal: 0,
      hoursInteger: 0,
      minutesRemainder: 0,
      formatted: '0h 0m',
      rawMilliseconds: 0,
      isValid: false,
    };
  }

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      hoursDecimal: 0,
      hoursInteger: 0,
      minutesRemainder: 0,
      formatted: '0h 0m',
      rawMilliseconds: 0,
      isValid: false,
      error: 'Formato de fecha inválido',
    };
  }

  const diffMs = endDate.getTime() - startDate.getTime();

  if (diffMs < 0) {
    return {
      hoursDecimal: 0,
      hoursInteger: 0,
      minutesRemainder: 0,
      formatted: '0h 0m',
      rawMilliseconds: diffMs,
      isValid: false,
      error: 'La fecha final debe ser posterior a la fecha de inicio',
    };
  }

  // Calculate hours and minutes
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hoursInteger = Math.floor(totalMinutes / 60);
  const minutesRemainder = totalMinutes % 60;
  
  // Hours as decimal, rounded to 2 decimal places
  const hoursDecimal = Number((totalMinutes / 60).toFixed(2));

  const formatted = `${hoursInteger}h ${minutesRemainder}m`;

  return {
    hoursDecimal,
    hoursInteger,
    minutesRemainder,
    formatted,
    rawMilliseconds: diffMs,
    isValid: true,
  };
}

/**
 * Format decimal hours to readable format (e.g. 8.5 -> "8h 30m")
 */
export function formatDecimalHours(decimalHours: number): string {
  if (!decimalHours || isNaN(decimalHours) || decimalHours <= 0) return '0h 0m';
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Format a datetime string to human friendly Spanish format
 * e.g. "31 Oct 2026, 08:30 AM"
 */
export function formatDateTimeDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format a simple date string to "DD/MM/YYYY"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Helper to get current datetime formatted for input[type="datetime-local"]
 * YYYY-MM-DDTHH:mm
 */
export function toDateTimeLocalString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get today date formatted as YYYY-MM-DD
 */
export function toDateInputString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}
