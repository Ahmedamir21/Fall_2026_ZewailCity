import type { Course, Day, Instructor, Meeting, MeetingType } from '../types';

/**
 * Time encoding
 * -------------
 * The original app used fixed blocks A–E. They are converted here to REAL minute
 * intervals without changing a single meeting:
 *   A = 8:00–9:59 AM  → 480–600
 *   B = 10:00–11:59 AM → 600–720
 *   C = 12:00–1:59 PM  → 720–840
 *   D = 2:00–3:59 PM   → 840–960
 *   E = 4:00–5:59 PM   → 960–1080
 * So existing meetings keep exactly the same occupied time as before, while new
 * one-hour meetings (e.g. PHYS 104 tutorials) can now be represented accurately.
 */
const B = { A: [8, 10], B: [10, 12], C: [12, 14], D: [14, 16], E: [16, 18] } as const;
type Block = keyof typeof B;

/**
 * Credit hours
 * ------------
 * PHYS 104's 3 credits are stated directly in its self-service listing. Every other
 * course in this catalogue is a standard 3-credit-hour course (the norm for this
 * curriculum), so the same value is used consistently for the Credits Dashboard.
 * This is a credit-hour figure only — it is never confused with meeting duration.
 */

function m(type: MeetingType, sec: string, day: Day, startHour: number, endHour: number, room: string): Meeting {
  return { type, sec, day, start: startHour * 60, end: endHour * 60, room };
}

/** Legacy block → real interval (used for the data that came from the original app). */
function mb(type: MeetingType, sec: string, day: Day, block: Block, room: string): Meeting {
  const [s, e] = B[block];
  return m(type, sec, day, s, e, room);
}

const lec = (sec: string, day: Day, block: Block, room: string) => mb('Lecture', sec, day, block, room);
const lab = (sec: string, day: Day, block: Block, room: string) => mb('Lab', sec, day, block, room);
const tut = (sec: string, day: Day, block: Block, room: string) => mb('Tutorial', sec, day, block, room);

/* ------------------------------------------------------------------ */
/* CSAI 203 / PHYS 104 helpers (real hours, including 1-hour meetings) */
/* ------------------------------------------------------------------ */
const lecH = (sec: string, day: Day, sh: number, eh: number, room: string) => m('Lecture', sec, day, sh, eh, room);
const labH = (sec: string, day: Day, sh: number, eh: number, room: string) => m('Lab', sec, day, sh, eh, room);
const tutH = (sec: string, day: Day, sh: number, eh: number, room: string) => m('Tutorial', sec, day, sh, eh, room);

/* =============================== DATA =============================== */

const csai201: Course = {
  id: 'csai201',
  code: 'CSAI 201',
  name: 'Data Structures',
  c: 1,
  credits: 3,
  instructors: [
    {
      name: 'Mayada Mansour Ali',
      lectures: [lec('01', 'Tue', 'C', 'G038B')],
      labs: [
        lab('01', 'Wed', 'D', 'G012-E'),
        lab('02', 'Wed', 'B', 'G012-E'),
        lab('03', 'Wed', 'D', 'G013-E'),
        lab('04', 'Wed', 'B', 'G013-E'),
      ],
      tutorials: [],
    },
    {
      name: 'Mohamed Elhalaby Elhalaby',
      lectures: [lec('02', 'Tue', 'D', 'G038B'), lec('03', 'Wed', 'A', 'G011-B')],
      labs: [
        lab('05', 'Wed', 'E', 'G013-E'),
        lab('06', 'Wed', 'D', 'G014-E'),
        lab('07', 'Sun', 'C', 'G007D'),
        lab('08', 'Sun', 'A', 'G0010D'),
        lab('09', 'Mon', 'D', 'G015-E'),
        lab('10', 'Tue', 'B', 'G016-E'),
        lab('11', 'Sun', 'A', 'G014-E'),
        lab('12', 'Sun', 'C', 'G014-E'),
      ],
      tutorials: [],
    },
  ],
};

