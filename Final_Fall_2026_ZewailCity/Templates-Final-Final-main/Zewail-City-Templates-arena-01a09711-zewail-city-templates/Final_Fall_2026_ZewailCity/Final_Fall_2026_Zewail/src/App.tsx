import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COURSE_BY_ID } from './data/courses';
import {
  allAvailableCourseIds,
  allYearCourseIds,
  COMMON_COURSE_IDS,
  MAJOR_BY_ID,
  yearBadgeOf,
  yearPlanOf,
} from './data/majors';
import {
  buildCoursePairings,
  comboAt,
  findBestCombo,
  generateCombinations,
  measureSchedule,
  type GenerationResult,
} from './lib/scheduler';
import {
  draftMeetings,
  draftOverlaps,
  emptyPick,
  mergeHiddenSummaries,
  optionStates,
  pickIssues,
  summarizeHidden,
  uid,
  type Pick,
  type PickState,
} from './lib/picks';
import type { ComboMetrics, Course, MeetingType, Pairing } from './types';
import { formatRange, formatDuration, to12h } from './lib/time';
import { readScheduleFromLocation, type ShareExtras } from './lib/share';
import { loadPreferences, type SchedulePreferences } from './lib/preferences';
import { effectiveCreditCap, loadAppState, saveAppState, wouldExceedCap, type CreditCap } from './lib/appState';
import { computeFreeTime, WINDOW_END, WINDOW_START } from './lib/freeTime';
import type { GeneratedSchedule } from './lib/bestSchedule';
import { ThemeToggle, useTheme } from './components/ThemeToggle';
import { MajorPicker } from './components/MajorPicker';
import { YearPicker } from './components/YearPicker';
import { CrossYearBrowser } from './components/CrossYearBrowser';
import { CreditLimitNote } from './components/CreditLimitNote';
import { CoursePicker } from './components/CoursePicker';
import { Timetable, type TimetableEvent } from './components/Timetable';
import { StatsBar } from './components/StatsBar';
import { ScheduleDetails, type DetailEntry } from './components/ScheduleDetails';
import { CombinationNav, Filters, type TypeFilter } from './components/Controls';
import { EmptyState } from './components/EmptyState';
import { EngineAudit } from './components/EngineAudit';
import { CreditsDashboard } from './components/CreditsDashboard';
import { ShareSchedule } from './components/ShareSchedule';
import { AboutPage } from './components/AboutPage';
import { BestSchedule } from './components/BestSchedule';

function isAboutHash(): boolean {
  return typeof window !== 'undefined' && (window.location.hash ?? '').replace('#', '') === 'about';
}

/**
 * Keep only picks for courses that actually belong to the chosen major — ANY of its years,
 * since the cross-year browser legitimately adds courses from other years of the same major.
 *
 * Common courses (e.g. SCH) are also allowed because they are available to every major/year.
 */
function trimPicksToMajor(picks: PickState, majorId: string | null): PickState {
  if (!majorId) return {};
  const mj = MAJOR_BY_ID[majorId];
  const allowed = new Set(mj ? allAvailableCourseIds(mj) : []);
  const out: PickState = {};
  Object.entries(picks).forEach(([courseId, pick]) => {
    if (allowed.has(courseId) && COURSE_BY_ID[courseId]) out[courseId] = pick;
  });
  return out;
}

function trimFilterToMajor(
  filter: Record<string, number>,
  majorId: string | null,
): Record<string, number> {
  if (!majorId) return {};
  const mj = MAJOR_BY_ID[majorId];
  const allowed = new Set(mj ? allAvailableCourseIds(mj) : []);
  const out: Record<string, number> = {};
  Object.entries(filter).forEach(([courseId, idx]) => {
    const course = COURSE_BY_ID[courseId];
    if (allowed.has(courseId) && course && idx >= 0 && idx < course.instructors.length) {
      out[courseId] = idx;
    }
  });
  return out;
}

