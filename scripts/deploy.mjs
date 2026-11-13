// npm run deploy
// Checks the content, runs the tests, builds the website and publishes it to Firebase Hosting.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'fluently.config.json'), 'utf8'));
const projectId = cfg.firebase?.projectId;

if (!projectId || !cfg.firebase?.apiKey) {
  console.error('\nThe Firebase project is not set yet in fluently.config.json, so the site cannot be published.\n');
  process.exit(1);
}

const win = process.platform === 'win32';
function step(label, cmd, args) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: win });
  if (r.status !== 0) {
    console.error(`\n✗ Stopped at "${label}". Nothing was published.\n`);
    process.exit(r.status ?? 1);
  }
}

step('Checking and updating the content', 'node', ['scripts/build-content.mjs']);
step('Running the answer-checking tests', 'npx', ['vitest', 'run']);
step('Writing the security rules', 'node', ['scripts/write-rules.mjs']);
step('Building the website', 'npx', ['tsc', '-p', 'tsconfig.json']);
step('Building the website', 'npx', ['vite', 'build']);
step('Publishing to Firebase', 'npx', ['firebase', 'deploy', '--only', 'hosting,firestore:rules', '--project', projectId, '--non-interactive']);
console.log(`\n✓ Published. Open https://${projectId}.web.app\n`);
