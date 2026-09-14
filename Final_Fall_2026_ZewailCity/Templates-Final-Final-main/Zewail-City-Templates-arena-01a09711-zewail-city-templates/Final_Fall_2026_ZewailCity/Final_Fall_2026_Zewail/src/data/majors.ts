import type { Major, YearPlan } from '../types';

/**

* Year scoping
* ---
* Each major exposes four selectable years:
* Year 1 (Freshman), Year 2 (Sophomore), Year 3 (Junior), Year 4 (Senior).
*
* Year 1 is currently prepared as an empty course list and can be populated
* with course IDs once the Year 1 courses are added to courses.ts.
  */

export const YEAR_IDS = ['y1', 'y2', 'y3', 'y4'] as const;

export const MAJORS: Major[] = [
{
id: 'it',
title: 'Information Technology',
subtitle: 'Networks, Security & Governance',
blurb: 'Enterprise systems, infrastructure and governance track.',
years: [
{
id: 'y1',
label: 'Year 1 (Freshman)',
courseIds: [],
},
{
id: 'y2',
label: 'Year 2 (Sophomore)',
courseIds: ['csai201', 'csai202', 'math105', 'csai205', 'it205'],
},
{
id: 'y3',
label: 'Year 3 (Junior)',
courseIds: ['csai203', 'csai301', 'it308', 'itns301', 'math205'],
},
{
id: 'y4',
label: 'Year 4 (Senior)',
courseIds: ['itns403', 'itns404', 'itns406', 'it402', 'it411', 'csai498'],
},
],
},

{
id: 'dsai',
title: 'Data Science & AI',
subtitle: 'Data Science and Artificial Intelligence',
blurb: 'Data integration, analytics and intelligent systems track.',
years: [
{
id: 'y1',
label: 'Year 1 (Freshman)',
courseIds: [],
},
{
id: 'y2',
label: 'Year 2 (Sophomore)',
courseIds: ['csai201', 'csai202', 'math105', 'csai205', 'dsai203'],
},
{
id: 'y3',
label: 'Year 3 (Junior)',
courseIds: ['csai203', 'csai301', 'dsai307', 'dsai308', 'math303'],
},
{
id: 'y4',
label: 'Year 4 (Senior)',
courseIds: ['dsai403', 'csai302', 'dsai402', 'dsai456', 'csai498'],
},
],
},

{
id: 'software',
title: 'Software',
subtitle: 'Software Engineering',
blurb: 'Engineering process and physics track — swaps CSAI 205 / the elective for CSAI 203 + PHYS 104.',
years: [
{
id: 'y1',
label: 'Year 1 (Freshman)',
courseIds: [],
},
{
id: 'y2',
label: 'Year 2 (Sophomore)',
courseIds: ['csai201', 'csai202', 'csai203', 'phys104', 'math105'],
},
{
id: 'y3',
label: 'Year 3 (Junior)',
// All three concentrations (APD / GCG / HCI) merged into one flat list — no track picker.
courseIds: ['csai301', 'sw301', 'sw252', 'sw302', 'swapd301', 'swgcg301', 'swhci301'],
},
{
id: 'y4',
label: 'Year 4 (Senior)',
courseIds: ['sw401', 'swapd401', 'swapd402', 'sw402', 'swgcg401', 'swgcg402', 'swhci401', 'swhci402', 'csai498'],
},
],
},
];

export const MAJOR_BY_ID: Record<string, Major> = Object.fromEntries(MAJORS.map((mj) => [mj.id, mj]));

/** The YearPlan for a major+year pair, falling back to the major's FIRST year ('y1'). */
export function yearPlanOf(major: Major, yearId: string | null | undefined): YearPlan {
return major.years.find((y) => y.id === yearId) ?? major.years[0];
}

/** Every course id belonging to ANY year of the major (used by the cross-year browser). */
export function allYearCourseIds(major: Major): string[] {
const seen = new Set<string>();
const out: string[] = [];
major.years.forEach((y) =>
y.courseIds.forEach((id) => {
if (seen.has(id)) return;
seen.add(id);
out.push(id);
}),
);
return out;
}

/** Human label ("Year 1") of the FIRST year that lists this course inside the major. */
export function yearBadgeOf(major: Major, courseId: string): string | null {
const year = major.years.find((y) => y.courseIds.includes(courseId));
return year ? year.label.replace(/\s*\(.*\)$/, '') : null;
}
