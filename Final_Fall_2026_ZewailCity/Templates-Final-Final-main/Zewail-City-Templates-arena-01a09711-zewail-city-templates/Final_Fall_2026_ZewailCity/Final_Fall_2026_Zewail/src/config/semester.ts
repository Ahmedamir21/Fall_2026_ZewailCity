/**
 * Change this file when preparing a new semester.
 *
 * Course/section/instructor data lives in src/data/.
 * Product logic should never hard-code a semester name.
 */
export const SEMESTER_CONFIG = {
  institution: 'Zewail City',
  plannerName: 'Schedule Builder',
  term: 'Fall',
  year: 2026,
  session: 'Main Session',
  version: '2.1',
  dataLastVerified: '2026-09-24',
  publicHostLabel: 'fall-2026-zewail-city.vercel.app',
} as const;

export const TERM_LABEL = `${SEMESTER_CONFIG.term} ${SEMESTER_CONFIG.year}`;
export const TERM_SESSION_LABEL = `${TERM_LABEL} · ${SEMESTER_CONFIG.session}`;
export const PRODUCT_TITLE = `${SEMESTER_CONFIG.institution} — ${TERM_LABEL} ${SEMESTER_CONFIG.plannerName}`;
export const SHARE_TITLE = `My ${TERM_LABEL} schedule`;
export const SHARE_TEXT = `Check out my ${SEMESTER_CONFIG.institution} ${TERM_LABEL} schedule.`;
