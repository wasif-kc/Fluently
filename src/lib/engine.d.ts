export const TOKEN_RE: RegExp;
export const BLANK_RE: RegExp;

export interface Edit {
  sentence: number;
  start: number;
  end: number;
  text: string;
}

export interface EngineError {
  id: string;
  sentence: number;
  start: number;
  end: number;
  fixes: string[];
}

export interface EngineBlank {
  id: string;
  token: string;
  sentence: number;
  answers: string[];
}

export interface EngineDrill<E extends EngineError = EngineError, B extends EngineBlank = EngineBlank> {
  sentences: { no: number; tokens: string[] }[];
  errors: E[];
  blanks: B[];
}

export interface ErrorGrade {
  status: 'fixed' | 'wrong' | 'missed';
  studentText: string | null;
  regionStart: number;
  regionEnd: number;
  edits: { start: number; end: number; text: string }[];
}

export type GradeItem<E extends EngineError = EngineError, B extends EngineBlank = EngineBlank> =
  | { kind: 'error'; id: string; sentence: number; pos: number; result: ErrorGrade; item: E }
  | { kind: 'blank'; id: string; sentence: number; pos: number; answer: string; correct: boolean; item: B }
  | { kind: 'unneeded'; id: string; sentence: number; pos: number; original: string; text: string; edit: Edit };

export interface DrillGrade<E extends EngineError = EngineError, B extends EngineBlank = EngineBlank> {
  items: GradeItem<E, B>[];
  correct: number;
  total: number;
  errorsFixed: number;
  errorsTotal: number;
  blanksCorrect: number;
  blanksTotal: number;
}

export function tokenize(text: string): string[];
export function isBlankToken(tok: string): boolean;
export function isPunctToken(tok: string): boolean;
export function spaceBefore(tokens: string[], i: number): boolean;
export function joinTokens(tokens: string[]): string;
export function normalize(text: string): string;
export function compareKey(text: string): string;
export function sameAnswer(a: string, b: string): boolean;
export function splitList(value: string): string[];
export function splitSentences(paragraph: string): { no: number; text: string }[];
export function findTokenMatches(tokens: string[], needle: string[]): number[];
export function gradeError(
  tokens: string[],
  error: { start: number; end: number; fixes: string[] },
  edits: { start: number; end: number; text: string }[],
): ErrorGrade;
export function gradeBlank(answer: string, accepted: string[]): boolean;
export function gradeDrill<E extends EngineError, B extends EngineBlank>(
  drill: EngineDrill<E, B>,
  state: { edits: Edit[]; blanks: Record<string, string> },
): DrillGrade<E, B>;
export function firstUnfixedError<E extends EngineError>(
  drill: EngineDrill<E, EngineBlank>,
  edits: Edit[],
): E | null;