const csai202: Course = {
  id: 'csai202',
  code: 'CSAI 202',
  name: 'Introduction to Database Systems',
  c: 2,
  credits: 3,
  instructors: [
    {
      name: 'Yousry Abdelazeem Abdelazeem',
      lectures: [lec('01', 'Mon', 'B', 'G038B'), lec('02', 'Mon', 'E', 'G038B')],
      labs: [
        lab('01', 'Tue', 'D', 'G011-E'),
        lab('02', 'Tue', 'B', 'G011-E'),
        lab('03', 'Tue', 'B', 'G012-E'),
        lab('04', 'Tue', 'B', 'G015-D'),
        lab('05', 'Tue', 'C', 'G015-D'),
        lab('06', 'Wed', 'B', 'G011-E'),
        lab('07', 'Wed', 'E', 'G016-E'),
        lab('08', 'Wed', 'A', 'G012-E'),
      ],
      tutorials: [],
    },
    {
      name: 'Ashraf Hendam Hendam',
      lectures: [lec('03', 'Sun', 'B', 'G033B')],
      labs: [],
      tutorials: [],
      note: 'No confirmed lab under this instructor — sections 09–12 still show "unannounced" instructor in self-service',
    },
  ],
};

const csai205: Course = {
  id: 'csai205',
  code: 'CSAI 205',
  name: 'Fundamentals of Circuits and Electronics',
  c: 3,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Maher Ata',
      lectures: [lec('01', 'Mon', 'A', 'G019-B'), lec('02', 'Mon', 'D', 'G025B'), lec('03', 'Tue', 'B', 'G006-B')],
      labs: [
        lab('01', 'Tue', 'A', 'G012-E'),
        lab('02', 'Tue', 'B', 'G014-E'),
        lab('03', 'Tue', 'E', 'G014-E'),
        lab('04', 'Wed', 'B', 'G009-D'),
        lab('05', 'Sun', 'B', 'S043-E'),
        lab('06', 'Sun', 'C', 'S043-E'),
        lab('07', 'Sun', 'A', 'S043-E'),
        lab('08', 'Sun', 'B', 'S001-A'),
        lab('09', 'Sun', 'C', 'S001-A'),
        lab('10', 'Sun', 'D', 'S001-A'),
        lab('11', 'Mon', 'D', 'S001-A'),
        lab('12', 'Mon', 'E', 'S001-A'),
      ],
      tutorials: [],
    },
  ],
};

const math105: Course = {
  id: 'math105',
  code: 'MATH 105',
  name: 'Probability and Statistics',
  c: 4,
  credits: 3,
  instructors: [
    {
      name: 'Walaa El-Sharkawy El-Sharkawy',
      lectures: [lec('01', 'Tue', 'A', 'G009-B')],
      labs: [],
      tutorials: [
        tut('01', 'Tue', 'C', 'G009-B'),
        tut('02', 'Wed', 'E', 'G009-B'),
        tut('03', 'Tue', 'D', 'G008-C'),
      ],
    },
    {
      name: 'Mohamed Fawzy Fawzy',
      lectures: [lec('02', 'Wed', 'D', 'G009-B')],
      labs: [],
      tutorials: [
        tut('04', 'Sun', 'A', 'G008-C'),
        tut('05', 'Tue', 'A', 'G008-C'),
        tut('06', 'Sun', 'C', 'G008-C'),
      ],
    },
  ],
};

const it205: Course = {
  id: 'it205',
  code: 'IT 205',
  name: 'Enterprise System Architecture',
  c: 5,
  credits: 3,
  group: 'slot5',
  instructors: [
    {
      name: 'Mohamed Mahdy',
      lectures: [lec('01', 'Wed', 'A', 'F25-B4')],
      labs: [lab('01', 'Mon', 'D', 'S043-E')],
      tutorials: [],
    },
  ],
};

const dsai203: Course = {
  id: 'dsai203',
  code: 'DSAI 203',
  name: 'Data Integration and Visualization',
  c: 5,
  credits: 3,
  group: 'slot5',
  instructors: [
    {
      name: 'Saeed Mohsen',
      lectures: [lec('01', 'Tue', 'A', 'G006-B')],
      labs: [
        lab('01', 'Wed', 'A', 'G0012D'),
        lab('02', 'Wed', 'A', 'S001-A'),
        lab('03', 'Wed', 'B', 'S001-A'),
        lab('04', 'Wed', 'D', 'S001-A'),
      ],
      tutorials: [],
    },
    {
      name: 'Mohamed Elhalaby Elhalaby',
      lectures: [lec('02', 'Mon', 'B', 'G033B'), lec('03', 'Mon', 'A', 'G033B')],
      labs: [
        lab('05', 'Wed', 'E', 'S001-A'),
        lab('06', 'Tue', 'A', 'S001-A'),
        lab('07', 'Tue', 'C', 'S001-A'),
        lab('08', 'Tue', 'B', 'S001-A'),
        lab('09', 'Wed', 'B', 'S043-E'),
        lab('10', 'Wed', 'A', 'S043-E'),
        lab('11', 'Wed', 'D', 'S043-E'),
        lab('12', 'Wed', 'E', 'S043-E'),
      ],
      tutorials: [],
    },
  ],
};

