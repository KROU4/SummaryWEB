import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FREE_MODEL_CATALOG } from '../src/lib/freeModels';
import { buildPayload } from '../src/lib/openrouter';
import type { SummarySettings } from '../src/types/summary';

const API_BASE = 'https://openrouter.ai/api/v1';
const YOUTUBE_URL = process.env.OPENROUTER_TEST_YOUTUBE_URL ?? 'https://www.youtube.com/watch?v=5ejwRJApU5g';
const TRANSCRIPT_TEXT =
  process.env.OPENROUTER_TEST_TRANSCRIPT_TEXT ??
  'Это тестовый transcript YouTube-видео. Первый блок объясняет тему ролика. Второй блок перечисляет ключевые идеи. Третий блок содержит выводы и практические шаги.';
const TRANSCRIPT_LANGUAGE = process.env.OPENROUTER_TEST_TRANSCRIPT_LANGUAGE ?? 'ru';
const DELAY_MS = Number(process.env.OPENROUTER_TEST_DELAY_MS ?? '3500');
const TIMEOUT_MS = Number(process.env.OPENROUTER_TEST_TIMEOUT_MS ?? '60000');
const STREAM_SAMPLE_TIMEOUT_MS = Number(process.env.OPENROUTER_TEST_STREAM_SAMPLE_TIMEOUT_MS ?? '12000');
const REPORT_DIR = join(process.cwd(), 'reports');
const REPORT_PATH = join(REPORT_DIR, 'openrouter-free-models.json');
const TSV_PATH = join(REPORT_DIR, 'openrouter-free-models.tsv');

type ModelResult = {
  id: string;
  name: string;
  status: number | 'timeout' | 'network-error';
  ok: boolean;
  rateLimited: boolean;
  retryAfter: string | null;
  message: string;
  durationMs: number;
};

const settings: SummarySettings = {
  language: 'ru',
  length: 'medium',
  model: '',
  pdfEngine: 'cloudflare-ai',
  freeOnly: true,
};

describe('OpenRouter free models live YouTube smoke test', () => {
  it(
    'checks which curated free models accept the same transcript-only YouTube payload as the app',
    async () => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.warn('Skipping live OpenRouter smoke test: OPENROUTER_API_KEY is not set.');
        return;
      }

      const results: ModelResult[] = [];
      for (const [index, model] of FREE_MODEL_CATALOG.entries()) {
        if (index > 0) {
          await delay(DELAY_MS);
        }

        const result = await probeModel(apiKey, model.id, model.name);
        results.push(result);
        console.info(
          `${result.ok ? 'OK' : 'FAIL'}\t${result.status}\t${result.retryAfter ?? '-'}\t${result.id}\t${result.message}`,
        );
      }

      await writeReport(results);
      expect(results.length).toBe(FREE_MODEL_CATALOG.length);
    },
    Math.max(120000, FREE_MODEL_CATALOG.length * (DELAY_MS + TIMEOUT_MS + 1000)),
  );
});

async function probeModel(apiKey: string, modelId: string, name: string): Promise<ModelResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const payload = buildPayload(
      { ...settings, model: modelId },
      {
        type: 'youtube',
        url: YOUTUBE_URL,
        transcriptText: TRANSCRIPT_TEXT,
        transcriptLanguage: TRANSCRIPT_LANGUAGE,
      },
      true,
    );
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-OpenRouter-Title': 'BookVideo Summarizer',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const retryAfter = response.headers.get('retry-after');
    const body = response.ok ? await readAcceptedBodySample(response) : await response.text();
    const message = extractMessage(body) || response.statusText || (response.ok ? 'accepted' : 'failed');

    return {
      id: modelId,
      name,
      status: response.status,
      ok: response.ok && !body.includes('"error"'),
      rateLimited: response.status === 429 || /rate|limit/i.test(message),
      retryAfter,
      message: compact(message),
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      id: modelId,
      name,
      status: aborted ? 'timeout' : 'network-error',
      ok: false,
      rateLimited: false,
      retryAfter: null,
      message: compact(error instanceof Error ? error.message : String(error)),
      durationMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readAcceptedBodySample(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.body || !contentType.includes('text/event-stream')) {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let output = '';
  const startedAt = Date.now();

  while (true) {
    const read = await Promise.race([
      reader.read(),
      delay(Math.max(1, STREAM_SAMPLE_TIMEOUT_MS - (Date.now() - startedAt))).then(() => null),
    ]);
    if (!read) {
      await reader.cancel();
      return output || 'accepted';
    }

    const { done, value } = read;
    if (done) {
      break;
    }

    output += decoder.decode(value, { stream: true });
    if (output.includes('\ndata:') || output.length > 512) {
      await reader.cancel();
      return output;
    }
  }

  return output;
}

function extractMessage(body: string): string {
  if (!body.trim()) {
    return '';
  }

  const direct = tryParseJson(body);
  if (direct?.error?.message) {
    return direct.error.message;
  }

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) {
      continue;
    }

    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') {
      continue;
    }

    const parsed = tryParseJson(data);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  }

  return '';
}

function tryParseJson(value: string): { error?: { message?: string } } | null {
  try {
    return JSON.parse(value) as { error?: { message?: string } };
  } catch {
    return null;
  }
}

async function writeReport(results: ModelResult[]): Promise<void> {
  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(
    REPORT_PATH,
    `${JSON.stringify(
      { url: YOUTUBE_URL, transcriptLanguage: TRANSCRIPT_LANGUAGE, transcriptChars: TRANSCRIPT_TEXT.length, generatedAt: new Date().toISOString(), results },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    TSV_PATH,
    [
      'ok\tstatus\trateLimited\tretryAfter\tdurationMs\tid\tmessage',
      ...results.map((result) =>
        [
          result.ok,
          result.status,
          result.rateLimited,
          result.retryAfter ?? '',
          result.durationMs,
          result.id,
          result.message.replaceAll('\t', ' '),
        ].join('\t'),
      ),
    ].join('\n') + '\n',
  );
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
