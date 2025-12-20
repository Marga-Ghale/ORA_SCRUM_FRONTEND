// src/utils/dateUtils.ts
// ============================================
// Date Utility Functions
// ============================================

/**
 * Converts a date string (YYYY-MM-DD) to ISO datetime format for backend
 * Backend expects: "2025-12-25T00:00:00Z"
 * Frontend date input gives: "2025-12-25"
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns ISO datetime string or undefined
 */
export function dateToISO(dateString: string | undefined | null): string | undefined {
  if (!dateString) return undefined;

  try {
    // If it's already in ISO format, return it
    if (dateString.includes('T')) {
      return dateString;
    }

    // Convert YYYY-MM-DD to ISO datetime
    const date = new Date(dateString + 'T00:00:00Z');
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Converts ISO datetime to date string (YYYY-MM-DD) for input fields
 *
 * @param isoString - ISO datetime string
 * @returns Date string in YYYY-MM-DD format
 */
export function isoToDate(isoString: string | undefined | null): string {
  if (!isoString) return '';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return '';
    }

    // Return YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Formats a date for display with relative time
 *
 * @param date - Date string or Date object
 * @returns Object with formatted text and color class
 */
export function formatDateDisplay(date?: string | Date | null): {
  text: string;
  color: string;
} | null {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)}d overdue`,
      color: 'text-error-500',
    };
  }
  if (diffDays === 0) {
    return { text: 'Today', color: 'text-warning-500' };
  }
  if (diffDays === 1) {
    return { text: 'Tomorrow', color: 'text-warning-500' };
  }
  if (diffDays <= 7) {
    return { text: `${diffDays}d`, color: 'text-gray-500' };
  }

  return {
    text: d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    color: 'text-gray-500',
  };
}

/**
 * Formats a timestamp for display (e.g., "2 hours ago")
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
