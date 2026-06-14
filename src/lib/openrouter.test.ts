import { describe, expect, it } from 'vitest';
import { buildPayload, mapApiMessage, parseSummary } from './openrouter';
import type { Summary, SummarySettings } from '../types/summary';

const settings: SummarySettings = {
  language: 'ru',
  length: 'medium',
  model: 'google/gemini-2.5-flash',
  pdfEngine: 'cloudflare-ai',
  freeOnly: false,
};

const validSummary: Summary = {
  title: 'Test',
  sourceType: 'youtube',
  tldr: 'Коротко.',
  keyPoints: ['1', '2', '3', '4', '5'],
  sections: [{ heading: 'A', summary: 'B', points: ['C'] }],
  keyTakeaways: ['A', 'B', 'C'],
};

describe('parseSummary', () => {
  it('accepts valid summary JSON', () => {
    expect(parseSummary(JSON.stringify(validSummary))).toEqual(validSummary);
  });

  it('rejects syntactically valid but incomplete JSON', () => {
    expect(parseSummary(JSON.stringify({ title: 'Bad' }))).toBeNull();
  });

  it('extracts JSON from markdown fences', () => {
    expect(parseSummary(`\`\`\`json\n${JSON.stringify(validSummary)}\n\`\`\``)).toEqual(validSummary);
  });
});

describe('mapApiMessage', () => {
  it('maps auth statuses to friendly text', () => {
    expect(mapApiMessage('Unauthorized', 401)).toContain('ключ');
    expect(mapApiMessage('Forbidden', 403)).toContain('ключ');
  });

  it('maps rate limits and billing statuses', () => {
    expect(mapApiMessage('', 429)).toContain('лимит');
    expect(mapApiMessage('', 402)).toContain('баланс');
  });
});

describe('buildPayload', () => {
  it('builds PDF file_data payload with configured parser', () => {
    const payload = buildPayload(settings, { type: 'pdf', filename: 'book.pdf', dataUrl: 'data:application/pdf;base64,AA==' }, false);
    expect(payload.plugins?.[0]).toEqual({ id: 'file-parser', pdf: { engine: 'cloudflare-ai' } });
    expect(payload.messages[1].content).toContainEqual({
      type: 'file',
      file: { filename: 'book.pdf', file_data: 'data:application/pdf;base64,AA==' },
    });
  });

  it('builds YouTube transcript text payload without PDF plugin or video_url', () => {
    const payload = buildPayload(
      settings,
      {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        transcriptText: 'First caption. Second caption.',
        transcriptLanguage: 'en',
      },
      true,
    );
    expect(payload.plugins).toBeUndefined();
    expect(payload.messages[1].content).toContain('Источник YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(payload.messages[1].content).toContain('First caption. Second caption.');
    expect(payload.messages[1].content).not.toContain('video_url');
  });
});
