import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const VALID_ROOT = resolve(import.meta.dirname, '../fixtures/valid');

/** A fresh copy of the valid fixture set in a temporary folder. */
export function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-fixture-'));
  cpSync(VALID_ROOT, dir, { recursive: true });
  return dir;
}

/** Replace exactly one occurrence of `from` in a file under `root`. Fails if it is not found once. */
export function editFile(root: string, path: string, from: string, to: string): void {
  const abs = join(root, path);
  const text = readFileSync(abs, 'utf8');
  if (text.split(from).length !== 2) throw new Error(`expected one "${from}" in ${path}`);
  writeFileSync(abs, text.replace(from, to));
}

/** Read a JSON file under `root`, change it, and write it back. */
// Tests deliberately write invalid shapes into fixtures, so the data is untyped on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function editJson(root: string, path: string, change: (data: any) => void): void {
  const abs = join(root, path);
  const data: unknown = JSON.parse(readFileSync(abs, 'utf8'));
  change(data);
  writeFileSync(abs, JSON.stringify(data, null, 2));
}