/* ===================== NEW: CSAI 203 (Software major) ===================== */
const csai203: Course = {
  id: 'csai203',
  code: 'CSAI 203',
  name: 'Introduction to Software Engineering',
  c: 6,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Sami Rakha',
      lectures: [lecH('01', 'Sun', 14, 16, 'G006-B')], // Sunday 2:00–3:59 PM
      labs: [
        labH('01', 'Mon', 16, 18, 'G0011D'), // Monday 4:00–5:59 PM
        labH('02', 'Mon', 8, 10, 'G014-E'), // Monday 8:00–9:59 AM
        labH('03', 'Mon', 16, 18, 'G014-E'), // Monday 4:00–5:59 PM
        labH('04', 'Mon', 8, 10, 'G011-E'), // Monday 8:00–9:59 AM
      ],
      tutorials: [],
    },
    {
      name: 'Sabah Sayed Sayed',
      lectures: [], // no lecture assigned — must NOT be invented
      labs: [
        labH('05', 'Wed', 8, 10, 'G015-E'),
        labH('06', 'Mon', 14, 16, 'G009-D'),
        labH('07', 'Tue', 12, 14, 'G011-E'),
        labH('08', 'Tue', 8, 10, 'G011-E'),
      ],
      tutorials: [],
      note: 'No lecture assigned to this instructor in self-service — lab sections only.',
    },
    {
      name: 'Instructor not assigned',
      unassigned: true,
      lectures: [lecH('03', 'Sun', 14, 16, 'G033B')],
      labs: [
        labH('09', 'Tue', 12, 14, 'G013-E'),
        labH('10', 'Tue', 14, 16, 'G013-E'),
        labH('11', 'Tue', 12, 14, 'G014-E'),
        labH('12', 'Tue', 10, 12, 'G013-E'),
      ],
      tutorials: [],
      note: 'Sections listed without an instructor in self-service — kept together exactly as published.',
    },
  ],
};

/* ===================== NEW: PHYS 104 (Software major) ===================== */
const phys104: Course = {
  id: 'phys104',
  code: 'PHYS 104',
  name: 'Physics 2',
  c: 7,
  credits: 3,
  instructors: [
    {
      name: 'Ashraf Abdelwahed',
      lectures: [lecH('01', 'Tue', 12, 14, 'F027B1')], // Tuesday 12:00–1:59 PM · 3 credits
      tutorials: [
        tutH('01', 'Sun', 8, 9, 'F026B1'), // 8:00–8:59 AM
        tutH('02', 'Sun', 9, 10, 'F026B1'), // 9:00–9:59 AM
        tutH('03', 'Mon', 15, 16, 'F004-D'), // 3:00–3:59 PM
        tutH('04', 'Mon', 14, 15, 'F014-E'), // 2:00–2:59 PM
      ],
      labs: [
        labH('01', 'Mon', 10, 12, 'S31-B1'), // 10:00–11:59 AM
        labH('02', 'Mon', 14, 16, 'S31-B1'), // 2:00–3:59 PM
        labH('03', 'Sun', 10, 12, 'S31-B1'), // 10:00–11:59 AM
        labH('04', 'Mon', 15, 17, 'S20-B2'), // 3:00–4:59 PM
      ],
    },
  ],
};

/* ==================================================================== */
/* NEW (Fall additions): Year 3 & Year 4 courses for DSAI / IT / Software */
/* All times below are exact wall-clock hours from self-service, encoded  */
/* with the same lecH/labH/tutH helpers used for CSAI 203 and PHYS 104.   */
/* Colors reuse/cycle the existing 1–7 palette, exactly like the original */
/* dataset does (IT 205 and DSAI 203 both use c:5).                       */
/* ==================================================================== */

