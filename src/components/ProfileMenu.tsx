import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../state/user';
import { useAuth } from '../state/auth';
import { useT } from '../lib/text';
import { IconCaret, IconPencil } from './Icons';
import { Switch } from './Switch';
import type { FontId } from '../lib/progress';

const FONTS: { id: FontId; label: string; family: string }[] = [
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif" },
  { id: 'opensans', label: 'Open Sans', family: "'Open Sans', sans-serif" },
  { id: 'georgia', label: 'Georgia', family: "Georgia, 'Times New Roman', serif" },
  { id: 'atkinson', label: 'Atkinson', family: "'Atkinson Hyperlegible', sans-serif" },
];

/** The dropdown under the student's name: name, display settings, dark mode, emails, privacy, sign out. */
export function ProfileMenu() {
  const t = useT();
  const { data, email, update, flush, settings, setSettings } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const name = data?.name || '';
  const initial = (name.trim()[0] || '?').toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setEditing(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const saveName = () => {
    const v = draft.trim().slice(0, 30);
    if (v && v !== name) update({ name: v });
    setEditing(false);
  };

  const doSignOut = async () => {
    setOpen(false);
    await flush();
    await signOut();
    navigate('/');
  };

  const size = settings.textSize;

  return (
    <div className="profile" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className="profile__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${name}. ${t('menu.open')}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden>{initial}</span>
        <span className="profile__name">{name}</span>
        <IconCaret size={14} className={`profile__caret${open ? ' profile__caret--open' : ''}`} />
      </button>

      {open && (
        <div className="menu" role="group" aria-label={t('menu.open')}>
          <div className="menu__who">
            <div className="menu__name">{name}</div>
            <div className="menu__email">{email}</div>
          </div>

          <div className="menu__section">
            {editing ? (
              <form
                className="menu__edit"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
              >
                <label htmlFor="menu-name" className="menu__label">{t('menu.name')}</label>
                <input
                  id="menu-name"
                  className="input"
                  value={draft}
                  maxLength={30}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className="menu__edit-actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(false)}>
                    {t('menu.cancel')}
                  </button>
                  <button type="submit" className="btn btn--primary btn--sm" disabled={!draft.trim()}>
                    {t('menu.save')}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="menu__link menu__link--teal"
                onClick={() => {
                  setDraft(name);
                  setEditing(true);
                }}
              >
                <span>{t('menu.edit_name')}</span>
                <IconPencil size={16} />
              </button>
            )}
          </div>

          <div className="menu__section">
            <div className="menu__heading">{t('menu.display')}</div>
            <div className="menu__fonts" role="radiogroup" aria-label={t('menu.font')}>
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={settings.font === f.id}
                  className={`font-btn${settings.font === f.id ? ' font-btn--on' : ''}`}
                  style={{ fontFamily: f.family }}
                  onClick={() => setSettings({ font: f.id })}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="menu__size">
              <button
                type="button"
                className="size-btn"
                aria-label={t('menu.smaller')}
                disabled={size <= 90}
                onClick={() => setSettings({ textSize: Math.max(90, size - 10) })}
              >
                A−
              </button>
              <span className="menu__size-label" aria-live="polite">{t('menu.text_size', { n: size })}</span>
              <button
                type="button"
                className="size-btn"
                aria-label={t('menu.bigger')}
                disabled={size >= 130}
                onClick={() => setSettings({ textSize: Math.min(130, size + 10) })}
              >
                A+
              </button>
            </div>
          </div>

          <div className="menu__row">
            <label htmlFor="menu-dark">{t('menu.dark')}</label>
            <Switch id="menu-dark" checked={settings.dark} onChange={(v) => setSettings({ dark: v })} label={t('menu.dark')} />
          </div>
          <div className="menu__row">
            <label htmlFor="menu-emails">{t('menu.emails')}</label>
            <Switch
              id="menu-emails"
              checked={Boolean(data?.emailOptIn)}
              onChange={(v) => update({ emailOptIn: v, emailOptInAt: Date.now() })}
              label={t('menu.emails')}
            />
          </div>

          <div className="menu__section menu__section--last">
            <Link to="/privacy" className="menu__link" onClick={() => setOpen(false)}>
              {t('menu.privacy')}
            </Link>
          </div>
          <button type="button" className="menu__signout" onClick={doSignOut}>
            {t('menu.signout')}
          </button>
        </div>
      )}
    </div>
  );
}
