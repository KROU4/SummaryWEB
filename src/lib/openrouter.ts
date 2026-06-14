import { buildUserInstruction, summaryJsonSchema, SYSTEM_PROMPT } from './prompts';
import { FREE_MODEL_CATALOG, FREE_MODEL_IDS, getCuratedFreeModels } from './freeModels';
import type { OpenRouterModel, Summary, SummarySettings } from '../types/summary';

const API_BASE = 'https://openrouter.ai/api/v1';
const APP_TITLE = 'BookVideo Summarizer';

type SummarizeRequest =
  | { type: 'pdf'; filename: string; dataUrl: string }
  | { type: 'youtube'; url: string; transcriptText: string; transcriptLanguage?: string };

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string; code?: number | string };
};

type ModelApiItem = {
  id: string;
  name?: string;
  context_length?: number;
  input_modalities?: string[];
  output_modalities?: string[];
  supported_features?: string[];
  supported_parameters?: string[];
  is_free?: boolean;
  is_ready?: boolean;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
};

export class InvalidSummaryResponseError extends Error {
  readonly rawResponse: string;

  constructor(rawResponse: string) {
    super('Модель дважды вернула невалидный JSON. Проверьте сырой ответ ниже и повторите запрос.');
    this.name = 'InvalidSummaryResponseError';
    this.rawResponse = rawResponse;
  }
}

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) {
    throw new Error('Не удалось загрузить список моделей OpenRouter.');
  }

  const payload = (await response.json()) as { data?: ModelApiItem[] };
  const apiModels = (payload.data ?? [])
    .filter((model) => shouldShowModel(model))
    .map(normalizeModel)
    .filter((model) => model.isReady !== false && model.outputModalities.includes('text'))
    .filter((model) => !isImageOnlyModel(model));
  const models = mergeCuratedFreeModels(apiModels).sort(compareModels);

  return models.length ? models : fallbackModels;
}

export async function summarizeWithOpenRouter(
  apiKey: string,
  settings: SummarySettings,
  source: SummarizeRequest,
  onChunk?: (text: string) => void,
): Promise<Summary> {
  const payload = buildPayload(settings, source, true);
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-OpenRouter-Title': APP_TITLE,
  };

  const first = await postCompletion(headers, payload, onChunk);
  const parsed = parseSummary(first);
  if (parsed) {
    return parsed;
  }

  const retryPayload = {
    ...payload,
    stream: false,
    messages: [
      ...payload.messages,
      {
        role: 'user',
        content: 'Предыдущий ответ был невалидным. Верни только валидный JSON по заданной схеме.',
      },
    ],
  };

  const retry = await postCompletion(headers, retryPayload);
  return parseSummary(retry) ?? failInvalidJson(retry || first);
}

export function buildPayload(settings: SummarySettings, source: SummarizeRequest, stream: boolean) {
  const isVideo = source.type === 'youtube';
  const userInstruction = buildUserInstruction(settings.language, settings.length, isVideo);
  const content =
    source.type === 'pdf'
      ? [
          { type: 'text', text: userInstruction },
          { type: 'file', file: { filename: source.filename, file_data: source.dataUrl } },
        ]
      : [
          userInstruction,
          `Источник YouTube: ${source.url}`,
          source.transcriptLanguage ? `Язык субтитров: ${source.transcriptLanguage}` : '',
          'Ниже субтитры видео. Делай выжимку только по этому transcript, не по самому видео.',
          source.transcriptText,
        ]
          .filter(Boolean)
          .join('\n\n');

  return {
    model: settings.model,
    stream,
    response_format: {
      type: 'json_schema',
      json_schema: summaryJsonSchema,
    },
    plugins:
      source.type === 'pdf'
        ? [
            {
              id: 'file-parser',
              pdf: { engine: settings.pdfEngine },
            },
          ]
        : undefined,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content },
    ],
  };
}

async function postCompletion(
  headers: Record<string, string>,
  payload: ReturnType<typeof buildPayload>,
  onChunk?: (text: string) => void,
): Promise<string> {
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await throwOpenRouterError(response);
  }

  if (payload.stream && response.body) {
    return readStream(response.body, onChunk);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  if (data.error) {
    throw new Error(mapApiMessage(data.error.message, data.error.code));
  }

  return data.choices?.[0]?.message?.content ?? '';
}

async function readStream(body: ReadableStream<Uint8Array>, onChunk?: (text: string) => void): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) {
        continue;
      }

      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') {
        continue;
      }

      try {
        const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[]; error?: { message?: string } };
        if (parsed.error?.message) {
          throw new Error(parsed.error.message);
        }
        const chunk = parsed.choices?.[0]?.delta?.content ?? '';
        output += chunk;
        if (chunk) {
          onChunk?.(output);
        }
      } catch (error) {
        if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
          throw error;
        }
      }
    }
  }

  return output;
}

async function throwOpenRouterError(response: Response): Promise<never> {
  let message = '';
  try {
    const payload = (await response.json()) as ChatCompletionResponse;
    message = payload.error?.message ?? '';
  } catch {
    message = response.statusText;
  }

  throw new Error(mapApiMessage(message, response.status));
}

