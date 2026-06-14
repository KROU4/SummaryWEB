import { describe, expect, it } from 'vitest';
import {
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  type TranscriptConfig,
  type TranscriptSegment,
} from 'youtube-transcript-plus';
import { handleTranscriptRequest } from './transcript';

describe('handleTranscriptRequest', () => {
  it('returns normalized transcript response for a valid YouTube URL', async () => {
    const response = await handleTranscriptRequest(
      new Request('https://worker.example/api/transcript?url=https://www.youtube.com/watch?v=5ejwRJApU5g&lang=ru'),
      {},
      async () => [
        { text: ' Hello ', offset: 0, duration: 1.2, lang: 'ru' },
        { text: ' world ', offset: 1.2, duration: 1, lang: 'ru' },
      ],
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      videoId: '5ejwRJApU5g',
      language: 'ru',
      transcriptText: 'Hello world',
      charCount: 11,
    });
  });

  it('falls back to any available transcript when requested language is missing', async () => {
    const calls: Array<TranscriptConfig | undefined> = [];
    const response = await handleTranscriptRequest(
      new Request('https://worker.example/api/transcript?url=https://www.youtube.com/watch?v=5ejwRJApU5g&lang=ru'),
      {},
      async (_url, config) => {
        calls.push(config);
        if (config?.lang === 'ru') {
          throw new YoutubeTranscriptNotAvailableLanguageError('ru', ['en'], '5ejwRJApU5g');
        }
        return [{ text: 'English captions', offset: 0, duration: 1, lang: 'en' }] as TranscriptSegment[];
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ language: 'en', transcriptText: 'English captions' });
    expect(calls).toHaveLength(2);
  });

  it('returns INVALID_YOUTUBE_URL for invalid input', async () => {
    const response = await handleTranscriptRequest(new Request('https://worker.example/api/transcript?url=https://example.com'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: 'INVALID_YOUTUBE_URL' });
  });

  it('maps unavailable transcripts to NO_TRANSCRIPT', async () => {
    const response = await handleTranscriptRequest(
      new Request('https://worker.example/api/transcript?url=https://www.youtube.com/watch?v=5ejwRJApU5g'),
      {},
      async () => {
        throw new YoutubeTranscriptNotAvailableError('5ejwRJApU5g');
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: 'NO_TRANSCRIPT' });
  });

  it('maps upstream transcript limits to TRANSCRIPT_RATE_LIMITED', async () => {
    const response = await handleTranscriptRequest(
      new Request('https://worker.example/api/transcript?url=https://www.youtube.com/watch?v=5ejwRJApU5g'),
      {},
      async () => {
        throw new YoutubeTranscriptTooManyRequestError();
      },
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: 'TRANSCRIPT_RATE_LIMITED' });
  });
});
