# 🎓 Zewail City — Fall 2026 Schedule Builder

**A smart, conflict-aware course scheduling tool for Zewail City students.**

Pick a major, tick your courses, choose real lecture/lab/tutorial times, and let the built-in engine catch every time conflict instantly, track your credit hours and free time, and generate the best possible conflict-free schedules based on your personal preferences.

---

## ✨ Features

- **Major & Year Selection** — Choose from Information Technology, Data Science & AI, or Software Engineering, scoped across Year 2, 3, and 4.
- **Smart Course Picker** — Tick courses and pick lecture/lab/tutorial times independently; lecture and lab may come from different instructors.
- **Real-Time Conflict Detection** — Uses exact time intervals (`startA < endB && startB < endA`), so back-to-back sessions (e.g. 2:00–2:59 then 3:00–3:59) are never falsely flagged.
- **✦ Best Schedule Engine** — A most-constrained-first backtracking search across every instructor and section combination, ranked by your preferences (minimize gaps, maximize free days, earliest finish, latest start, and more).
- **Soft vs. Hard Preferences** — Every rule (preferred days, keep-free days, time windows, max hours/day) can be a soft ranking signal or a hard requirement — and the app clearly explains when a hard requirement can't be satisfied.
- **Live Credits Dashboard** — Real-time credit totals, free-time calculation (union of intervals, no double-counting), and a configurable credit cap (13 / 18 / 21).
- **Weekly Timetable** — Visual, swipeable, mobile-friendly grid with conflict highlighting.
- **Compare Schedules** — Compare up to 3 generated schedules side-by-side.
- **Shareable Links** — Generate a link that restores your exact schedule, sections, instructor filters, and preferences on any device — no login required, no personal data stored.
- **Cross-Year Course Browser** — Add courses from other years of your major (e.g. a Year 4 elective while browsing Year 3).
- **Print / Export** — Clean, print-ready schedule output and a plain-text summary copy.
- **Dark & Light Themes** — Full theme support with persisted preference.
- **Privacy-First** — Everything is stored locally in your browser (`localStorage`). No accounts, no tracking, no server-side data.

---

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite 7** (single-file production build via `vite-plugin-singlefile`)
- **Tailwind CSS 4**
- **esbuild**-powered test harness (engine logic, UI interaction, and SSR smoke tests)

---

## 🚀 Getting Started

### Prerequisites
- Node.js `^20.19.0` or `>=22.12.0`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Outputs a single self-contained `dist/index.html`.

### Preview the Production Build

```bash
npm run preview
```

---

## 🧪 Testing

The project ships with a multi-layer test suite:

```bash
# Core scheduling engine, share codec, state persistence, preferences (Node harness)
npm run test:harness

# Full-app server-side rendering smoke test
npm run test:ssr

# Real-DOM UI interaction tests (max-hours dropdown, share sheet, year picker & credit cap)
npm run test:ui
```

All engine logic — conflict detection, credit-cap enforcement, share-link encoding/decoding, and preference sanitization — is covered by dedicated assertions to guarantee nothing is ever silently broken or fabricated.

---

## 📐 How the Scheduling Engine Works

1. **Candidate building** — For each course, every valid lecture + lab/tutorial pairing is built across *all* instructors (not just one), with hard constraints applied as early exclusions.
2. **Most-constrained-first search** — Courses with fewer valid options are explored first, maximizing pruning efficiency.
3. **Conflict pruning** — A branch is discarded the instant any two meetings overlap in time — no wasted work.
4. **Bounded, honest results** — A safety cap on search-tree nodes guarantees the UI never hangs, and the app is always explicit about whether the top results are exhaustive, provably optimal, or "best found so far."
5. **Transparent ranking** — Every schedule's score is a disclosed weighted combination of your preferences — never a black box.

---

## 📁 Project Structure

```
src/
├── App.tsx                  # Root application state & layout
├── components/               # UI components (Timetable, CoursePicker, BestSchedule, etc.)
├── data/
│   ├── courses.ts             # Course, section & instructor data (Fall 2026)
│   └── majors.ts               # Major → Year → Course mappings
├── lib/
│   ├── scheduler.ts            # Combination generation & metrics
│   ├── bestSchedule.ts          # Best-Schedule ranking engine
│   ├── picks.ts                  # Option-state derivation (hidden/conflict logic)
│   ├── preferences.ts             # Schedule preference model & sanitization
│   ├── share.ts                    # Share-link encode/decode
│   ├── appState.ts                  # LocalStorage persistence
│   └── freeTime.ts                   # Free-time / occupied-time computation
└── types.ts                  # Shared TypeScript types
```

---

## 🔒 Privacy

This app stores **nothing** on any server. Your selections, preferences, and credit-cap setting live entirely in your browser's Local Storage. Share links carry only opaque course/section identifiers and preference flags — never your name, email, or any personal or academic information.

---

## 👥 Credits

**Directed & Developed by:**
- **Ahmed Amir Ibrahim**
- **Youssef Taha Ahmed**

---

## 📄 License

This project is provided for educational use by Zewail City students. Course, section, and timing data reflect the Fall 2026 Main Session and should always be verified against the official registration portal before finalizing registration.

---

<p align="center">
  <strong>Zewail City Schedule Builder</strong> · Fall 2026 · Main Session
</p>
