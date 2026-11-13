import type { UnitSummary } from './content';
import type { PageKind, UnitProgress } from './progress';
import { firstOpenDrill } from './progress';

export function unitPath(slug: string, page: PageKind, drill?: number): string {
  if (page === 'drill') return `/grammar/${slug}/drill/${drill ?? 1}`;
  return `/grammar/${slug}/${page === 'warmup' ? 'warmup' : 'rules'}`;
}

/** Where a topic card opens: the page the student was last on in that unit. */
export function cardTarget(unit: UnitSummary, p: UnitProgress | undefined): string {
  const page = p?.lastPage ?? 'rules';
  if (page === 'drill') {
    const nos = unit.drills.map((d) => d.no);
    return unitPath(unit.slug, 'drill', p?.lastDrill ?? firstOpenDrill(nos, p));
  }
  return unitPath(unit.slug, page);
}
