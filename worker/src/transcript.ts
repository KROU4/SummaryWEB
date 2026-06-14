import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptInvalidVideoIdError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  type TranscriptConfig,
  type TranscriptSegment as YoutubeTranscriptSegment,
} from 'youtube-transcript-plus';
import { normalizeYouTubeUrl } from '../../src/lib/youtube';

type Env = {
  ALLOWED_ORIGIN?: string;
};

type TranscriptFetcher = (videoUrl: string, config?: TranscriptConfig) => Promise<YoutubeTranscriptSegment[]>;

type TranscriptErrorCode =
  | 'INVALID_YOUTUBE_URL'
  | 'NO_TRANSCRIPT'
  | 'TRANSCRIPT_RATE_LIMITED'
  | 'TRANSCRIPT_FAILED'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_FOUND';

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

export async function handleTranscriptRequest(
  request: Request,
  env: Env = {},
  transcriptFetcher: TranscriptFetcher = fetchTranscript,
): Promise<Response> {
  const corsHeaders = getCorsHeaders(env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return jsonError('METHOD_NOT_ALLOWED', 'Only GET is supported.', 405, corsHeaders);
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.pathname !== '/api/transcript') {
    return jsonError('NOT_FOUND', 'Endpoint not found.', 404, corsHeaders);
  }

  const rawUrl = requestUrl.searchParams.get('url') ?? '';
  const lang = normalizeLanguage(requestUrl.searchParams.get('lang'));
  const normalized = normalizeYouTubeUrl(rawUrl);

  if (normalized.error || !normalized.url) {
    return jsonError('INVALID_YOUTUBE_URL', normalized.error ?? 'Invalid YouTube URL.', 400, corsHeaders);
  }

  try {
    const segments = await fetchWithLanguageFallback(transcriptFetcher, normalized.url, lang);
    const normalizedSegments = normalizeSegments(segments);
    const transcriptText = normalizedSegments.map((segment) => segment.text).join(' ').trim();

    if (!transcriptText) {
      return jsonError('NO_TRANSCRIPT', 'No transcript available for this video.', 404, corsHeaders);
    }

    return json(
      {
        ok: true,
        videoId: getVideoId(normalized.url),
        language: normalizedSegments.find((segment) => segment.lang)?.lang ?? lang ?? 'unknown',
        segments: normalizedSegments.map(({ text, offset, duration }) => ({ text, offset, duration })),
        transcriptText,
        charCount: transcriptText.length,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return transcriptErrorResponse(error, corsHeaders);
  }
}

async function fetchWithLanguageFallback(
  transcriptFetcher: TranscriptFetcher,
  url: string,
  lang?: string,
): Promise<YoutubeTranscriptSegment[]> {
  const baseConfig: TranscriptConfig = { cacheTTL: DEFAULT_CACHE_TTL_MS };

  if (!lang) {
    return transcriptFetcher(url, baseConfig);
  }

  try {
    return await transcriptFetcher(url, { ...baseConfig, lang });
  } catch (error) {
    if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
      return transcriptFetcher(url, baseConfig);
    }
    throw error;
  }
}

function normalizeSegments(segments: YoutubeTranscriptSegment[]) {
  return segments
    .map((segment) => ({
      text: segment.text.replace(/\s+/g, ' ').trim(),
      offset: Number(segment.offset) || 0,
      duration: Number(segment.duration) || 0,
      lang: segment.lang,
    }))
    .filter((segment) => segment.text);
}

function transcriptErrorResponse(error: unknown, headers: HeadersInit): Response {
  if (error instanceof YoutubeTranscriptTooManyRequestError) {
    return jsonError('TRANSCRIPT_RATE_LIMITED', error.message, 429, headers);
  }

  if (
    error instanceof YoutubeTranscriptDisabledError ||
    error instanceof YoutubeTranscriptNotAvailableError ||
    error instanceof YoutubeTranscriptVideoUnavailableError
  ) {
    return jsonError('NO_TRANSCRIPT', error.message, 404, headers);
  }

  if (error instanceof YoutubeTranscriptInvalidVideoIdError) {
    return jsonError('INVALID_YOUTUBE_URL', error.message, 400, headers);
  }

  return jsonError('TRANSCRIPT_FAILED', error instanceof Error ? error.message : 'Transcript fetch failed.', 502, headers);
}

function normalizeLanguage(lang: string | null): string | undefined {
  return lang === 'ru' || lang === 'en' ? lang : undefined;
}

function getVideoId(url: string): string {
  return new URL(url).searchParams.get('v') ?? '';
}

function getCorsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=1800',
  };
}

function json(payload: unknown, status: number, headers: HeadersInit): Response {
  return Response.json(payload, {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function jsonError(code: TranscriptErrorCode, message: string, status: number, headers: HeadersInit): Response {
  return json({ ok: false, code, message }, status, headers);
}
