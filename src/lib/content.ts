// Types and loaders for the lesson files written by `npm run content`.

export type Block =
  | { type: 'text'; title?: string; paragraphs: string[] }
  | { type: 'key_rule'; title?: string; text: string }
  | { type: 'tip'; title?: string; text: string }
  | { type: 'table'; title?: string; header: string[]; rows: string[][] }
  | { type: 'examples'; title?: string; items: { ok: boolean; text: string }[] }
  | { type: 'steps'; title?: string; steps: string[] };

export interface Section {
  id: string;
  title: string;
  label: string;
  blocks: Block[];
}

export interface Card {
  no: number;
  front: string;
  options: string[];
  answer: string;
  why: string;
}

export interface DrillError {
  id: string;
  sentence: number;
  start: number;
  end: number;
  wrongText: string;
  fixes: string[];
  hint: string;
  explanation: string;
  isReview: boolean;
}

export interface DrillBlank {
  id: string;
  token: string;
  sentence: number;
  answers: string[];
  hint: string;
}

export interface Drill {
  no: number;
  id: string;
  title: string;
  topic: string;
  level: 'Guided' | 'Supported' | 'Independent';
  instruction: string;
  /** sp[i] is 1 when the original text has a space before token i */
  sentences: { no: number; tokens: string[]; sp: number[] }[];
  errors: DrillError[];
  blanks: DrillBlank[];
}

export interface FurtherLink {
  type: string;
  title: string;
  url: string;
  description: string;
}

export interface UnitContent {
  version: string;
  tag: string;
  name: string;
  slug: string;
  order: number;
  summary: string;
  sections: Section[];
  furtherStudy: FurtherLink[];
  cards: Card[];
  drills: Drill[];
}

export interface UnitSummary {
  tag: string;
  name: string;
  slug: string;
  order: number;
  summary: string;
  sectionCount: number;
  cardCount: number;
  errorsTotal: number;
  drills: { no: number; title: string; errors: number }[];
}

export interface ContentIndex {
  version: string;
  units: UnitSummary[];
  appText: Record<string, string>;
}

const BASE = '/content/grammar';
let indexPromise: Promise<ContentIndex> | null = null;
const unitCache = new Map<string, Promise<UnitContent>>();

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return (await res.json()) as T;
}

export function loadIndex(): Promise<ContentIndex> {
  if (!indexPromise) {
    indexPromise = getJson<ContentIndex>(`${BASE}/index.json`).catch((e) => {
      indexPromise = null;
      throw e;
    });
  }
  return indexPromise;
}

/** Students download only the unit they open. */
export function loadUnit(tag: string): Promise<UnitContent> {
  let p = unitCache.get(tag);
  if (!p) {
    p = getJson<UnitContent>(`${BASE}/${tag}.json`).catch((e) => {
      unitCache.delete(tag);
      throw e;
    });
    unitCache.set(tag, p);
  }
  return p;
}
