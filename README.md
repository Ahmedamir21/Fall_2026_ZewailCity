<p align="center">
  <img src="Final_Fall_2026_ZewailCity/Templates-Final-Final-main/Zewail-City-Templates-arena-01a09711-zewail-city-templates/Final_Fall_2026_ZewailCity/Final_Fall_2026_Zewail/public/planora-logo.svg" width="620" alt="Planora" />
</p>

<div align="center">

# Planora

**Build · Compare · Share**

A student-built schedule planner that helps students choose courses and sections, detect conflicts, compare valid schedules, and keep a clean plan before registration.

**Fall 2026 · Years 1–4 · IT · Data Science & AI · Software**

[Planned production URL: `planora-planner.vercel.app`](https://planora-planner.vercel.app/)

</div>

---

## What Planora does

Planora keeps course planning in one place. Students can choose their academic year, select courses, mix published lecture/lab/tutorial sections, see real-time conflicts, track credits, compare generated schedules, preserve preferences, and share or export their final plan.

The current build includes:

- Years **1–4** with the same planner capabilities across supported study plans
- real interval conflict detection
- course, section and instructor filtering
- cross-year course browsing
- shared requirements and SCH electives
- configurable credit limits
- Best Schedule generation and comparison
- persistent schedule preferences and planner locks
- AI Schedule Assistant with preview-before-apply validation
- shareable schedule URLs
- schedule image / print support
- **Calendar export (.ics)** for Google Calendar, Apple Calendar and Outlook
- **Report data issue** templates per course and globally
- **Error Boundary + safe planner recovery**
- visible course-data verification date
- installable **PWA**
- offline planner shell
- **offline status** with clear AI availability messaging
- **new-version notification** for installed PWA users
- responsive mobile and desktop UI

## Brand

Planora is an independent student-built tool.

The brand identity uses a calendar-grid mark with violet/indigo/blue gradients and a warm amber highlight. It is designed to work in both dark and light mode.

**Creators:** Ahmed Amir & Youssef Taha  
**Creator credit inside the app:** `Directed by Ahmed Amir & Youssef Taha (الريبات المشطشطين)`

## Semester rollover

The planner engine is designed to stay stable between semesters. Semester-specific metadata is centralized in:

`src/config/semester.ts`

Course, instructor, section, room and meeting data lives under:

`src/data/`

The intended rollover workflow is:

1. update semester metadata;
2. update course / instructor / section / room / time data;
3. update year / major mappings where required;
4. update shared requirement data;
5. run the complete validation suite;
6. deploy only after every required check passes.

See `docs/SEMESTER_ROLLOVER.md` for the detailed process.

## Data accuracy

Planora is **not an official registration system**. It is a planning aid built from published course data.

The interface displays the last verified course-data date. Students should always confirm final registration details against the official Self-Service system before registration.

Missing rooms or unassigned instructors are shown as missing/unassigned; the project does not invent unpublished values.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Vercel
- Gemini-powered Schedule Assistant
- GitHub Actions CI

## Verification

The CI pipeline requires:

- production dependency audit
- strict TypeScript check
- production build
- platform feature regression tests
- data integrity tests
- assistant tests
- SSR smoke test
- UI tests
- core scheduler harness

## Project status

**Current semester:** Fall 2026  
**Course data last verified:** September 24, 2026  
**Target repository:** `Ahmedamir21/Planora`  
**Target Vercel project/domain:** `planora-planner.vercel.app`

---

<p align="center">
  Built by students, for students.
</p>
