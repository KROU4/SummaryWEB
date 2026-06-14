import { describe, expect, it } from 'vitest';
import { validatePdf } from './pdf';

describe('validatePdf', () => {
  it('accepts normal PDF files', () => {
    const file = new File(['%PDF-1.7'], 'book.pdf', { type: 'application/pdf' });
    expect(validatePdf(file)).toBeNull();
  });

  it('rejects non-PDF extensions', () => {
    const file = new File(['hello'], 'book.txt', { type: 'text/plain' });
    expect(validatePdf(file)).toBe('Выберите файл PDF.');
  });

  it('rejects files larger than 25 MB', () => {
    const file = new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'book.pdf', { type: 'application/pdf' });
    expect(validatePdf(file)).toContain('25 МБ');
  });
});
