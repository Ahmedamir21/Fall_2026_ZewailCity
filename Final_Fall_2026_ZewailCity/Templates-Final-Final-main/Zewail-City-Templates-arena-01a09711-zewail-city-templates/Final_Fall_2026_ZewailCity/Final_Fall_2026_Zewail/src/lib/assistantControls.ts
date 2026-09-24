import type { MeetingType, Pairing } from '../types';
import type { Pick, PickState } from './picks';
import { uid } from './picks';

export type LockedComponents = Record<string, Partial<Record<MeetingType, boolean>>>;

export interface PlannerLocks {
  courseIds: string[];
  components: LockedComponents;
}

export function isCourseLocked(locks: PlannerLocks, courseId: string): boolean {
  return locks.courseIds.includes(courseId);
}

export function isComponentLocked(
  locks: PlannerLocks,
  courseId: string,
  kind: MeetingType,
): boolean {
  return isCourseLocked(locks, courseId) || locks.components[courseId]?.[kind] === true;
}

/**
 * Returns only the currently-picked components that automation must preserve.
 * A course lock preserves every currently chosen component and prevents add/remove.
 * A component lock preserves that one current section. Empty components are not
 * fabricated into constraints — Best Schedule may still fill them.
 */
export function lockedPickForCourse(
  picks: PickState,
  locks: PlannerLocks,
  courseId: string,
): Partial<Pick> {
  const pick = picks[courseId];
  if (!pick) return {};
  const out: Partial<Pick> = {};
  (['Lecture', 'Lab', 'Tutorial'] as MeetingType[]).forEach((kind) => {
    if (isComponentLocked(locks, courseId, kind) && pick[kind]) out[kind] = pick[kind];
  });
  return out;
}

export function pairingMatchesLockedPick(pairing: Pairing, locked: Partial<Pick>): boolean {
  const actual: Partial<Record<MeetingType, string | null>> = {
    Lecture: pairing.lecture ? uid(pairing.lecture) : null,
    Lab: pairing.labs[0] ? uid(pairing.labs[0]) : null,
    Tutorial: pairing.tutorials[0] ? uid(pairing.tutorials[0]) : null,
  };

  return (['Lecture', 'Lab', 'Tutorial'] as MeetingType[]).every((kind) => {
    const expected = locked[kind];
    return expected == null || actual[kind] === expected;
  });
}

export function normalizeLocks(locks: PlannerLocks, picks: PickState): PlannerLocks {
  const courseIds = locks.courseIds.filter((id) => Boolean(picks[id]));
  const components: LockedComponents = {};
  Object.entries(locks.components).forEach(([courseId, byKind]) => {
    if (!picks[courseId]) return;
    const clean: Partial<Record<MeetingType, boolean>> = {};
    (['Lecture', 'Lab', 'Tutorial'] as MeetingType[]).forEach((kind) => {
      if (byKind?.[kind]) clean[kind] = true;
    });
    if (Object.keys(clean).length) components[courseId] = clean;
  });
  return { courseIds, components };
}

export function loadPlannerLocks(): PlannerLocks {
  if (typeof window === 'undefined') return { courseIds: [], components: {} };
  try {
    const raw = window.localStorage.getItem('zc-planner-locks-v1');
    if (!raw) return { courseIds: [], components: {} };
    const parsed = JSON.parse(raw);
    return {
      courseIds: Array.isArray(parsed?.courseIds)
        ? parsed.courseIds.filter((x: unknown): x is string => typeof x === 'string')
        : [],
      components: parsed?.components && typeof parsed.components === 'object'
        ? parsed.components
        : {},
    };
  } catch {
    return { courseIds: [], components: {} };
  }
}

export function savePlannerLocks(locks: PlannerLocks): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('zc-planner-locks-v1', JSON.stringify(locks));
  } catch {
    // Local persistence is best-effort; planner behavior still works in-memory.
  }
}
