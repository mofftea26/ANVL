#!/usr/bin/env node
/**
 * Claude Code PreToolUse gate for `git commit`.
 *
 * Wired to the Bash matcher in .claude/settings.json. Every Bash call reaches
 * this script, so it must decide for itself whether the command is actually a
 * commit — settings' `if` filter is not reliable enough to be the only guard,
 * and a gate that fires on unrelated commands blocks all work.
 *
 * Reads the hook payload on stdin, and only when the command really is a
 * `git commit` does it run the doc-freshness check. Exit 2 blocks the tool call
 * and feeds stderr back to the model; exit 0 lets everything else through.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** A commit, not merely a command mentioning the word. Ignores `git commit` inside a -m message. */
function isGitCommit(command) {
  if (typeof command !== 'string') return false;
  const withoutQuoted = command.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
  return /(^|[;&|]\s*)git\s+(-[^\s]+\s+)*commit\b/.test(withoutQuoted);
}

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0); // Unparseable payload must never block the tool.
}

if (!isGitCommit(payload?.tool_input?.command)) process.exit(0);
if (process.env.ANVL_SKIP_DOC_CHECK === '1') process.exit(0);

try {
  execFileSync('node', ['scripts/check-docs-freshness.mjs'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  process.exit(0);
} catch (error) {
  process.stderr.write(
    'Blocked: this commit changes code without updating the docs that track it.\n' +
      (error.stderr || error.stdout || '') +
      '\nUpdate the listed docs and retry, or prefix the command with ANVL_SKIP_DOC_CHECK=1 ' +
      'if the change genuinely needs no doc update.\n',
  );
  process.exit(2);
}
