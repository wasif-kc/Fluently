// Student progress: data shapes and the rules from CLAUDE.md section 5.
import type { UnitSummary } from './content';
import { localDay, previousDay } from './dates';

export type FontId = 'inter' | 'opensans' | 'georgia' | 'atkinson';
export type PageKind = 'rules' | 'warmup' | 'drill';

export interface Settings {
  font: FontId;
  textSize: number;
  dark: boolean;
}

export interface DrillRecord {
  done: boolean;
  bestErrorsFixed: number;
  errorsTotal: number;
  bestBlanksCorrect: number;
  blanksTotal: number;
  attempts: number;
  bestTimeSec: number;
  lastTimeSec: number;
  lastHintsUsed: number;
  lastDoneAt: number;
}

export interface UnitProgress {
  sectionsRead?: string[];
  cardsTurned?: number[];
  drills?: Record<string, DrillRecord>;
  lastPage?: PageKind;
  lastSection?: string;
  lastDrill?: number;
}

export interface UserDoc {
  name: string;
  email: string;
  createdAt: number;
  lastSeenAt: number;
  emailOptIn: boolean;
  emailOptInAt: number | null;
  tourDone: boolean;
  settings: Settings;
  streak: { count: number; lastDay: string };
  last: { tool: string; unit: string; page: PageKind; drill?: number } | null;
  grammar: Record<string, UnitProgress>;
}

export const DEFAULT_SETTINGS: Settings = { font: 'inter', textSize: 100, dark: false };

export type UnitStatus = 'start' | 'warmup' | 'unlocked' | 'drills' | 'done';

export interface UnitStats {
  bestFixed: number;
  errorsTotal: number;
  percent: number;
  drillsDone: number;
  drillsTotal: number;
  cardsTurned: number;
  sectionsRead: number;
  status: UnitStatus;
}

export function unitStats(unit: UnitSummary, p: UnitProgress | undefined): UnitStats {
  const drills = p?.drills ?? {};
  let bestFixed = 0;
  let drillsDone = 0;
  for (const d of unit.drills) {
    const rec = drills[String(d.no)];
    if (rec?.done) {
      drillsDone += 1;
      bestFixed += Math.min(rec.bestErrorsFixed, d.errors);
    }
  }
  const cardsTurned = p?.cardsTurned?.length ?? 0;
  const sectionsRead = p?.sectionsRead?.length ?? 0;
  const drillsTotal = unit.drills.length;
  let status: UnitStatus = 'start';
  if (drillsTotal > 0 && drillsDone >= drillsTotal) status = 'done';
  else if (drillsDone > 0) status = 'drills';
  else if (cardsTurned >= unit.cardCount && unit.cardCount > 0) status = 'unlocked';
  else if (sectionsRead > 0 || cardsTurned > 0) status = 'warmup';
  const percent = unit.errorsTotal ? Math.round((bestFixed / unit.errorsTotal) * 100) : 0;
  return { bestFixed, errorsTotal: unit.errorsTotal, percent, drillsDone, drillsTotal, cardsTurned, sectionsRead, status };
}

export interface DashboardStats {
  drillsCompleted: number;
  errorsPercent: number | null;
  weakest: UnitSummary | null;
}

/** Progress block stats: errors only, finished drills only (CLAUDE.md 5). */
export function dashboardStats(units: UnitSummary[], grammar: Record<string, UnitProgress> | undefined): DashboardStats {
  let drillsCompleted = 0;
  let fixed = 0;
  let total = 0;
  let weakest: UnitSummary | null = null;
  let weakestPct = Infinity;
  const ordered = [...units].sort((a, b) => a.order - b.order);
  for (const u of ordered) {
    const drills = grammar?.[u.tag]?.drills ?? {};
    let uf = 0;
    let ut = 0;
    let done = 0;
    for (const d of u.drills) {
      const rec = drills[String(d.no)];
      if (!rec?.done) continue;
      done += 1;
      uf += Math.min(rec.bestErrorsFixed, d.errors);
      ut += d.errors;
    }
    drillsCompleted += done;
    fixed += uf;
    total += ut;
    if (done > 0) {
      const pct = ut ? uf / ut : 1;
      if (pct < weakestPct) {
        weakestPct = pct;
        weakest = u;
      }
    }
  }
  return { drillsCompleted, errorsPercent: total ? Math.round((fixed / total) * 100) : null, weakest };
}

/** New streak after finishing a drill today (student's local date). */
export function streakAfterFinish(streak: UserDoc['streak'] | undefined, today = localDay()): UserDoc['streak'] {
  if (!streak?.lastDay || !streak.count) return { count: 1, lastDay: today };
  if (streak.lastDay === today) return streak;
  if (streak.lastDay === previousDay(today)) return { count: streak.count + 1, lastDay: today };
  return { count: 1, lastDay: today };
}

/** The streak to show: 0 if the last finished day is before yesterday. */
export function streakToShow(streak: UserDoc['streak'] | undefined, today = localDay()): number {
  if (!streak?.lastDay) return 0;
  if (streak.lastDay === today || streak.lastDay === previousDay(today)) return streak.count || 0;
  return 0;
}

export function warmupDone(unit: { cardCount?: number; cards?: unknown[] }, p: UnitProgress | undefined): boolean {
  const need = unit.cardCount ?? unit.cards?.length ?? 10;
  return (p?.cardsTurned?.length ?? 0) >= need && need > 0;
}

/** Drills open after all warm-up cards are turned, then one by one (CLAUDE.md 5). */
export function drillUnlocked(no: number, warmup: boolean, p: UnitProgress | undefined): boolean {
  if (!warmup) return false;
  if (no <= 1) return true;
  return Boolean(p?.drills?.[String(no - 1)]?.done);
}

/** The first unfinished drill, or the last drill if all are done. */
export function firstOpenDrill(drillNos: number[], p: UnitProgress | undefined): number {
  for (const n of drillNos) if (!p?.drills?.[String(n)]?.done) return n;
  return drillNos[drillNos.length - 1] ?? 1;
}

/** Keep the best score for each drill and count attempts. */
export function mergeAttempt(
  prev: DrillRecord | undefined,
  a: { errorsFixed: number; errorsTotal: number; blanksCorrect: number; blanksTotal: number; timeSec: number; hintsUsed: number },
): DrillRecord {
  return {
    done: true,
    bestErrorsFixed: Math.max(prev?.bestErrorsFixed ?? 0, a.errorsFixed),
    errorsTotal: a.errorsTotal,
    bestBlanksCorrect: Math.max(prev?.bestBlanksCorrect ?? 0, a.blanksCorrect),
    blanksTotal: a.blanksTotal,
    attempts: (prev?.attempts ?? 0) + 1,
    bestTimeSec: prev?.bestTimeSec ? Math.min(prev.bestTimeSec, a.timeSec) : a.timeSec,
    lastTimeSec: a.timeSec,
    lastHintsUsed: a.hintsUsed,
    lastDoneAt: Date.now(),
  };
}

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Deep merge for local state (arrays are replaced, like Firestore merge writes). */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlain(patch)) return (patch === undefined ? base : (patch as T));
  const out: Plain = isPlain(base) ? { ...(base as Plain) } : {};
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlain(v) ? deepMerge(out[k], v) : v;
  }
  return out as T;
}
