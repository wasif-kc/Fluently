import { describe, it, expect } from 'vitest';
import { streakAfterFinish, streakToShow, dashboardStats, unitStats, mergeAttempt, drillUnlocked, deepMerge } from '../src/lib/progress';
import type { UnitSummary } from '../src/lib/content';

const unit = (tag: string, order: number, errs: number[]): UnitSummary => ({
  tag, name: tag, slug: tag.toLowerCase(), order, summary: '', sectionCount: 5, cardCount: 10,
  errorsTotal: errs.reduce((a, b) => a + b, 0),
  drills: errs.map((e, i) => ({ no: i + 1, title: `Drill ${i + 1}`, errors: e })),
});
const rec = (fixed: number, total: number) => mergeAttempt(undefined, { errorsFixed: fixed, errorsTotal: total, blanksCorrect: 1, blanksTotal: 2, timeSec: 60, hintsUsed: 0 });

describe('streak (CLAUDE.md 5)', () => {
  it('starts, grows, stays and resets', () => {
    expect(streakAfterFinish(undefined, '2026-11-13')).toEqual({ count: 1, lastDay: '2026-11-13' });
    expect(streakAfterFinish({ count: 3, lastDay: '2026-11-12' }, '2026-11-13')).toEqual({ count: 4, lastDay: '2026-11-13' });
    expect(streakAfterFinish({ count: 3, lastDay: '2026-11-13' }, '2026-11-13')).toEqual({ count: 3, lastDay: '2026-11-13' });
    expect(streakAfterFinish({ count: 3, lastDay: '2026-11-10' }, '2026-11-13')).toEqual({ count: 1, lastDay: '2026-11-13' });
    expect(streakAfterFinish({ count: 5, lastDay: '2026-02-28' }, '2026-03-01').count).toBe(6);
  });
  it('shows 0 when the last day is before yesterday', () => {
    expect(streakToShow({ count: 4, lastDay: '2026-11-12' }, '2026-11-13')).toBe(4);
    expect(streakToShow({ count: 4, lastDay: '2026-11-11' }, '2026-11-13')).toBe(0);
  });
});

describe('dashboard stats', () => {
  const units = [unit('SVA', 1, [2, 2, 3]), unit('ART', 2, [2, 2])];
  it('shows dashes before any drill is finished', () => {
    expect(dashboardStats(units, {})).toEqual({ drillsCompleted: 0, errorsPercent: null, weakest: null });
  });
  it('counts finished drills only, errors only, and picks the weakest unit', () => {
    const s = dashboardStats(units, {
      SVA: { drills: { '1': rec(2, 2), '2': rec(1, 2) } },
      ART: { drills: { '1': rec(1, 2) } },
    });
    expect(s.drillsCompleted).toBe(3);
    expect(s.errorsPercent).toBe(67);
    expect(s.weakest?.tag).toBe('ART');
  });
  it('breaks ties by unit order', () => {
    const s = dashboardStats(units, { SVA: { drills: { '1': rec(1, 2) } }, ART: { drills: { '1': rec(1, 2) } } });
    expect(s.weakest?.tag).toBe('SVA');
  });
});

describe('unit status and unlocking', () => {
  const u = unit('SVA', 1, [2, 2]);
  it('walks through the status lines', () => {
    expect(unitStats(u, undefined).status).toBe('start');
    expect(unitStats(u, { sectionsRead: ['Introduction'] }).status).toBe('warmup');
    expect(unitStats(u, { cardsTurned: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }).status).toBe('unlocked');
    expect(unitStats(u, { drills: { '1': rec(1, 2) } }).status).toBe('drills');
    const done = unitStats(u, { drills: { '1': rec(1, 2), '2': rec(2, 2) } });
    expect(done.status).toBe('done');
    expect(done.percent).toBe(75);
  });
  it('unlocks drills in order after the warm-up', () => {
    expect(drillUnlocked(1, false, {})).toBe(false);
    expect(drillUnlocked(1, true, {})).toBe(true);
    expect(drillUnlocked(2, true, {})).toBe(false);
    expect(drillUnlocked(2, true, { drills: { '1': rec(0, 2) } })).toBe(true);
  });
  it('keeps the best score and counts attempts', () => {
    const a = rec(2, 2);
    const b = mergeAttempt(a, { errorsFixed: 0, errorsTotal: 2, blanksCorrect: 2, blanksTotal: 2, timeSec: 30, hintsUsed: 1 });
    expect(b).toMatchObject({ bestErrorsFixed: 2, bestBlanksCorrect: 2, attempts: 2, bestTimeSec: 30, lastHintsUsed: 1 });
  });
  it('deep merges nested progress', () => {
    expect(deepMerge({ a: { b: 1, c: [1] } }, { a: { c: [2] } })).toEqual({ a: { b: 1, c: [2] } });
  });
});
