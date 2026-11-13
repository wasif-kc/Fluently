import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadIndex, type ContentIndex, type UnitSummary } from '../lib/content';
import { TextProvider } from '../lib/text';

interface ContentState {
  index: ContentIndex | null;
  failed: boolean;
  retry: () => void;
  unitBySlug: (slug: string | undefined) => UnitSummary | undefined;
  unitByTag: (tag: string | undefined) => UnitSummary | undefined;
}

const ContentCtx = createContext<ContentState>({
  index: null,
  failed: false,
  retry: () => {},
  unitBySlug: () => undefined,
  unitByTag: () => undefined,
});

/** Loads the content overview (units and AppText) once for the whole app. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<ContentIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setFailed(false);
    loadIndex()
      .then((i) => live && setIndex(i))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const unitBySlug = useCallback((slug?: string) => index?.units.find((u) => u.slug === slug), [index]);
  const unitByTag = useCallback((tag?: string) => index?.units.find((u) => u.tag === tag), [index]);

  return (
    <ContentCtx.Provider value={{ index, failed, retry, unitBySlug, unitByTag }}>
      <TextProvider appText={index?.appText}>{children}</TextProvider>
    </ContentCtx.Provider>
  );
}

export function useContent(): ContentState {
  return useContext(ContentCtx);
}