/* ---- Shared course: DSAI Y3 + IT Y3 + Software Y3 ---- */
const csai301: Course = {
  id: 'csai301',
  code: 'CSAI 301',
  name: 'Artificial Intelligence',
  c: 1,
  credits: 3,
  instructors: [
    {
      name: 'Sabah Sayed Sayed',
      lectures: [lecH('01', 'Sun', 10, 12, 'G008-C')],
      labs: [
        labH('01', 'Mon', 10, 12, 'G016-E'),
        labH('02', 'Mon', 8, 10, 'G016-E'),
        labH('03', 'Mon', 10, 12, 'G0012D'),
        labH('04', 'Mon', 16, 18, 'G0012D'),
      ],
      tutorials: [],
    },
  ],
};

/* ---- Data Science & AI — Year 3 (Fall) ---- */
const dsai307: Course = {
  id: 'dsai307',
  code: 'DSAI 307',
  name: 'Statistical Inference',
  c: 2,
  credits: 3,
  instructors: [
    {
      name: 'Rasha Mohamed Mandouh',
      lectures: [lecH('01', 'Sun', 8, 10, 'G011-B')],
      labs: [
        labH('01', 'Mon', 8, 10, 'S043-E'),
        labH('02', 'Tue', 8, 10, 'S043-E'),
        labH('03', 'Mon', 10, 12, 'S001-A'),
        labH('04', 'Tue', 14, 16, 'S043-E'),
      ],
      tutorials: [],
    },
  ],
};

const dsai308: Course = {
  id: 'dsai308',
  code: 'DSAI 308',
  name: 'Deep Learning',
  c: 3,
  credits: 3,
  instructors: [
    {
      name: 'Khaled El Sayed El Sayed',
      lectures: [lecH('01', 'Tue', 12, 14, 'F30-B4')],
      labs: [
        labH('01', 'Sun', 12, 14, 'G016-E'),
        labH('02', 'Sun', 8, 10, 'G016-E'),
        labH('03', 'Sun', 14, 16, 'G016-E'),
      ],
      tutorials: [],
    },
  ],
};

const math303: Course = {
  id: 'math303',
  code: 'MATH 303',
  name: 'Linear and Non-linear Programming for CS',
  c: 4,
  credits: 3,
  instructors: [
    {
      name: 'Ahmed Abdelsamea',
      lectures: [lecH('01', 'Wed', 8, 10, 'G006-B')],
      labs: [],
      tutorials: [
        tutH('01', 'Sun', 14, 16, 'F012-D'),
        tutH('02', 'Sun', 12, 14, 'F013-E'),
        tutH('03', 'Sun', 14, 16, 'F013-E'),
      ],
    },
  ],
};

/* ---- Data Science & AI — Year 4 (Fall) ---- */
const dsai403: Course = {
  id: 'dsai403',
  code: 'DSAI 403',
  name: 'Nature Inspired Computation',
  c: 5,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Maher Ata',
      lectures: [lecH('01', 'Tue', 8, 10, 'G004-C')],
      labs: [
        labH('01', 'Tue', 10, 12, 'S043-E'),
        labH('02', 'Sun', 16, 18, 'S001-A'),
        labH('03', 'Sun', 14, 16, 'G009-D'),
      ],
      tutorials: [],
    },
  ],
};

const csai302: Course = {
  id: 'csai302',
  code: 'CSAI 302',
  name: 'Advanced Database Systems',
  c: 6,
  credits: 3,
  instructors: [
    {
      name: 'Yousry Abdelazeem Abdelazeem',
      lectures: [lecH('01', 'Tue', 14, 16, 'G006-B')],
      labs: [
        labH('01', 'Wed', 14, 16, 'G015-E'),
        labH('02', 'Wed', 10, 12, 'G015-E'),
        labH('03', 'Mon', 14, 16, 'G013-E'),
        labH('04', 'Wed', 10, 12, 'G014-E'),
      ],
      tutorials: [],
    },
  ],
};

const dsai402: Course = {
  id: 'dsai402',
  code: 'DSAI 402',
  name: 'Reinforcement Learning',
  c: 7,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Ghalwash',
      lectures: [lecH('01', 'Mon', 14, 16, 'F25-B4')],
      labs: [
        labH('01', 'Tue', 16, 18, 'S001-A'),
        labH('02', 'Wed', 14, 16, 'G020-E'),
        labH('03', 'Wed', 16, 18, 'G012-E'),
      ],
      tutorials: [],
    },
  ],
};