export default function App() {
  const [theme, setTheme] = useTheme();

  // Both sources are read exactly once. URL state always wins over Local Storage, so opening
  // a shared link never gets clobbered by a stale saved schedule.
  const [sharedOnLoad] = useState(() => readScheduleFromLocation());
  const [savedOnLoad] = useState(() => (sharedOnLoad ? null : loadAppState()));

  const urlState = sharedOnLoad;
  const savedState = savedOnLoad;

  const [majorId, setMajorId] = useState<string | null>(() => {
    if (urlState && MAJOR_BY_ID[urlState.majorId]) return urlState.majorId;
    if (savedState?.majorId && MAJOR_BY_ID[savedState.majorId]) return savedState.majorId;
    return null;
  });

  /**
   * Selected year within the major. `null` means "not chosen yet" (the Year Picker step is
   * showing). Old saved state and old (v3) share links carry no year — they gracefully
   * default to the major's first year ('y1') instead of crashing or emptying the list.
   */
  const [yearId, setYearId] = useState<string | null>(() => {
    if (urlState && MAJOR_BY_ID[urlState.majorId]) return urlState.yearId ?? 'y1';
    if (savedState?.majorId && MAJOR_BY_ID[savedState.majorId]) return savedState.yearId ?? 'y1';
    return null;
  });

  /**
   * Credit-cap SETTING: a plain integer (13/18/21) or null when never chosen. The effective
   * cap is always `creditCap ?? 21` and can never exceed 21 in any state of the app.
   * Nothing else is stored — no GPA value, no academic-standing label of any kind.
   */
  const [creditCap, setCreditCap] = useState<CreditCap | null>(() => savedState?.creditCap ?? null);
  const [capNoteDismissed, setCapNoteDismissed] = useState(() => (savedState?.creditCap ?? null) != null);

  /** Inline rejection message + per-card shake state when an addition would exceed the cap. */
  const [capNotice, setCapNotice] = useState<string | null>(null);
  const [capShake, setCapShake] = useState<{ courseId: string; nonce: number } | null>(null);
  const capNoticeTimer = useRef<number | null>(null);

  const [crossYearOpen, setCrossYearOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [picks, setPicks] = useState<PickState>(() => {
    if (urlState && MAJOR_BY_ID[urlState.majorId]) {
      return trimPicksToMajor(urlState.picks, urlState.majorId);
    }

    if (savedState?.picks) {
      return trimPicksToMajor(savedState.picks, savedState.majorId);
    }

    return {};
  });

  const [showMajorPicker, setShowMajorPicker] = useState(false);

  const [requireComplete, setRequireComplete] = useState(
    () => urlState?.requireComplete ?? savedState?.requireComplete ?? true,
  );

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    () => (urlState?.typeFilter as TypeFilter) || (savedState?.typeFilter as TypeFilter) || 'All',
  );

  const [courseFilter, setCourseFilter] = useState<string>(
    () => urlState?.courseFilter ?? savedState?.courseFilter ?? 'all',
  );

  /**
   * Active "instructor filter" per course — a pure VIEW filter driven only by the
   * per-course pills. Picks never fix an instructor: lecture, lab and tutorial are each
   * chosen independently and may belong to different instructors. The filter is stored and
   * shared so a restored link reproduces exactly what the author was looking at.
   */
  const [instructorFilter, setInstructorFilter] = useState<Record<string, number>>(() => {
    if (urlState && MAJOR_BY_ID[urlState.majorId]) {
      return trimFilterToMajor(urlState.instructorFilter, urlState.majorId);
    }

    if (savedState?.instructorFilter) {
      return trimFilterToMajor(savedState.instructorFilter, savedState.majorId);
    }

    return {};
  });

  const [preferences, setPreferences] = useState<SchedulePreferences>(
    // URL preferences > saved app-state preferences > legacy prefs key > defaults (validated in each loader).
    () => urlState?.preferences ?? savedState?.preferences ?? loadPreferences(),
  );

  const [comboIndex, setComboIndex] = useState(0);
  const [best, setBest] = useState<{
    key: string;
    index: number;
    metrics: ComboMetrics;
    complete: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [showAbout, setShowAbout] = useState(isAboutHash);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [mobileScheduleOpen, setMobileScheduleOpen] = useState(false);

  /** Lifted so the Credits Dashboard and the mobile action bar can open the preferences modal. */
  const [prefsOpen, setPrefsOpen] = useState(false);

  /** Always-fresh mirrors so the stable toggleCourse callback can enforce the credit cap. */
  const picksRef = useRef(picks);
  picksRef.current = picks;

  const creditCapRef = useRef(creditCap);
  creditCapRef.current = creditCap;

  useEffect(() => {
    const onHashChange = () => setShowAbout(isAboutHash());

    window.addEventListener('hashchange', onHashChange);

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openAbout = useCallback(() => {
    window.location.hash = 'about';
    setShowAbout(true);
  }, []);

  const closeAbout = useCallback(() => {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setShowAbout(false);
  }, []);

  const major = majorId ? MAJOR_BY_ID[majorId] : null;
  const yearPlan = major && yearId ? yearPlanOf(major, yearId) : null;

  /**
   * Courses shown in the picker:
   * - the selected year's courses
   * - all common courses (e.g. SCH), available to every major/year
   * - courses from other years of the same major only when selected through the cross-year browser
   */
  const courses: Course[] = useMemo(() => {
    if (!major || !yearPlan) return [];

    // Current year's courses + common courses (e.g. SCH) available to every year.
    const baseIds = [...yearPlan.courseIds, ...COMMON_COURSE_IDS];

    const base = baseIds
      .map((id) => COURSE_BY_ID[id])
      .filter((c): c is Course => !!c);

    const inBase = new Set(baseIds);

    // Extra courses from other years are shown only when selected through
    // the cross-year browser.
    const extras = allYearCourseIds(major)
      .filter((id) => !inBase.has(id) && picks[id] && COURSE_BY_ID[id])
      .map((id) => COURSE_BY_ID[id]);

    return [...base, ...extras];
  }, [major, yearPlan, picks]);

  /** "Year X" badge for every course NOT belonging to the currently selected year. */
  const yearBadges = useMemo(() => {
    if (!major || !yearPlan) return {};

    const out: Record<string, string> = {};

    courses.forEach((c) => {
      if (yearPlan.courseIds.includes(c.id)) return;

      const badge = yearBadgeOf(major, c.id);
      if (badge) out[c.id] = badge;
    });

    return out;
  }, [major, yearPlan, courses]);

  const takenCourses = useMemo(
    () => courses.filter((c) => picks[c.id]),
    [courses, picks],
  );

  /** Effective credit cap — the tier setting when chosen, otherwise the 21-credit hard ceiling. */
  const effectiveCap = effectiveCreditCap(creditCap);

  /* ---------------- Local Storage persistence (URL state always wins on load) ---------------- */

  useEffect(() => {
    saveAppState({
      majorId,
      yearId,
      creditCap,
      instructorFilter,
      picks,
      requireComplete,
      typeFilter,
      courseFilter,
      preferences,
    });
  }, [
    majorId,
    yearId,
    creditCap,
    instructorFilter,
    picks,
    requireComplete,
    typeFilter,
    courseFilter,
    preferences,
  ]);

  const draft = useMemo(
    () => draftMeetings(takenCourses, picks),
    [takenCourses, picks],
  );

  const overlapsFound = useMemo(
    () => draftOverlaps(draft),
    [draft],
  );

  const issues = useMemo(
    () => pickIssues(takenCourses, picks, requireComplete),
    [takenCourses, picks, requireComplete],
  );

  const noConflicts = overlapsFound.length === 0;

  /**
   * Engine space: every conflict-free combination across ALL instructor groups.
   * A lecture may pair with any instructor's lab/tutorial — the only pairing rule is
   * the time-overlap check (inside each course AND across the whole selection).
   */
  const generation: GenerationResult | null = useMemo(() => {
    // Courses with no published schedule (noFixedSchedule) are excluded from the search
    // space entirely: they are always trivially satisfied and contribute only credits,
    // never a scheduling constraint (and must not read as "blocked").
    const schedulable = takenCourses.filter((c) => !c.noFixedSchedule);

    if (schedulable.length === 0) return null;

    const entries = schedulable.map((course) => ({
      course,
      pairings: buildCoursePairings(course),
    }));

    return generateCombinations(entries);
  }, [takenCourses]);

  const count = generation?.count ?? 0;

  const storedCount = generation
    ? generation.truncated
      ? Math.floor(generation.flat.length / Math.max(1, generation.courseCount))
      : generation.count
    : 0;

  const safeIndex = storedCount > 0 ? Math.min(comboIndex, storedCount - 1) : 0;

  const genKey = useMemo(
    () => `${majorId ?? ''}|${takenCourses.map((c) => c.id).join(',')}|${requireComplete}`,
    [majorId, takenCourses, requireComplete],
  );

  useEffect(() => {
    setComboIndex(0);
    setBest(null);
  }, [genKey]);

  /** Apply a generated combination back onto the radio selections. */
  const applyCombo = useCallback(
    (index: number) => {
      if (!generation) return;

      const indices = comboAt(generation, index);
      if (!indices) return;

      setPicks((prev) => {
        const next: PickState = { ...prev };

        generation.order.forEach((courseId, i) => {
          const pairing: Pairing | undefined = generation.pairingsByCourse[courseId]?.[indices[i]];
          if (!pairing) return;

          next[courseId] = {
            Lecture: pairing.lecture ? uid(pairing.lecture) : null,
            Lab: pairing.labs[0] ? uid(pairing.labs[0]) : null,
            Tutorial: pairing.tutorials[0] ? uid(pairing.tutorials[0]) : null,
          };
        });

        return next;
      });

      setComboIndex(index);
    },
    [generation],
  );

  const isCurrentComboBest = !!best && best.key === genKey && best.index === safeIndex;

  const engineInSync = useMemo(() => {
    if (!generation || count === 0) return false;

    const indices = comboAt(generation, safeIndex);
    if (!indices) return false;

    return generation.order.every((courseId, i) => {
      const pairing = generation.pairingsByCourse[courseId]?.[indices[i]];
      const pick = picks[courseId];

      if (!pairing || !pick) return false;

      return (
        (pairing.lecture ? uid(pairing.lecture) : null) === pick.Lecture &&
        (pairing.labs[0] ? uid(pairing.labs[0]) : null) === pick.Lab &&
        (pairing.tutorials[0] ? uid(pairing.tutorials[0]) : null) === pick.Tutorial
      );
    });
  }, [generation, count, safeIndex, picks]);

  /* ---------------- actions ---------------- */

  const selectMajor = useCallback((id: string) => {
    setMajorId(id);
    setPicks({});
    setInstructorFilter({});
    setCourseFilter('all');
    setTypeFilter('All');
    setComboIndex(0);
    setBest(null);
    setShowMajorPicker(false);
    setYearId(null);
    setShowYearPicker(false);
    setCreditCap(null);
    setCapNoteDismissed(false);
    setCapNotice(null);
    setCapShake(null);
    setCrossYearOpen(false);
  }, []);

  const selectYear = useCallback((id: string) => {
    setYearId((prev) => {
      if (prev === id) return prev;

      setPicks({});
      setInstructorFilter({});
      setCourseFilter('all');
      setTypeFilter('All');
      setComboIndex(0);
      setBest(null);
      setCreditCap(null);
      setCapNoteDismissed(false);
      setCapNotice(null);
      setCapShake(null);

      return id;
    });

    setShowYearPicker(false);
    setCrossYearOpen(false);
  }, []);

  const chooseCreditCap = useCallback((cap: CreditCap) => {
    setCreditCap(cap);
    setCapNoteDismissed(true);
    setCapNotice(null);
  }, []);

  const dismissCapNote = useCallback(() => {
    setCapNoteDismissed(true);
  }, []);

  const reopenCapNote = useCallback(() => setCapNoteDismissed(false), []);

  const changePick = useCallback((courseId: string, pick: Pick) => {
    setPicks((prev) => ({ ...prev, [courseId]: pick }));
  }, []);

  const toggleCourse = useCallback((courseId: string, taking: boolean) => {
    if (taking) {
      if (wouldExceedCap(picksRef.current, courseId, creditCapRef.current)) {
        const cap = effectiveCreditCap(creditCapRef.current);

        setCapNotice(
          `This would put you over your ${cap}-credit limit. Remove a course first.`,
        );

        setCapShake((prev) => ({
          courseId,
          nonce: (prev?.nonce ?? 0) + 1,
        }));

        if (capNoticeTimer.current != null) {
          window.clearTimeout(capNoticeTimer.current);
        }

        capNoticeTimer.current = window.setTimeout(
          () => setCapNotice(null),
          4000,
        );

        return;
      }
    }

    setPicks((prev) => {
      const next = { ...prev };

      if (taking) next[courseId] = prev[courseId] ?? emptyPick();
      else delete next[courseId];

      return next;
    });

    if (!taking) {
      setInstructorFilter((prev) => {
        if (prev[courseId] == null) return prev;

        const next = { ...prev };
        delete next[courseId];

        return next;
      });
    }
  }, []);

  const clearOne = useCallback((courseId: string) => {
    setPicks((prev) => ({ ...prev, [courseId]: emptyPick() }));
    setInstructorFilter((prev) => {
      if (prev[courseId] == null) return prev;

      const next = { ...prev };
      delete next[courseId];

      return next;
    });
  }, []);

  const setInstructorPinned = useCallback((courseId: string, idx: number | null) => {
    setInstructorFilter((prev) => {
      const next = { ...prev };

      if (idx == null) delete next[courseId];
      else next[courseId] = idx;

      return next;
    });
  }, []);

  const performClearAll = useCallback(() => {
    setPicks({});
    setInstructorFilter({});
    setComboIndex(0);
    setBest(null);
    setTypeFilter('All');
    setCourseFilter('all');
    setConfirmClearOpen(false);
  }, []);

  const requestClearAll = useCallback(() => setConfirmClearOpen(true), []);

  const useGeneratedSchedule = useCallback((schedule: GeneratedSchedule) => {
    setPicks((prev) => {
      const next: PickState = { ...prev };

      schedule.perCourse.forEach(({ course, pairing }) => {
        next[course.id] = {
          Lecture: pairing.lecture ? uid(pairing.lecture) : null,
          Lab: pairing.labs[0] ? uid(pairing.labs[0]) : null,
          Tutorial: pairing.tutorials[0] ? uid(pairing.tutorials[0]) : null,
        };
      });

      return next;
    });

    setInstructorFilter((prev) => {
      const next = { ...prev };

      schedule.perCourse.forEach(({ course, instructorIdx }) => {
        next[course.id] = instructorIdx;
      });

      return next;
    });

    setComboIndex(0);
    setBest(null);
  }, []);

  const autoFill = useCallback(() => {
    if (!generation) return;

    const result = findBestCombo(generation);
    if (!result) return;

    applyCombo(result.index);

    setBest({
      key: genKey,
      index: result.index,
      metrics: result.metrics,
      complete: result.complete,
    });
  }, [generation, applyCombo, genKey]);

  const suggestBest = autoFill;

  const goPrev = useCallback(() => {
    if (storedCount === 0) return;

    applyCombo((safeIndex - 1 + storedCount) % storedCount);
  }, [storedCount, safeIndex, applyCombo]);

  const goNext = useCallback(() => {
    if (storedCount === 0) return;

    applyCombo((safeIndex + 1) % storedCount);
  }, [storedCount, safeIndex, applyCombo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;

      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  /* ---------------- derived view data ---------------- */

  const detailEntries: DetailEntry[] = useMemo(
    () =>
      draft
        .map((d) => ({
          course: d.course,
          instructor: d.option.instructor,
          pairing: {
            meetings: [d.meeting],
            lecture: d.meeting.type === 'Lecture' ? d.meeting : undefined,
            labs: d.meeting.type === 'Lab' ? [d.meeting] : [],
            tutorials: d.meeting.type === 'Tutorial' ? [d.meeting] : [],
            instructors: { [d.meeting.type]: d.option.instructorIdx },
          },
        }))
        .reduce<DetailEntry[]>((acc, entry) => {
          const existing = acc.find((e) => e.course.id === entry.course.id);

          if (existing) {
            existing.pairing.meetings.push(...entry.pairing.meetings);

            if (entry.pairing.lecture) {
              existing.pairing.lecture = entry.pairing.lecture;
            }

            existing.pairing.labs.push(...entry.pairing.labs);
            existing.pairing.tutorials.push(...entry.pairing.tutorials);

            existing.pairing.instructors = {
              ...existing.pairing.instructors,
              ...entry.pairing.instructors,
            };
          } else {
            acc.push({
              course: entry.course,
              instructor: entry.instructor,
              pairing: {
                meetings: [...entry.pairing.meetings],
                lecture: entry.pairing.lecture,
                labs: entry.pairing.meetings.filter((m) => m.type === 'Lab'),
                tutorials: entry.pairing.meetings.filter((m) => m.type === 'Tutorial'),
                instructors: entry.pairing.instructors,
              },
            });
          }

          return acc;
        }, [])
        .concat(
          takenCourses
            .filter((c) => c.noFixedSchedule)
            .map((course) => ({
              course,
              instructor: course.instructors[0],
              pairing: { meetings: [], labs: [], tutorials: [] },
            })),
        ),
    [draft, takenCourses],
  );

  const metrics = useMemo(
    () => measureSchedule(draft.map((d) => d.meeting)),
    [draft],
  );

  const totalCredits = useMemo(
    () => takenCourses.reduce((sum, c) => sum + (c.credits ?? 0), 0),
    [takenCourses],
  );

  const freeTime = useMemo(
    () => computeFreeTime(draft.map((d) => d.meeting)),
    [draft],
  );

  const hiddenSummary = useMemo(
    () =>
      mergeHiddenSummaries(
        takenCourses.flatMap((course) =>
          (['Lecture', 'Lab', 'Tutorial'] as MeetingType[]).map((kind) =>
            summarizeHidden(
              optionStates(course, kind, takenCourses, picks, {
                pinnedInstructorIdx: instructorFilter[course.id] ?? null,
                preferences,
              }),
            ),
          ),
        ),
      ),
    [takenCourses, picks, instructorFilter, preferences],
  );

  const allEvents: TimetableEvent[] = useMemo(
    () => draft.map((d) => ({ meeting: d.meeting, course: d.course })),
    [draft],
  );

  const visibleEvents = useMemo(
    () =>
      allEvents.filter(
        (e) =>
          (typeFilter === 'All' || (e.meeting.type as MeetingType) === typeFilter) &&
          (courseFilter === 'all' || e.course.id === courseFilter),
      ),
    [allEvents, typeFilter, courseFilter],
  );

  const bestLabel = isCurrentComboBest
    ? `${best!.metrics.days} campus day${best!.metrics.days === 1 ? '' : 's'} · ${formatDuration(
        best!.metrics.gapMinutes,
      )} idle · ends ${
        best!.metrics.latest != null ? to12h(best!.metrics.latest) : '—'
      }`
    : null;

  const canExport = draft.length > 0 && noConflicts;
  const ready = takenCourses.length > 0 && noConflicts && issues.length === 0;

  const shareExtras: ShareExtras = useMemo(
    () => ({
      yearId: yearId ?? undefined,
      requireComplete,
      typeFilter,
      courseFilter,
      preferences,
      instructorFilter,
    }),
    [yearId, requireComplete, typeFilter, courseFilter, preferences, instructorFilter],
  );

  const scrollToBestSchedule = useCallback(() => {
    document
      .getElementById('best-schedule-heading')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const copySummary = useCallback(() => {
    const lines: string[] = [
      'My Zewail City schedule — Fall 2026 (Main Session)',
      '--------------------------------',
    ];

    detailEntries.forEach((e) => {
      lines.push(`${e.course.code} — ${e.course.name}  (${e.instructor.name})`);

      e.pairing.meetings.forEach((m) => {
        lines.push(
          `   ${m.type} Sec ${m.sec} · ${m.day} ${formatRange(m.start, m.end)} · ${m.room}`,
        );
      });
    });

    lines.push('--------------------------------');
    lines.push(
      `Sessions: ${metrics.sessions} · Campus days: ${metrics.days} · ${formatDuration(
        metrics.gapMinutes,
      )} idle`,
    );

    const text = lines.join('\n');

    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();

      try {
        document.execCommand('copy');
        done();
      } catch {
        /* ignore */
      }

      document.body.removeChild(ta);
    }
  }, [detailEntries, metrics]);

  /* ---------------- render ---------------- */

  return (
    <div className="min-h-screen pb-14">
      <div className="mx-auto max-w-[1560px] px-3 py-4 sm:px-6 sm:py-6">
        <header className="panel mb-3 flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.09em]"
              style={{ color: 'var(--accent)' }}
            >
              Fall 2026 · Main Session
            </p>

            <h1 className="mt-1 text-[20px] font-extrabold tracking-tight sm:text-[23px]">
              Zewail City Schedule Builder
            </h1>

            <p
              className="mt-1.5 max-w-[72ch] text-[12.5px] leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              Tick the courses you are registering, then choose the lecture and lab/tutorial
              times you prefer — each component may come from a different instructor; every
              published section pairing is fair game. Real time intervals decide conflicts — a
              2:00–2:59 session next to a 3:00–3:59 session is fine, clashing ones are not.
            </p>
          </div>

          <div className="flex flex-none flex-wrap items-center gap-2">
            {major && !showAbout && (
              <span className="pill hidden sm:inline-flex" style={{ color: 'var(--accent)' }}>
                {major.title}
              </span>
            )}

            <button
              type="button"
              className="btn btn-tap"
              onClick={showAbout ? closeAbout : openAbout}
            >
              {showAbout ? '‹ Planner' : 'ℹ️ About'}
            </button>

            <ThemeToggle theme={theme} onChange={setTheme} />
          </div>
        </header>

        {showAbout ? (
          <AboutPage onBack={closeAbout} />
        ) : !major ? (
          <div className="space-y-3">
            <EmptyState
              icon="🎓"
              title="Choose a major to begin planning your semester."
              message="Your major decides which courses appear below. Information Technology and Data Science & AI share CSAI 205 plus one elective slot, while Software replaces those with CSAI 203 and PHYS 104."
            />

            <section className="panel p-4 sm:p-5">
              <h2 className="text-[13px] font-bold tracking-tight">Choose Your Major</h2>

              <p
                className="mb-4 mt-1 text-[12px] leading-relaxed"
                style={{ color: 'var(--muted)' }}
              >
                Three configurations, five courses each.
              </p>

              <MajorPicker selectedId={null} onSelect={selectMajor} />
            </section>
          </div>
        ) : !yearPlan ? (
          <div className="space-y-3">
            <section className="panel p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="pill" style={{ color: 'var(--accent)' }}>
                    Major
                  </span>

                  <div>
                    <p className="text-[13.5px] font-bold leading-tight">{major.title}</p>

                    <p
                      className="text-[11.5px]"
                      style={{ color: 'var(--muted)' }}
                    >
                      {major.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-tap"
                  onClick={() => setShowMajorPicker((v) => !v)}
                  aria-expanded={showMajorPicker}
                >
                  {showMajorPicker ? 'Hide majors' : 'Change major'}
                </button>
              </div>

              {showMajorPicker && (
                <div className="mt-3">
                  <MajorPicker
                    selectedId={majorId}
                    onSelect={selectMajor}
                    compact
                  />
                </div>
              )}
            </section>

            <section className="panel p-4 sm:p-5">
              <h2 className="text-[13px] font-bold tracking-tight">Choose Your Year</h2>

              <p
                className="mb-4 mt-1 text-[12px] leading-relaxed"
                style={{ color: 'var(--muted)' }}
              >
                Pick the academic year you're planning — its course list appears next. You can
                still add courses from the other years afterwards.
              </p>

              <YearPicker
                major={major}
                selectedYearId={yearId}
                onSelect={selectYear}
              />
            </section>
          </div>
        ) : (
          <div className="space-y-3">
            <section className="panel p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="pill" style={{ color: 'var(--accent)' }}>
                    Major
                  </span>

                  <div>
                    <p className="text-[13.5px] font-bold leading-tight">{major.title}</p>

                    <p
                      className="text-[11.5px]"
                      style={{ color: 'var(--muted)' }}
                    >
                      {major.subtitle} · {yearPlan.label}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className="flex cursor-pointer items-center gap-1.5 text-[11.5px]"
                    style={{ color: 'var(--muted)' }}
                    title="Warn when a course publishes a lecture AND a lab/tutorial but only one of them has a time chosen"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[var(--accent)]"
                      checked={requireComplete}
                      onChange={(e) => setRequireComplete(e.target.checked)}
                    />

                    <span className="hidden sm:inline">Flag incomplete groups</span>
                    <span className="sm:hidden">Flag incomplete</span>
                  </label>

                  <button
                    type="button"
                    className="btn btn-tap"
                    onClick={() => setShowMajorPicker((v) => !v)}
                    aria-expanded={showMajorPicker}
                  >
                    {showMajorPicker ? 'Hide majors' : 'Change major'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-tap"
                    onClick={() => setShowYearPicker((v) => !v)}
                    aria-expanded={showYearPicker}
                  >
                    {showYearPicker ? 'Hide years' : 'Change year'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-tap"
                    onClick={requestClearAll}
                    disabled={takenCourses.length === 0}
                    title="Reset every selected course and section"
                  >
                    Clear All
                  </button>

                  <ShareSchedule
                    majorId={majorId!}
                    courses={courses}
                    picks={picks}
                    disabled={takenCourses.length === 0}
                    className="btn btn-accent btn-tap"
                    extras={shareExtras}
                    summary={{
                      majorName: major.title,
                      selectedCount: takenCourses.length,
                      totalCredits,
                      conflictFree: takenCourses.length > 0 && noConflicts,
                    }}
                  />
                </div>
              </div>

              {showMajorPicker && (
                <div className="mt-3">
                  <MajorPicker
                    selectedId={majorId}
                    onSelect={selectMajor}
                    compact
                  />
                </div>
              )}

              {showYearPicker && (
                <div className="mt-3">
                  <YearPicker
                    major={major}
                    selectedYearId={yearId}
                    onSelect={selectYear}
                    compact
                  />
                </div>
              )}
            </section>

            {!capNoteDismissed && (
              <CreditLimitNote
                onChoose={chooseCreditCap}
                onDismiss={dismissCapNote}
              />
            )}

            <CreditsDashboard
              selectedCount={takenCourses.length}
              courseCount={courses.length}
              totalCredits={totalCredits}
              freeHours={freeTime.freeHours}
              freeDays={freeTime.freeDays}
              occupiedMinutes={freeTime.occupiedMinutes}
              windowStart={WINDOW_START}
              windowEnd={WINDOW_END}
              overlapMinutes={freeTime.overlapMinutes}
              hiddenTotal={hiddenSummary.hidden}
              conflictTotal={hiddenSummary.conflicts}
              perDay={freeTime.perDay}
              onOpenBestSchedule={scrollToBestSchedule}
              onOpenPreferences={() => setPrefsOpen(true)}
              creditCap={effectiveCap}
              onChangeLimit={reopenCapNote}
            />

            <BestSchedule
              courses={takenCourses}
              majorId={major.id}
              picks={picks}
              preferences={preferences}
              shareExtras={shareExtras}
              prefsOpen={prefsOpen}
              onPrefsOpenChange={setPrefsOpen}
              onPreferencesChange={setPreferences}
              onUse={useGeneratedSchedule}
            />

            <div className="grid gap-3 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
              <CoursePicker
                courses={courses}
                picks={picks}
                instructorFilter={instructorFilter}
                onInstructorFilter={setInstructorPinned}
                preferences={preferences}
                onChange={changePick}
                onToggle={toggleCourse}
                onClearOne={clearOne}
                yearBadges={yearBadges}
                onOpenCrossYear={() => setCrossYearOpen(true)}
                capNotice={capNotice}
                shake={capShake}
              />

              <div className="space-y-3">
                {takenCourses.length === 0 ? (
                  <EmptyState
                    icon="🗓"
                    title="Select an instructor to view available schedule combinations."
                    message="Tick at least one course on the left, then pick its lecture and lab/tutorial times. Nothing is generated until every component has a time."
                  />
                ) : (
                  <>
                    {overlapsFound.length > 0 && (
                      <div
                        className="rounded-xl border px-3.5 py-3 text-[12px] leading-relaxed"
                        style={{
                          borderColor: 'var(--warn-line)',
                          background:
                            'color-mix(in srgb, var(--warn-bg) 55%, var(--paper))',
                          color: 'var(--warn)',
                        }}
                        role="alert"
                      >
                        <strong>
                          {overlapsFound.length} time conflict
                          {overlapsFound.length > 1 ? 's' : ''} in your current picks.
                        </strong>{' '}
                        The overlapping blocks are outlined in red on the timetable. Change one
                        of the times, or browse a generated combination instead.

                        {generation && storedCount > 0 && (
                          <span className="mt-1 block">
                            {count.toLocaleString()} conflict-free combination
                            {count === 1 ? 's' : ''} exist
                            {count === 1 ? 's' : ''} for this selection — use the arrows below.
                          </span>
                        )}
                      </div>
                    )}

                    {issues.length > 0 && (
                      <div className="panel-soft px-3.5 py-3" aria-live="polite">
                        <p
                          className="text-[11px] font-bold uppercase tracking-[0.06em]"
                          style={{ color: 'var(--muted-2)' }}
                        >
                          Still to decide
                        </p>

                        <ul className="mt-1.5 space-y-1">
                          {issues.map((issue, i) => (
                            <li
                              key={i}
                              className="text-[12px] leading-snug"
                              style={{ color: 'var(--muted)' }}
                            >
                              • {issue.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ready && (
                      <div
                        className="rounded-xl border-2 px-4 py-3 text-center text-[13.5px] font-bold"
                        style={{
                          borderColor: 'var(--ok)',
                          background:
                            'color-mix(in srgb, var(--ok) 12%, var(--paper))',
                          color: 'var(--ok)',
                        }}
                        role="status"
                      >
                        ✓ Ready to register — this selection has no time conflicts.
                      </div>
                    )}

                    {ready && count > 0 && (
                      <CombinationNav
                        index={safeIndex}
                        count={count}
                        onPrev={goPrev}
                        onNext={goNext}
                        onSuggest={suggestBest}
                        isBest={isCurrentComboBest}
                        bestIsComplete={best?.complete ?? true}
                      />
                    )}

                    <Filters
                      typeFilter={typeFilter}
                      onTypeFilter={setTypeFilter}
                      courseFilter={courseFilter}
                      onCourseFilter={setCourseFilter}
                      courses={takenCourses}
                    />

                    {allEvents.length === 0 ? (
                      <EmptyState
                        icon="🗓"
                        title="Select an instructor to view available schedule combinations."
                        message="Pick at least one lecture or lab/tutorial time from the cards on the left and it will appear here instantly."
                      />
                    ) : (
                      <div className="xl:sticky xl:top-3 xl:z-20">
                        <Timetable
                          events={visibleEvents}
                          hiddenCount={allEvents.length - visibleEvents.length}
                          bestLabel={bestLabel}
                          variant={noConflicts ? 'final' : 'draft'}
                          yearBadges={yearBadges}
                        />
                      </div>
                    )}

                    {allEvents.length > 0 && (
                      <>
                        <StatsBar
                          metrics={metrics}
                          courseCount={detailEntries.length}
                          comboCount={count}
                          truncated={generation?.truncated ?? false}
                          countCapped={generation?.countCapped ?? false}
                        />

                        <ScheduleDetails
                          entries={detailEntries}
                          yearBadges={yearBadges}
                        />

                        <EngineAudit
                          combos={count}
                          truncated={generation?.truncated ?? false}
                        />

                        <div className="panel flex flex-wrap items-center gap-2 p-3">
                          <ShareSchedule
                            majorId={majorId!}
                            courses={courses}
                            picks={picks}
                            disabled={takenCourses.length === 0}
                            className="btn btn-tap"
                            extras={shareExtras}
                            summary={{
                              majorName: major.title,
                              selectedCount: takenCourses.length,
                              totalCredits,
                              conflictFree: takenCourses.length > 0 && noConflicts,
                            }}
                          />

                          <button
                            type="button"
                            className="btn btn-tap"
                            onClick={() => window.print()}
                            disabled={!canExport}
                          >
                            Print / Save PDF
                          </button>

                          <button
                            type="button"
                            className="btn btn-tap"
                            onClick={copySummary}
                            disabled={!canExport}
                          >
                            {copied ? '✓ Copied' : 'Copy summary'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-tap"
                            onClick={requestClearAll}
                            title="Reset every selected course and section"
                          >
                            Clear All
                          </button>

                          {engineInSync && (
                            <span
                              className="pill ml-auto"
                              style={{ color: 'var(--ok)' }}
                            >
                              ✓ matches combination {safeIndex + 1}
                            </span>
                          )}
                        </div>

                        <p
                          className="px-1 text-center text-[11px] leading-relaxed"
                          style={{ color: 'var(--muted-2)' }}
                        >
                          Conflict rule: two meetings clash only on the same day when{' '}
                          <span className="mono">startA &lt; endB</span> and{' '}
                          <span className="mono">startB &lt; endA</span> — back-to-back sessions
                          (2:00–2:59 then 3:00–3:59) are allowed, while 2:00–3:59 and 3:00–4:59
                          clash. Non-credit tutorials and labs still count. Use ← / → to browse.
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <footer
          className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-[11px]"
          style={{ color: 'var(--muted-2)' }}
        >
          <span>Zewail City Schedule Builder · Version 2.1</span>

          <span aria-hidden>·</span>

          <button
            type="button"
            className="underline decoration-dotted underline-offset-2"
            onClick={showAbout ? closeAbout : openAbout}
          >
            About &amp; GitHub
          </button>
        </footer>

        <p
          className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'var(--accent)' }}
        >
          Directed by Ahmed Amir &amp; Youssef Taha (الريبات المشطشطين)
        </p>
      </div>

      {/* Mobile quick-action bar: the primary workflow (generate → preferences → share) stays
          one tap away while scrolling the course list on small screens. */}
      {major && !showAbout && takenCourses.length > 0 && (
        <nav
          className="mobile-actionbar no-print"
          aria-label="Quick schedule actions"
        >
          <button
            type="button"
            className="btn btn-accent btn-tap flex-1"
            onClick={scrollToBestSchedule}
          >
            ✦ Best
          </button>

          <button
            type="button"
            className="btn btn-tap flex-1"
            onClick={() => setMobileScheduleOpen(true)}
            disabled={allEvents.length === 0}
          >
            🗓 Schedule
          </button>

          <button
            type="button"
            className="btn btn-tap flex-1"
            onClick={() => setPrefsOpen(true)}
          >
            ⚙ Preferences
          </button>
        </nav>
      )}

      {mobileScheduleOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-0 sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Current schedule"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileScheduleOpen(false);
          }}
        >
          <div className="panel max-h-[88vh] w-full overflow-y-auto rounded-b-none rounded-t-2xl p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-bold">Current Schedule</h2>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Updates instantly as you change sections.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-tap px-3"
                onClick={() => setMobileScheduleOpen(false)}
                aria-label="Close current schedule"
              >
                ✕
              </button>
            </div>
            {allEvents.length === 0 ? (
              <EmptyState
                icon="🗓"
                title="No times selected yet."
                message="Choose a lecture, lab or tutorial and it will appear here."
              />
            ) : (
              <Timetable
                events={visibleEvents}
                hiddenCount={allEvents.length - visibleEvents.length}
                bestLabel={bestLabel}
                variant={noConflicts ? 'final' : 'draft'}
                yearBadges={yearBadges}
              />
            )}
          </div>
        </div>
      )}

      {crossYearOpen && major && yearPlan && (
        <CrossYearBrowser
          major={major}
          currentYearId={yearPlan.id}
          picks={picks}
          onToggle={toggleCourse}
          onClose={() => setCrossYearOpen(false)}
          capNotice={capNotice}
          shake={capShake}
        />
      )}

      {confirmClearOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm clear entire schedule"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmClearOpen(false);
          }}
        >
          <div className="panel w-full max-w-[420px] rounded-b-none p-5 sm:rounded-2xl">
            <h2 className="text-[15px] font-bold tracking-tight">
              Clear entire schedule?
            </h2>

            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              This will remove all selected courses, sections and instructor filters. Your saved
              schedule preferences won't be affected.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-tap"
                onClick={() => setConfirmClearOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-tap"
                style={{
                  background: 'var(--warn)',
                  color: '#fff',
                  borderColor: 'transparent',
                }}
                onClick={performClearAll}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
