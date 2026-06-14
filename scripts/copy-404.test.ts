import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

describe('copy-404 script contract', () => {
  it('copies dist/index.html to dist/404.html', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'summaryweb-'));
    const dist = join(dir, 'dist');
    vi.spyOn(process, 'cwd').mockReturnValue(dir);

    try {
      mkdirSync(dist, { recursive: true });
      writeFileSync(join(dist, 'index.html'), '<html>ok</html>');
      await import('./copy-404.mjs');
      expect(existsSync(join(dist, '404.html'))).toBe(true);
      expect(readFileSync(join(dist, '404.html'), 'utf8')).toBe('<html>ok</html>');
    } finally {
      vi.restoreAllMocks();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
