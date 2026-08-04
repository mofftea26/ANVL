#!/usr/bin/env node
/**
 * Doc-freshness gate.
 *
 * Maps a set of changed files onto the docs that CLAUDE.md's "Documentation
 * Maintenance Rules" say must move with them. If code changed and its doc did
 * not, this reports the specific doc to update — never a vague "update docs".
 *
 * Used by two callers:
 *   .githooks/pre-commit          → advisory, prints and lets the commit through
 *   .claude/settings.json hook    → blocking, stops Claude committing stale docs
 *
 * Usage:
 *   node scripts/check-docs-freshness.mjs           # inspect the staged diff
 *   node scripts/check-docs-freshness.mjs --working # staged + unstaged + untracked
 *   node scripts/check-docs-freshness.mjs --json    # machine-readable
 *
 * Exit codes: 0 = satisfied (or nothing relevant changed), 1 = docs missing.
 * Set ANVL_SKIP_DOC_CHECK=1 to bypass.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const useWorkingTree = args.has('--working');
const asJson = args.has('--json');

if (process.env.ANVL_SKIP_DOC_CHECK === '1') process.exit(0);

/** @param {string[]} argv */
function git(argv) {
  try {
    // stderr is dropped: on Windows git narrates CRLF conversion for every file.
    return execFileSync('git', argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

/**
 * Changed paths, plus the subset that were added or deleted (not just edited).
 * Added/deleted matters because it is what invalidates the folder-structure
 * trees, while a plain edit does not.
 */
function collectChanges() {
  const changed = new Set();
  const structural = new Set();

  // Default to the staged diff, since that is what `git commit` will record.
  // With nothing staged the caller is mid-`git commit -a` (or just exploring),
  // so fall back to the whole working tree rather than reporting a false OK.
  const nothingStaged = git(['diff', '--cached', '--name-only']).trim() === '';
  const wholeTree = useWorkingTree || nothingStaged;

  const statusOutput = wholeTree
    ? git(['diff', '--name-status', 'HEAD']) + git(['diff', '--cached', '--name-status'])
    : git(['diff', '--cached', '--name-status']);

  for (const line of statusOutput.split('\n')) {
    if (!line.trim()) continue;
    const [status, ...paths] = line.split('\t');
    const path = paths[paths.length - 1];
    if (!path) continue;
    changed.add(path);
    if (status.startsWith('A') || status.startsWith('D') || status.startsWith('R')) {
      structural.add(path);
    }
  }

  if (wholeTree) {
    for (const path of git(['ls-files', '--others', '--exclude-standard']).split('\n')) {
      if (!path.trim()) continue;
      changed.add(path);
      structural.add(path);
    }
  }

  return { changed: [...changed], structural: [...structural] };
}

/**
 * Each rule: when `test` matches a changed path, every doc in `docs` must also
 * be in the change set. `why` is shown to whoever has to fix it.
 */
const RULES = [
  {
    id: 'changelog',
    test: (p) => /^(src|supabase|scripts)\//.test(p),
    docs: ['docs/changelog.md'],
    why: 'every code change gets a changelog entry',
  },
  {
    id: 'folder-structure',
    structuralOnly: true,
    test: (p) => /^src\//.test(p),
    docs: ['docs/project-map.md', 'CLAUDE.md'],
    why: 'files were added/removed/renamed, so the folder-structure trees drift',
  },
  {
    id: 'stack',
    test: (p) => p === 'package.json',
    docs: ['CLAUDE.md'],
    why: 'dependency or script changes must be reflected in Current Stack / Important Commands',
  },
  {
    id: 'supabase-schema',
    test: (p) => /^supabase\/migrations\//.test(p),
    docs: ['docs/backend-guidelines.md', 'CLAUDE.md'],
    why: 'schema changes must update the Supabase table docs',
  },
  {
    id: 'edge-functions',
    test: (p) => /^supabase\/functions\//.test(p),
    docs: ['docs/backend-guidelines.md'],
    why: 'the Edge Functions list must stay accurate',
  },
  {
    id: 'admin-routes',
    structuralOnly: true,
    test: (p) => /^src\/routes\/admin\//.test(p),
    // Three docs each carry an admin-surface table. Historically only CLAUDE.md
    // was required, which is why the other two drifted for months.
    docs: ['CLAUDE.md', 'docs/cms-architecture.md', 'docs/project-map.md'],
    why: 'an admin route was added or removed — every admin-surface table must match',
  },
  {
    id: 'cms',
    test: (p) => /^src\/features\/(admin|cms)\//.test(p),
    docs: ['docs/cms-architecture.md'],
    why: 'CMS behaviour changed',
  },
  {
    id: 'animation',
    test: (p) => /(motion|webgl|gsap|ScrollTimeline|useTheOath)/i.test(p),
    docs: ['docs/animation-guidelines.md'],
    why: 'animation system changed',
  },
  {
    id: 'landing',
    test: (p) => /^src\/features\/landingPages\//.test(p),
    docs: ['docs/landing-pages.md'],
    why: 'landing-page system changed',
  },
  {
    id: 'deployment',
    test: (p) => /^(wrangler\.jsonc|vite\.config\.ts|\.env\.example)$/.test(p),
    docs: ['docs/deployment.md'],
    why: 'build/hosting configuration changed',
  },
];

/**
 * Presence of a doc edit is not correctness. These are facts that went stale
 * silently once before — a removed dependency kept being described as current
 * because every rule only ever asked "was a doc touched?".
 *
 * Each entry fails when `pattern` appears in a doc that is not exempt.
 * `docs/changelog.md` is always exempt: it is an append-only history, and past
 * entries are supposed to mention things that no longer exist.
 */
const BANNED_DOC_TERMS = [
  {
    pattern: /lucide-react/i,
    reason: 'lucide-react was removed 2026-07-17 — icons are @phosphor-icons/react via the @/shared/icons seam',
  },
  {
    pattern: /shadcn\/ui is (installed|used)/i,
    reason: 'shadcn/ui is NOT installed — the project has its own primitives in src/shared/components/ui/',
  },
];

/**
 * A doc is allowed to NAME a dead thing in order to say it is dead. Only lines
 * that assert it as current should fail, so lines carrying an explicit
 * historical or prohibitive marker are exempt.
 */
const HISTORICAL_MARKER =
  /\b(was removed|were removed|no longer|do not reintroduce|don't reintroduce|removed \d{4}|deprecated|historical|formerly|used to|pre-Phosphor|replaced by)\b/i;

const DOC_GLOBS = ['CLAUDE.md', 'AGENTS.md', 'README.md'];
const DOC_TERM_EXEMPT = new Set(['docs/changelog.md']);

function lintDocTerms() {
  const files = git(['ls-files', 'docs/*.md', 'docs/**/*.md', ...DOC_GLOBS])
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => f && !DOC_TERM_EXEMPT.has(f));

  const hits = [];
  for (const file of files) {
    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split('\n');
    for (const term of BANNED_DOC_TERMS) {
      lines.forEach((line, i) => {
        if (!term.pattern.test(line)) return;
        if (HISTORICAL_MARKER.test(line)) return;
        hits.push({ file, line: i + 1, reason: term.reason });
      });
    }
  }
  return hits;
}

const { changed, structural } = collectChanges();
const changedSet = new Set(changed);
const missing = [];

for (const rule of RULES) {
  const pool = rule.structuralOnly ? structural : changed;
  const trigger = pool.find((p) => rule.test(p) && !p.includes('__tests__'));
  if (!trigger) continue;

  const absent = rule.docs.filter((doc) => !changedSet.has(doc));
  if (absent.length > 0) missing.push({ rule: rule.id, why: rule.why, trigger, docs: absent });
}

// Runs unconditionally: a doc can rot without anything being changed today.
const staleTerms = lintDocTerms();
const ok = missing.length === 0 && staleTerms.length === 0;

if (asJson) {
  process.stdout.write(JSON.stringify({ ok, missing, staleTerms }));
  process.exit(ok ? 0 : 1);
}

if (ok) {
  console.log('docs-freshness: OK — required docs present, no stale claims found.');
  process.exit(0);
}

if (missing.length > 0) {
  console.error('');
  console.error('  docs-freshness: this change set updates code but not its documentation.');
  console.error('');
  for (const entry of missing) {
    console.error(`  • ${entry.docs.join(', ')}`);
    console.error(`      ${entry.why}`);
    console.error(`      triggered by: ${entry.trigger}`);
  }
}

if (staleTerms.length > 0) {
  console.error('');
  console.error('  docs-freshness: docs assert something that is no longer true.');
  console.error('');
  for (const hit of staleTerms) {
    console.error(`  • ${hit.file}:${hit.line}`);
    console.error(`      ${hit.reason}`);
  }
}

console.error('');
console.error('  Fix the above, or set ANVL_SKIP_DOC_CHECK=1 to bypass.');
console.error('');
process.exit(1);
