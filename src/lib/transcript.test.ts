import { describe, expect, it, vi } from 'vitest';
import { fetchYoutubeTranscript, TranscriptApiError } from './transcript';

describe('fetchYoutubeTranscript', () => {
  it('calls configured transcript endpoint and returns normalized payload', async () => {
    vi.stubEnv('VITE_TRANSCRIPT_API_URL', 'https://worker.example/api/transcript');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          ok: true,
          videoId: 'dQw4w9WgXcQ',
          language: 'en',
          segments: [{ text: 'hello', offset: 0, duration: 1 }],
          transcriptText: 'hello',
          charCount: 5,
        }),
      ),
    );

    await expect(fetchYoutubeTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'ru')).resolves.toMatchObject({
      videoId: 'dQw4w9WgXcQ',
      transcriptText: 'hello',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://worker.example/api/transcript?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&lang=ru',
    );
  });

  it('maps transcript endpoint errors to user-facing errors', async () => {
    vi.stubEnv('VITE_TRANSCRIPT_API_URL', 'https://worker.example/api/transcript');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ ok: false, code: 'NO_TRANSCRIPT', message: 'none' }, { status: 404 })),
    );

    await expect(fetchYoutubeTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'ru')).rejects.toThrow(
      'У видео нет доступных субтитров.',
    );
  });

  it('requires transcript endpoint configuration', async () => {
    vi.stubEnv('VITE_TRANSCRIPT_API_URL', '');

    await expect(fetchYoutubeTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'ru')).rejects.toBeInstanceOf(
      TranscriptApiError,
    );
  });
});
