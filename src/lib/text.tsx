import { createContext, Fragment, useContext, type ReactNode } from 'react';
import defaults from './textDefaults.json';

type Vars = Record<string, string | number>;
type T = (id: string, vars?: Vars) => string;

const DEFAULTS = defaults as Record<string, string>;

export function makeT(appText: Record<string, string> | undefined): T {
  return (id, vars) => {
    const raw = appText?.[id] ?? DEFAULTS[id] ?? id;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  };
}

const TextCtx = createContext<T>(makeT(undefined));

export function TextProvider({ appText, children }: { appText?: Record<string, string>; children: ReactNode }) {
  return <TextCtx.Provider value={makeT(appText)}>{children}</TextCtx.Provider>;
}

/** All on-screen wording comes from the AppText sheet, with built-in defaults (CLAUDE.md 2.1, 8). */
export function useT(): T {
  return useContext(TextCtx);
}

/** Fill {placeholders} in a text and show the filled-in values in bold. */
export function richT(template: string, vars: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (m && m[1] in vars) return <strong key={i}>{vars[m[1]]}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}
