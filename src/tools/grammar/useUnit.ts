import { useCallback, useEffect, useState } from 'react';
import { loadUnit, type UnitContent, type UnitSummary } from '../../lib/content';
import { useContent } from '../../state/content';
import { useUser } from '../../state/user';
import type { PageKind } from '../../lib/progress';

/** Loads one unit's lesson file (students download only the unit they open). */
export function useUnitContent(slug: string | undefined) {
  const { unitBySlug } = useContent();
  const summary = unitBySlug(slug);
  const [unit, setUnit] = useState<UnitContent | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!summary) return;
    let live = true;
    setFailed(false);
    loadUnit(summary.tag)
      .then((u) => live && setUnit(u))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [summary, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { summary, unit: unit && summary && unit.tag === summary.tag ? unit : null, failed, retry };
}

/** Remember the last page visited, for "Pick up where you left off" and the topic cards. */
export function useTrackVisit(summary: UnitSummary | undefined, page: PageKind, drill?: number) {
  const { data, update } = useUser();
  const tag = summary?.tag;
  useEffect(() => {
    if (!tag || !data) return;
    const last = data.last;
    const p = data.grammar?.[tag];
    const same =
      last?.unit === tag &&
      last.page === page &&
      (page !== 'drill' || last.drill === drill) &&
      p?.lastPage === page &&
      (page !== 'drill' || p?.lastDrill === drill);
    if (same) return;
    const lastVal: Record<string, unknown> = { tool: 'grammar', unit: tag, page };
    if (page === 'drill') lastVal.drill = drill;
    const unitPatch: Record<string, unknown> = { lastPage: page };
    if (page === 'drill') unitPatch.lastDrill = drill;
    update({ last: lastVal, grammar: { [tag]: unitPatch } }, { delayMs: 1500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, page, drill, Boolean(data)]);
}
