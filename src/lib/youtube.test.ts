import { describe, expect, it } from 'vitest';
import { normalizeYouTubeUrl } from './youtube';

describe('normalizeYouTubeUrl', () => {
  it('normalizes long YouTube links', () => {
    expect(normalizeYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=abc')).toEqual({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('normalizes short YouTube links', () => {
    expect(normalizeYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('rejects non-YouTube hosts', () => {
    expect(normalizeYouTubeUrl('https://example.com/watch?v=dQw4w9WgXcQ').error).toBeTruthy();
  });
});
