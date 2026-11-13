// Writes firestore.rules from fluently.config.json, so the admin list lives in one place.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRules } from './rules-template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'fluently.config.json'), 'utf8'));
const admins = (cfg.adminEmails || []).map((e) => String(e).toLowerCase().trim()).filter(Boolean);

fs.writeFileSync(path.join(ROOT, 'firestore.rules'), makeRules(admins));
console.log(`firestore.rules written (${admins.length} admin email${admins.length === 1 ? '' : 's'}).`);