export function mapApiMessage(message = '', code?: number | string): string {
  if (code === 402 || /credits|balance|payment/i.test(message)) {
    return 'Для длинных видео или больших PDF может понадобиться небольшой баланс на OpenRouter.';
  }

  if (code === 429 || /rate|limit/i.test(message)) {
    return 'Достигнут лимит тарифа. Подождите минуту или проверьте баланс OpenRouter.';
  }

  if (/video|modality|unsupported/i.test(message)) {
    return 'Выбранная модель не принимает видео. Выберите Gemini Flash с поддержкой video.';
  }

  if (code === 401 || code === 403 || /auth|key|401|403|unauthorized|forbidden/i.test(message)) {
    return 'OpenRouter отклонил ключ. Проверьте ключ в настройках.';
  }

  return message || 'OpenRouter вернул ошибку. Попробуйте повторить запрос.';
}

export function parseSummary(value: string): Summary | null {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return coerceSummary(JSON.parse(cleaned));
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return coerceSummary(JSON.parse(cleaned.slice(start, end + 1)));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function failInvalidJson(rawResponse: string): never {
  throw new InvalidSummaryResponseError(rawResponse);
}

function coerceSummary(value: unknown): Summary | null {
  if (!isObject(value)) {
    return null;
  }

  const summary = value as Partial<Summary>;
  if (
    typeof summary.title !== 'string' ||
    (summary.sourceType !== 'pdf' && summary.sourceType !== 'youtube') ||
    typeof summary.tldr !== 'string' ||
    !isStringArray(summary.keyPoints) ||
    !Array.isArray(summary.sections) ||
    !isStringArray(summary.keyTakeaways)
  ) {
    return null;
  }

  if (
    !summary.sections.every(
      (section) =>
        isObject(section) &&
        typeof section.heading === 'string' &&
        typeof section.summary === 'string' &&
        isStringArray(section.points),
    )
  ) {
    return null;
  }

  if (summary.notableQuotes && !summary.notableQuotes.every(isQuote)) {
    return null;
  }

  if (summary.glossary && !summary.glossary.every(isGlossaryItem)) {
    return null;
  }

  if (summary.openQuestions && !isStringArray(summary.openQuestions)) {
    return null;
  }

  return summary as Summary;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isQuote(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.text === 'string' &&
    (value.context === undefined || typeof value.context === 'string')
  );
}

function isGlossaryItem(value: unknown): boolean {
  return isObject(value) && typeof value.term === 'string' && typeof value.definition === 'string';
}

function normalizeModel(model: ModelApiItem): OpenRouterModel {
  const inputModalities = model.input_modalities ?? model.architecture?.input_modalities ?? [];
  const outputModalities = model.output_modalities ?? model.architecture?.output_modalities ?? [];
  const supportedFeatures = model.supported_features ?? model.supported_parameters ?? [];
  const catalogEntry = FREE_MODEL_CATALOG.find((item) => item.id === model.id);
  const isFree = model.is_free || FREE_MODEL_IDS.has(model.id) || model.id.endsWith(':free') || model.id === 'openrouter/free';

  return {
    id: model.id,
    name: model.name ?? catalogEntry?.name ?? model.id,
    description: catalogEntry?.description,
    contextLength: model.context_length,
    inputModalities,
    outputModalities,
    supportedFeatures,
    isFree,
    isReady: model.is_ready,
    supportsVideo: !isFree && inputModalities.includes('video'),
    supportsFile: inputModalities.includes('file') || inputModalities.includes('pdf'),
    supportsSummary: true,
  };
}

function shouldShowModel(model: ModelApiItem): boolean {
  const label = `${model.id} ${model.name ?? ''}`;
  const isGeminiFlash = /(^|\/)gemini/i.test(model.id) && /flash/i.test(label);
  return isGeminiFlash || FREE_MODEL_IDS.has(model.id) || model.id.endsWith(':free') || model.id === 'openrouter/free';
}

function isImageOnlyModel(model: OpenRouterModel): boolean {
  if (model.outputModalities.includes('text')) {
    return false;
  }

  return model.outputModalities.length > 0;
}

function mergeCuratedFreeModels(apiModels: OpenRouterModel[]): OpenRouterModel[] {
  const byId = new Map<string, OpenRouterModel>();

  for (const model of getCuratedFreeModels()) {
    byId.set(model.id, model);
  }

  for (const model of apiModels) {
    byId.set(model.id, {
      ...byId.get(model.id),
      ...model,
      description: model.description ?? byId.get(model.id)?.description,
      isFree: model.isFree || byId.get(model.id)?.isFree,
      supportsSummary: byId.get(model.id)?.supportsSummary ?? model.supportsSummary,
    });
  }

  return Array.from(byId.values());
}

function compareModels(a: OpenRouterModel, b: OpenRouterModel): number {
  return (
    Number(b.supportsVideo) - Number(a.supportsVideo) ||
    Number(b.isFree) - Number(a.isFree) ||
    a.name.localeCompare(b.name)
  );
}

const fallbackModels: OpenRouterModel[] = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Google: Gemini 2.5 Flash',
    inputModalities: ['text', 'image', 'file', 'video'],
    outputModalities: ['text'],
    supportedFeatures: ['structured_outputs'],
    isFree: false,
    supportsVideo: true,
    supportsFile: true,
    supportsSummary: true,
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Google: Gemini 2.5 Flash Lite',
    inputModalities: ['text', 'image', 'file'],
    outputModalities: ['text'],
    supportedFeatures: ['structured_outputs'],
    isFree: false,
    supportsVideo: false,
    supportsFile: true,
    supportsSummary: true,
  },
  ...getCuratedFreeModels(),
];
