import type { Block } from '../lib/content';
import { IconCheck, IconX } from './Icons';

/** Renders rule-page blocks exactly as described in CLAUDE.md 2.1. */
export function RuleBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <RuleBlock key={i} block={b} />
      ))}
    </>
  );
}

function RuleBlock({ block: b }: { block: Block }) {
  switch (b.type) {
    case 'text':
      return (
        <div className="rb-text">
          {b.title && <h3 className="rb-subtitle">{b.title}</h3>}
          {b.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      );
    case 'key_rule':
      return (
        <div className="rb-key">
          {b.title && <div className="rb-key__label">{b.title}</div>}
          <div className="rb-key__text">{b.text}</div>
        </div>
      );
    case 'tip':
      return (
        <aside className="rb-tip">
          {b.title && <div className="rb-tip__label">{b.title}</div>}
          <div>{b.text}</div>
        </aside>
      );
    case 'table':
      return (
        <div className="rb-table-wrap" tabIndex={0} role="region" aria-label={b.title ?? 'Table'}>
          {b.title && <h3 className="rb-subtitle">{b.title}</h3>}
          <table className="rb-table">
            <thead>
              <tr>
                {b.header.map((h, i) => (
                  <th key={i} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'examples':
      return (
        <div className="rb-examples">
          {b.title && <h3 className="rb-subtitle">{b.title}</h3>}
          <ul>
            {b.items.map((it, i) => (
              <li key={i} className={it.ok ? 'ex ex--ok' : 'ex ex--bad'}>
                <span className="ex__icon">{it.ok ? <IconCheck size={16} /> : <IconX size={16} />}</span>
                <span className="sr-only">{it.ok ? 'Correct: ' : 'Incorrect: '}</span>
                <span>{it.text}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'steps':
      return (
        <div className="rb-steps">
          {b.title && <h3 className="rb-subtitle">{b.title}</h3>}
          <ol>
            {b.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      );
    default:
      return null;
  }
}
