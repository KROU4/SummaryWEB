import type { SummaryLanguage } from '../types/summary';

export type TranscriptSegment = {
  text: string;
  offset: number;
  duration: number;
};

export type TranscriptResult = {
  videoId: string;
  language: string;
  segments: TranscriptSegment[];
  transcriptText: string;
  charCount: number;
};

type TranscriptSuccessResponse = TranscriptResult & {
  ok: true;
};

type TranscriptErrorResponse = {
  ok: false;
  code?: string;
  message?: string;
};

type TranscriptApiResponse = TranscriptSuccessResponse | TranscriptErrorResponse;

export class TranscriptApiError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(mapTranscriptError(code, message));
    this.name = 'TranscriptApiError';
    this.code = code;
  }
}

export async function fetchYoutubeTranscript(url: string, language: SummaryLanguage): Promise<TranscriptResult> {
  const endpoint = import.meta.env.VITE_TRANSCRIPT_API_URL?.trim();
  if (!endpoint) {
    throw new TranscriptApiError('TRANSCRIPT_SERVICE_MISSING');
  }

  const requestUrl = new URL(endpoint);
  requestUrl.searchParams.set('url', url);
  requestUrl.searchParams.set('lang', language);

  const response = await fetch(requestUrl.toString());
  const payload = (await response.json().catch(() => null)) as TranscriptApiResponse | null;

  if (!response.ok || !payload?.ok) {
    const code = payload && !payload.ok ? payload.code : response.status === 429 ? 'TRANSCRIPT_RATE_LIMITED' : 'TRANSCRIPT_FAILED';
    const message = payload && !payload.ok ? payload.message : response.statusText;
    throw new TranscriptApiError(code ?? 'TRANSCRIPT_FAILED', message);
  }

  if (!payload.transcriptText.trim()) {
    throw new TranscriptApiError('NO_TRANSCRIPT');
  }

  return payload;
}

function mapTranscriptError(code: string, message?: string): string {
  switch (code) {
    case 'NO_TRANSCRIPT':
      return 'У видео нет доступных субтитров.';
    case 'TRANSCRIPT_RATE_LIMITED':
      return 'Сервис субтитров временно ограничил запросы. Повторите позже.';
    case 'TRANSCRIPT_SERVICE_MISSING':
      return 'Не настроен VITE_TRANSCRIPT_API_URL для получения субтитров.';
    case 'INVALID_YOUTUBE_URL':
      return 'Некорректная ссылка YouTube.';
    default:
      return message || 'Не удалось получить субтитры YouTube.';
  }
}
