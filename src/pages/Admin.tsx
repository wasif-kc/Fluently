import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Layout } from '../components/Layout';
import { Spinner } from '../components/LoadError';
import { NotFound } from './NotFound';
import { useUser } from '../state/user';
import { useContent } from '../state/content';
import { ADMIN_EMAILS } from '../config';
import type { UserDoc } from '../lib/progress';

const DAY = 24 * 60 * 60 * 1000;

function weekStart(ms: number): Date {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

const fmtDate = (ms: number | null | undefined) =>
  ms ? new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function csvCell(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v; // stop spreadsheet formulas
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Tonim's page: numbers for the market test and the opted-in email list (CLAUDE.md 3.5). */
export default function Admin() {
  const { email } = useUser();
  const { index } = useContent();
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  const [users, setUsers] = useState<UserDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!db) return;
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map((d) => d.data() as UserDoc));
    } catch {
      setError('Could not load students. Check that your email is in the admin list and that the security rules have been published.');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const stats = useMemo(() => {
    if (!users || !index) return null;
    const now = Date.now();
    const weeks: { label: string; start: number; count: number }[] = [];
    const thisWeek = weekStart(now).getTime();
    for (let i = 7; i >= 0; i--) {
      const start = thisWeek - i * 7 * DAY;
      weeks.push({ label: fmtDate(start), start, count: 0 });
    }
    for (const u of users) {
      const ws = u.createdAt ? weekStart(u.createdAt).getTime() : 0;
      const w = weeks.find((x) => x.start === ws);
      if (w) w.count += 1;
    }
    const active7 = users.filter((u) => u.lastSeenAt && now - u.lastSeenAt <= 7 * DAY).length;
    const active30 = users.filter((u) => u.lastSeenAt && now - u.lastSeenAt <= 30 * DAY).length;
    const units = [...index.units].sort((a, b) => a.order - b.order).map((unit) => {
      let drills = 0;
      let fixed = 0;
      let total = 0;
      let students = 0;
      for (const u of users) {
        const recs = Object.values(u.grammar?.[unit.tag]?.drills ?? {}).filter((r) => r?.done);
        if (recs.length) students += 1;
        drills += recs.length;
        for (const r of recs) {
          fixed += r.bestErrorsFixed;
          total += r.errorsTotal;
        }
      }
      return { name: unit.name, drills, students, avg: total ? Math.round((fixed / total) * 100) : null };
    });
    const optedIn = users
      .filter((u) => u.emailOptIn === true && u.email)
      .sort((a, b) => (b.emailOptInAt ?? 0) - (a.emailOptInAt ?? 0));
    return { total: users.length, weeks, active7, active30, units, optedIn };
  }, [users, index]);

  if (!isAdmin) return <NotFound />;

  const downloadCsv = () => {
    if (!stats) return;
    const rows = [['name', 'email', 'opted_in_on'], ...stats.optedIn.map((u) => [u.name, u.email, u.emailOptInAt ? new Date(u.emailOptInAt).toISOString().slice(0, 10) : ''])];
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fluently-email-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Layout howto="Only admins can see this page. Numbers update when you press Refresh.">
      <div className="admin">
        <div className="admin__head">
          <h1>Admin</h1>
          <button type="button" className="btn btn--outline" onClick={() => void load()}>
            Refresh
          </button>
        </div>
        {error && <p className="landing__error" role="alert">{error}</p>}
        {!stats && !error && <Spinner />}
        {stats && (
          <>
            <div className="admin__cards">
              <div className="admin__card">
                <div className="admin__num">{stats.total}</div>
                <div>Total students</div>
              </div>
              <div className="admin__card">
                <div className="admin__num">{stats.active7}</div>
                <div>Active in the last 7 days</div>
              </div>
              <div className="admin__card">
                <div className="admin__num">{stats.active30}</div>
                <div>Active in the last 30 days</div>
              </div>
              <div className="admin__card">
                <div className="admin__num">{stats.optedIn.length}</div>
                <div>Opted in to emails</div>
              </div>
            </div>

            <section className="admin__section">
              <h2>New students per week</h2>
              <div className="bars" role="table" aria-label="New students per week">
                {stats.weeks.map((w) => {
                  const max = Math.max(1, ...stats.weeks.map((x) => x.count));
                  return (
                    <div key={w.start} className="bars__row" role="row">
                      <span role="cell" className="bars__label">Week of {w.label}</span>
                      <span role="cell" className="bars__track">
                        <span className="bars__fill" style={{ width: `${(w.count / max) * 100}%` }} />
                      </span>
                      <span role="cell" className="bars__n">{w.count}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="admin__section">
              <h2>By unit</h2>
              <div className="rb-table-wrap">
                <table className="rb-table">
                  <thead>
                    <tr>
                      <th scope="col">Unit</th>
                      <th scope="col">Students with a finished drill</th>
                      <th scope="col">Drills completed</th>
                      <th scope="col">Average best score (errors fixed)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.units.map((u) => (
                      <tr key={u.name}>
                        <td>{u.name}</td>
                        <td>{u.students}</td>
                        <td>{u.drills}</td>
                        <td>{u.avg === null ? '—' : `${u.avg}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin__section">
              <div className="admin__head">
                <h2>Students who agreed to emails ({stats.optedIn.length})</h2>
                <button type="button" className="btn btn--primary" onClick={downloadCsv} disabled={!stats.optedIn.length}>
                  Download CSV
                </button>
              </div>
              <p className="muted">Only students who ticked “Send me new lessons and updates by email” are listed.</p>
              <div className="rb-table-wrap">
                <table className="rb-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Opted in on</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.optedIn.map((u) => (
                      <tr key={u.email}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{fmtDate(u.emailOptInAt)}</td>
                      </tr>
                    ))}
                    {!stats.optedIn.length && (
                      <tr>
                        <td colSpan={3}>No one yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