const dsai456: Course = {
  id: 'dsai456',
  code: 'DSAI 456',
  name: 'Speech Recognition',
  c: 1,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Ghalwash',
      lectures: [lecH('01', 'Mon', 8, 10, 'G035-B')],
      labs: [
        labH('01', 'Mon', 10, 12, 'S043-E'),
        labH('02', 'Tue', 12, 14, 'S043-E'),
        labH('03', 'Tue', 16, 18, 'S043-E'),
      ],
      tutorials: [],
    },
  ],
};

/* ---- Placeholder courses: real credits, ZERO published meetings ----
   Confirmed to exist via official course-map documents, but self-service
   publishes no day/time/room/instructor for them. Nothing is invented —
   they carry only credits and a `noFixedSchedule` flag. */
const csai498: Course = {
  id: 'csai498',
  code: 'CSAI 498',
  name: 'Senior Project - Part 1',
  c: 2,
  credits: 1,
  noFixedSchedule: true,
  instructors: [
    {
      name: 'Instructor not assigned',
      unassigned: true,
      lectures: [],
      labs: [],
      tutorials: [],
      note: 'No fixed schedule published in self-service — the project is arranged individually with a supervisor.',
    },
  ],
};

const math205: Course = {
  id: 'math205',
  code: 'MATH 205',
  name: 'Discrete Mathematics for Computational Sciences',
  c: 5,
  credits: 3,
  noFixedSchedule: true,
  instructors: [
    {
      name: 'Instructor not assigned',
      unassigned: true,
      lectures: [],
      labs: [],
      tutorials: [],
      note: 'Not published in self-service — no day/time/room/instructor data exists; nothing is invented.',
    },
  ],
};

/* ---- Information Technology — Year 3 (Fall) ---- */
const it308: Course = {
  id: 'it308',
  code: 'IT 308',
  name: 'Cloud Computing Architecture',
  c: 3,
  credits: 2,
  instructors: [
    {
      name: 'Sahar Abdel Rahman',
      lectures: [lecH('01', 'Tue', 12, 14, 'F031B4')],
      labs: [labH('01', 'Sun', 14, 16, 'S043-E')],
      tutorials: [],
    },
  ],
};

const itns301: Course = {
  id: 'itns301',
  code: 'ITNS 301',
  name: 'Network Administration',
  c: 4,
  credits: 2,
  instructors: [
    {
      name: 'Tarek Mohamed Salem',
      lectures: [lecH('01', 'Thu', 14, 16, 'Online')],
      labs: [labH('01', 'Mon', 10, 12, 'G009-D')],
      tutorials: [],
    },
  ],
};

/* ---- Information Technology — Year 4 (Fall) ---- */
const itns403: Course = {
  id: 'itns403',
  code: 'ITNS 403',
  name: 'Storage Area Networks',
  c: 6,
  credits: 3,
  instructors: [
    {
      name: 'Tarek Mohamed Salem',
      lectures: [lecH('01', 'Thu', 8, 10, 'Online')],
      labs: [labH('01', 'Sun', 12, 14, 'G009-D')],
      tutorials: [],
    },
  ],
};

const itns404: Course = {
  id: 'itns404',
  code: 'ITNS 404',
  name: 'Net Performance Monitoring & Trbl-shooting',
  c: 7,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Mahdy',
      lectures: [lecH('01', 'Mon', 14, 16, 'G018-E')],
      labs: [labH('01', 'Wed', 8, 10, 'G011-E')],
      tutorials: [],
    },
  ],
};

const itns406: Course = {
  id: 'itns406',
  code: 'ITNS 406',
  name: 'Network Resilience and Hardening',
  c: 1,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Mahdy',
      lectures: [lecH('01', 'Tue', 14, 16, 'G008-B')],
      labs: [labH('01', 'Wed', 10, 12, 'G015-D')],
      tutorials: [],
    },
  ],
};

