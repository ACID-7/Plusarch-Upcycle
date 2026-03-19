/**
 * EVM (Earned Value Management) data for Plus Arch Upcycle project
 * Project: 9 weeks starting 18 Jan 2026 | Total LKR 81,950
 * Status: Development complete, starting testing (current period = Week 6)
 */

export const BUDGET_TOTAL_LKR = 81950
export const DEVELOPMENT_FEE_LKR = 60000
export const HOURLY_RATE_LKR = 300 // LKR per hour (Development 60,000 / 200 hrs)

/** Project timeline: 9 weeks from 18 Jan 2026 */
export const PROJECT_START_DATE = '2026-01-18'
export const NUM_WEEKS = 9

/** Week labels with short date (week start) for chart - human-readable */
export const WEEK_LABELS: { week: number; shortDate: string }[] = [
  { week: 1, shortDate: '18 Jan' },
  { week: 2, shortDate: '25 Jan' },
  { week: 3, shortDate: '1 Feb' },
  { week: 4, shortDate: '8 Feb' },
  { week: 5, shortDate: '15 Feb' },
  { week: 6, shortDate: '22 Feb' },
  { week: 7, shortDate: '1 Mar' },
  { week: 8, shortDate: '8 Mar' },
  { week: 9, shortDate: '15 Mar' },
]

/** 1st year estimate budget line items (matches estimate sheet) */
export const BUDGET_ITEMS = [
  { label: 'Development Fee', lkr: 60000 },
  { label: 'Domain Registration', lkr: 2500 },
  { label: 'Web Hosting', lkr: 12000 },
  { label: 'SSL Certificate', lkr: 0 },
  { label: 'Database and Backend', lkr: 0 },
  { label: 'Contingency (10%)', lkr: 7450 },
] as const

/** Phases with budget and hours (labor from Development Fee 60,000) */
export const PHASES = [
  { name: 'Planning & requirements', weeks: '1-2', hours: 10, budgetLkr: 3000 },
  { name: 'Design & setup', weeks: '3', hours: 30, budgetLkr: 9000 },
  { name: 'Development', weeks: '4-8', hours: 150, budgetLkr: 45000 },
  { name: 'Testing', weeks: '9-10', hours: 10, budgetLkr: 3000 },
  { name: 'Deployment & go-live', weeks: '11-12', hours: 0, budgetLkr: 21950 },
] as const

/** Fixed costs (not labor) */
export const FIXED_COSTS = {
  domain: 2500,
  hosting: 12000,
  ssl: 0,
  databaseBackend: 0,
  contingency: 7450,
} as const

/** WBS activities from Gantt: activity name, planned days, actual days (on schedule) */
export const WBS_ACTIVITIES: { no: string; activity: string; plannedDays: number; actualDays: number }[] = [
  { no: '1', activity: 'Project Initiation', plannedDays: 0, actualDays: 0 },
  { no: '1.1', activity: 'Confirm project scope', plannedDays: 2, actualDays: 2 },
  { no: '1.2', activity: 'Identify stakeholders', plannedDays: 2, actualDays: 2 },
  { no: '1.3', activity: 'Prepare WBS + schedule', plannedDays: 3, actualDays: 3 },
  { no: '1.4', activity: 'Baselining', plannedDays: 2, actualDays: 2 },
  { no: '2', activity: 'Content & Planning', plannedDays: 0, actualDays: 0 },
  { no: '2.1', activity: 'Finalize page lists', plannedDays: 2, actualDays: 2 },
  { no: '2.2', activity: 'Collect website content', plannedDays: 3, actualDays: 3 },
  { no: '2.3', activity: 'Define features', plannedDays: 3, actualDays: 3 },
  { no: '2.4', activity: 'Define basic design guidelines', plannedDays: 5, actualDays: 5 },
  { no: '3', activity: 'Design', plannedDays: 0, actualDays: 0 },
  { no: '3.1', activity: 'Design Phase 1', plannedDays: 3, actualDays: 3 },
  { no: '3.2', activity: 'Use Case diagram', plannedDays: 2, actualDays: 2 },
  { no: '3.3', activity: 'Database / ER design', plannedDays: 4, actualDays: 4 },
  { no: '3.4', activity: 'Design Phase 2', plannedDays: 3, actualDays: 3 },
  { no: '3.5', activity: 'Wireframes', plannedDays: 5, actualDays: 5 },
  { no: '3.6', activity: 'Final UI design (responsive)', plannedDays: 5, actualDays: 5 },
  { no: '4', activity: 'Development', plannedDays: 0, actualDays: 0 },
  { no: '4.1', activity: 'Sprint 1: Project setup (app, DB), Core Pages', plannedDays: 14, actualDays: 14 },
  { no: '4.2', activity: 'Sprint 2: Product Catalog, Search & filter, Product Details', plannedDays: 10, actualDays: 10 },
  { no: '4.3', activity: 'Sprint 3: Inquiry & custom order forms, Anti-spam', plannedDays: 7, actualDays: 7 },
  { no: '4.4', activity: 'Sprint 4: Auth (OTP), Profile, AI chatbot foundation, Live chat, Admin', plannedDays: 14, actualDays: 14 },
  { no: '4.5', activity: 'Sprint 5: AI chatbot logic & escalation, Final Feedback', plannedDays: 7, actualDays: 7 },
  { no: '5', activity: 'Integration & Data Setup', plannedDays: 0, actualDays: 0 },
  { no: '5.1', activity: 'Product data entry', plannedDays: 3, actualDays: 3 },
  { no: '5.2', activity: 'Admin access setup', plannedDays: 2, actualDays: 2 },
  { no: '6', activity: 'Testing & Evaluation', plannedDays: 0, actualDays: 0 },
  { no: '6.1', activity: 'Testing (Unit, System)', plannedDays: 5, actualDays: 5 },
  { no: '6.2', activity: 'Evaluation (Acceptance, feedback)', plannedDays: 5, actualDays: 5 },
  { no: '7', activity: 'Deployment & Documentation', plannedDays: 0, actualDays: 0 },
  { no: '7.1', activity: 'Deployment (environments)', plannedDays: 3, actualDays: 3 },
  { no: '7.2', activity: 'User guide / Admin guide', plannedDays: 5, actualDays: 5 },
  { no: '7.3', activity: 'Documentation', plannedDays: 5, actualDays: 5 },
  { no: '7.4', activity: 'Final project report', plannedDays: 29, actualDays: 29 },
]

/** Week-by-week cumulative BCWS (Budgeted Cost of Work Scheduled) - 9 weeks */
export const BCWS_BY_WEEK: number[] = [
  2500, 5500, 9500, 16000, 26000, 38000, 50000, 65000, 81950,
]

/** Actual Cost of Work Performed - 9 weeks (slightly over in middle, then aligned) */
export const ACWP_BY_WEEK: number[] = [
  2500, 6000, 10000, 17000, 27000, 39500, 51500, 66500, 81950,
]

/** Budgeted Cost of Work Performed (earned value) - 9 weeks */
export const BCWP_BY_WEEK: number[] = [
  2500, 5500, 9800, 16500, 26500, 38500, 50500, 65500, 81950,
]

/** Current period: end of Week 6 (22 Feb 2026) */
export const CURRENT_WEEK = 6

/** Simple week labels for tables */
export const LABEL_WEEKS = WEEK_LABELS.map((w) => `W${w.week}`)

