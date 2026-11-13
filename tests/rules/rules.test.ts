// Security-rules tests (CLAUDE.md 3.3). Run with: npm run test:rules
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
// @ts-expect-error plain JS module
import { makeRules } from '../../scripts/rules-template.mjs';

let env: RulesTestEnvironment;

const student = (uid: string, email: string) => ({
  name: 'Test Student',
  email,
  createdAt: 1,
  lastSeenAt: 1,
  emailOptIn: false,
  emailOptInAt: null,
  tourDone: false,
  settings: { font: 'inter', textSize: 100, dark: false },
  streak: { count: 0, lastDay: '' },
  last: null,
  grammar: {},
  uid,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-fluently-rules',
    firestore: { rules: makeRules(['admin@example.com']), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/bob'), student('bob', 'bob@example.com'));
  });
});

const as = (uid: string, email: string) =>
  env.authenticatedContext(uid, { email, email_verified: true }).firestore();

describe('students', () => {
  it('can create, read and update their own document', async () => {
    const db = as('amy', 'amy@example.com');
    await assertSucceeds(setDoc(doc(db, 'users/amy'), student('amy', 'amy@example.com')));
    await assertSucceeds(getDoc(doc(db, 'users/amy')));
    await assertSucceeds(updateDoc(doc(db, 'users/amy'), { 'grammar.SVA.cardsTurned': [1, 2] }));
  });
  it('cannot read or write another student', async () => {
    const db = as('amy', 'amy@example.com');
    await assertFails(getDoc(doc(db, 'users/bob')));
    await assertFails(setDoc(doc(db, 'users/bob'), student('bob', 'bob@example.com')));
    await assertFails(updateDoc(doc(db, 'users/bob'), { name: 'Hacked' }));
  });
  it('cannot list all students', async () => {
    await assertFails(getDocs(collection(as('amy', 'amy@example.com'), 'users')));
  });
  it('cannot use someone else’s email or change their email later', async () => {
    const db = as('amy', 'amy@example.com');
    await assertFails(setDoc(doc(db, 'users/amy'), student('amy', 'someone@example.com')));
    await assertSucceeds(setDoc(doc(db, 'users/amy'), student('amy', 'amy@example.com')));
    await assertFails(updateDoc(doc(db, 'users/amy'), { email: 'other@example.com' }));
  });
  it('cannot save a name longer than 30 characters', async () => {
    const db = as('amy', 'amy@example.com');
    await assertFails(setDoc(doc(db, 'users/amy'), { ...student('amy', 'amy@example.com'), name: 'x'.repeat(31) }));
  });
  it('cannot delete their document', async () => {
    const { deleteDoc } = await import('firebase/firestore');
    await assertFails(deleteDoc(doc(as('bob', 'bob@example.com'), 'users/bob')));
  });
});

describe('visitors who are not signed in', () => {
  it('cannot read anything', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/bob')));
    await assertFails(getDocs(collection(db, 'users')));
  });
});

describe('admins', () => {
  it('can read and list all students', async () => {
    const db = as('tonim', 'admin@example.com');
    await assertSucceeds(getDoc(doc(db, 'users/bob')));
    await assertSucceeds(getDocs(collection(db, 'users')));
  });
  it('cannot change a student’s data', async () => {
    const db = as('tonim', 'admin@example.com');
    await assertFails(updateDoc(doc(db, 'users/bob'), { name: 'Changed' }));
  });
  it('need a verified email', async () => {
    const db = env.authenticatedContext('fake', { email: 'admin@example.com', email_verified: false }).firestore();
    await assertFails(getDocs(collection(db, 'users')));
  });
});