const it402: Course = {
  id: 'it402',
  code: 'IT 402',
  name: 'Fundamentals of Cybersecurity & Encryption',
  c: 2,
  credits: 3,
  instructors: [
    {
      name: 'Sahar Abdel Rahman',
      lectures: [lecH('01', 'Tue', 10, 12, 'G018-E')],
      labs: [labH('01', 'Wed', 16, 18, 'G015-E')],
      tutorials: [],
    },
  ],
};

const it411: Course = {
  id: 'it411',
  code: 'IT 411',
  name: 'Enterprise Resources Planning',
  c: 3,
  credits: 3,
  instructors: [
    {
      name: 'Sahar Abdel Rahman',
      lectures: [lecH('01', 'Mon', 14, 16, 'G033B')],
      labs: [labH('01', 'Tue', 8, 10, 'G007D')],
      tutorials: [],
    },
  ],
};

/* ---- Software — Year 3 (Fall; all three concentrations merged) ---- */
const sw301: Course = {
  id: 'sw301',
  code: 'SW 301',
  name: 'Object-Oriented Analysis and Design',
  c: 4,
  credits: 3,
  instructors: [
    {
      name: 'Instructor not assigned',
      unassigned: true,
      lectures: [lecH('01', 'Sun', 8, 10, 'G007-C')],
      labs: [labH('01', 'Sun', 12, 14, 'F012-E'), labH('02', 'Sun', 14, 16, 'F011-D')],
      tutorials: [],
    },
  ],
};

const sw252: Course = {
  id: 'sw252',
  code: 'SW 252',
  name: 'Embedded Systems',
  c: 5,
  credits: 3,
  instructors: [
    {
      name: 'Manar Shaker',
      lectures: [lecH('01', 'Wed', 10, 12, 'F006-D')],
      labs: [labH('01', 'Tue', 10, 12, 'G015-E')],
      tutorials: [],
      note: 'Confirmed via the official course-map: belongs in Software Year 3 despite the 252-style numbering.',
    },
  ],
};

const sw302: Course = {
  id: 'sw302',
  code: 'SW 302',
  name: 'User Interface Development',
  c: 6,
  credits: 3,
  instructors: [
    {
      name: 'Mohamed Sami Rakha',
      lectures: [lecH('01', 'Mon', 10, 12, 'F019-E')],
      labs: [labH('01', 'Tue', 8, 10, 'G015-D')],
      tutorials: [],
    },
  ],
};

const swapd301: Course = {
  id: 'swapd301',
  code: 'SWAPD 301',
  name: 'Software Systems Requirements Dev',
  c: 7,
  credits: 3,
  instructors: [
    {
      name: 'Dina Ezzat',
      lectures: [lecH('01', 'Wed', 14, 16, 'ZC2')], // University of Science and Technology, Academic Building ZC2
      labs: [labH('01', 'Wed', 8, 10, 'G014-E')],
      tutorials: [],
    },
  ],
};

const swgcg301: Course = {
  id: 'swgcg301',
  code: 'SWGCG 301',
  name: 'Computer Graphics and Multimedia Systems',
  c: 1,
  credits: 3,
  instructors: [
    {
      name: 'Yahia Zakaria Abd El-Samee El-Wahed',
      lectures: [lecH('01', 'Mon', 8, 10, 'F009-D')],
      labs: [labH('01', 'Sun', 16, 18, 'G017-E')],
      tutorials: [],
    },
  ],
};

const swhci301: Course = {
  id: 'swhci301',
  code: 'SWHCI 301',
  name: 'Prototyping Algorithmic Experiences',
  c: 2,
  credits: 3,
  instructors: [
    {
      name: 'Hussein Jad',
      lectures: [lecH('01', 'Thu', 12, 14, 'Online')],
      labs: [labH('01', 'Sun', 14, 16, 'G015-D')],
      tutorials: [],
    },
  ],
};

/* ---- Software — Year 4 (Fall; all three concentrations merged) ---- */
const sw401: Course = {
  id: 'sw401',
  code: 'SW 401',
  name: 'Parallel and Distributed Computing',
  c: 3,
  credits: 3,
  instructors: [
    {
      name: 'Samar Elbedwehy',
      lectures: [lecH('01', 'Sun', 10, 12, 'F008-E')],
      labs: [labH('01', 'Mon', 14, 16, 'G016-E'), labH('02', 'Mon', 16, 18, 'G015-E')],
      tutorials: [],
    },
  ],
};

