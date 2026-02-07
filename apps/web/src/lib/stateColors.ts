/**
 * Shared application state colors, labels, and helpers.
 * Used by Sankey, Swimlane, and other analytics pages.
 */

export const STATE_COLORS: Record<string, string> = {
  START: '#6b7280',
  INTERESTED: '#3b82f6',
  APPLIED: '#eab308',
  SCREENING: '#a855f7',
  INTERVIEW: '#22c55e',
  INTERVIEW_2: '#16a34a',
  INTERVIEW_3: '#15803d',
  OFFER: '#10b981',
  ACCEPTED: '#14b8a6',
  DECLINED: '#f97316',
  REJECTED: '#ef4444',
  GHOSTED: '#9ca3af',
  TRASH: '#374151',
};

export const STATE_LABELS: Record<string, string> = {
  INTERESTED: 'Interested',
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  INTERVIEW_2: 'Interview 2',
  INTERVIEW_3: 'Interview 3',
  OFFER: 'Offer',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  REJECTED: 'Rejected',
  GHOSTED: 'Ghosted',
  TRASH: 'Trash',
};

export const TERMINAL_STATES = [
  'ACCEPTED',
  'DECLINED',
  'REJECTED',
  'GHOSTED',
] as const;

export function isTerminalState(state: string): boolean {
  return (TERMINAL_STATES as readonly string[]).includes(state);
}

/** Marker info for terminal states on the swimlane timeline */
export const TERMINAL_MARKERS: Record<
  string,
  { symbol: string; label: string }
> = {
  REJECTED: { symbol: '✗', label: 'Rejected' },
  GHOSTED: { symbol: '👻', label: 'Ghosted' },
  DECLINED: { symbol: '✗', label: 'Declined' },
  ACCEPTED: { symbol: '✓', label: 'Accepted' },
};