const swapd401: Course = {
  id: 'swapd401',
  code: 'SWAPD 401',
  name: 'Software Testing, Validation, and QA',
  c: 4,
  credits: 3,
  instructors: [
    {
      name: 'Instructor not assigned',
      unassigned: true,
      lectures: [lecH('01', 'Tue', 12, 14, 'F015-D')],
      labs: [labH('01', 'Wed', 8, 10, 'G016-E'), labH('02', 'Wed', 10, 12, 'G016-E')],
      tutorials: [],
    },
  ],
};

const swapd402: Course = {
  id: 'swapd402',
  code: 'SWAPD 402',
  name: 'Mobile Application Development',
  c: 5,
  credits: 3,
  instructors: [
    {
      name: 'Yousry Abdelazeem Abdelazeem',
      lectures: [lecH('01', 'Tue', 8, 10, 'ZC2')], // University of Science and Technology, Academic Building ZC2
      labs: [labH('01', 'Wed', 10, 12, 'F013-E')],
      tutorials: [],
    },
  ],
};

const sw402: Course = {
  id: 'sw402',
  code: 'SW 402',
  name: 'Software Project Management',
  c: 6,
  credits: 3,
  instructors: [
    {
      name: 'Instructor not assigned',
      unassigned: true,
      lectures: [lecH('01', 'Tue', 14, 16, 'F006-D')],
      labs: [labH('01', 'Sun', 8, 10, 'F016-E')],
      tutorials: [],
    },
  ],
};

const swgcg401: Course = {
  id: 'swgcg401',
  code: 'SWGCG 401',
  name: 'Design & Geom Modeling for Vis & Comm',
  c: 7,
  credits: 3,
  instructors: [
    {
      name: 'Instructor not assigned',
      unassigned: true,
      lectures: [lecH('01', 'Sun', 12, 14, 'G018-E')],
      labs: [labH('01', 'Tue', 16, 18, 'G015-E')],
      tutorials: [],
    },
  ],
};

const swgcg402: Course = {
  id: 'swgcg402',
  code: 'SWGCG 402',
  name: 'Visual Effects Production',
  c: 1,
  credits: 3,
  instructors: [
    {
      name: 'Hussein Jad',
      lectures: [lecH('01', 'Thu', 8, 10, 'Online')],
      labs: [labH('01', 'Mon', 10, 12, 'G015-E')],
      tutorials: [],
    },
  ],
};

const swhci401: Course = {
  id: 'swhci401',
  code: 'SWHCI 401',
  name: 'Human Information Processing and AI',
  c: 2,
  credits: 3,
  instructors: [
    {
      name: 'Sherif Hamdy ElGohary',
      lectures: [lecH('01', 'Thu', 16, 18, 'University of Science and Technology')], // no specific room code published
      labs: [labH('01', 'Sun', 16, 18, 'G015-E')],
      tutorials: [],
    },
  ],
};

const swhci402: Course = {
  id: 'swhci402',
  code: 'SWHCI 402',
  name: 'AI Based Products and Services',
  c: 3,
  credits: 3,
  instructors: [
    {
      name: 'Hussein Jad',
      lectures: [lecH('01', 'Thu', 14, 16, 'Online')],
      labs: [labH('01', 'Mon', 8, 10, 'G015-E')],
      tutorials: [],
    },
  ],
};

export const COURSES: Course[] = [
  csai201,
  csai202,
  csai205,
  math105,
  it205,
  dsai203,
  csai203,
  phys104,
  // Year 3 / Year 4 additions (append-only — nothing above is ever touched)
  csai301,
  dsai307,
  dsai308,
  math303,
  dsai403,
  csai302,
  dsai402,
  dsai456,
  csai498,
  math205,
  it308,
  itns301,
  itns403,
  itns404,
  itns406,
  it402,
  it411,
  sw301,
  sw252,
  sw302,
  swapd301,
  swgcg301,
  swhci301,
  sw401,
  swapd401,
  swapd402,
  sw402,
  swgcg401,
  swgcg402,
  swhci401,
  swhci402,
];

export const COURSE_BY_ID: Record<string, Course> = Object.fromEntries(COURSES.map((c) => [c.id, c]));

export function instructorLabel(instr: Instructor): string {
  return instr.unassigned ? `${instr.name} (unassigned)` : instr.name;
}
