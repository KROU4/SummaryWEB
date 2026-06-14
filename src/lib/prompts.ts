import type { SummaryLength, SummaryLanguage } from '../types/summary';

export const summaryJsonSchema = {
  name: 'summary_result',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'sourceType', 'tldr', 'keyPoints', 'sections', 'keyTakeaways'],
    properties: {
      title: { type: 'string' },
      sourceType: { type: 'string', enum: ['pdf', 'youtube'] },
      tldr: { type: 'string' },
      readingTimeSaved: { type: 'string' },
      keyPoints: { type: 'array', minItems: 5, maxItems: 9, items: { type: 'string' } },
      sections: {
        type: 'array',
        minItems: 2,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['heading', 'summary', 'points'],
          properties: {
            heading: { type: 'string' },
            summary: { type: 'string' },
            points: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      keyTakeaways: { type: 'array', minItems: 3, items: { type: 'string' } },
      notableQuotes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['text'],
          properties: {
            text: { type: 'string' },
            context: { type: 'string' },
          },
        },
      },
      glossary: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['term', 'definition'],
          properties: {
            term: { type: 'string' },
            definition: { type: 'string' },
          },
        },
      },
      openQuestions: { type: 'array', items: { type: 'string' } },
    },
  },
} as const;

export const SYSTEM_PROMPT = [
  'Ты эксперт-конспектатор.',
  'Сделай структурированную выжимку из книги или видео.',
  'Будь конкретным, не добавляй факты от себя, сохраняй причинно-следственные связи.',
  'Не склеивай много разных сайтов, тезисов или действий в один длинный пункт: один пункт = одна мысль или один ресурс.',
  'Если в видео перечисляются сайты или инструменты, разнеси их по отдельным sections, а keyPoints сделай короткими и сканируемыми.',
  'Для обучающих видео выделяй практические шаги и итоговые выводы.',
  'Верни строго валидный JSON по схеме, без markdown-оберток, преамбулы и пояснений.',
].join(' ');

const lengthLabels: Record<SummaryLength, string> = {
  short: 'кратко, примерно 150-250 слов суммарно по всем полям',
  medium: 'средне, достаточно для быстрого понимания материала',
  detailed: 'подробно, с развернутыми sections и практическими выводами',
};

const languageLabels: Record<SummaryLanguage, string> = {
  ru: 'русском',
  en: 'английском',
};

export function buildUserInstruction(language: SummaryLanguage, length: SummaryLength, isVideo: boolean): string {
  const videoHint = isVideo
    ? ' Если это обучающее видео, сделай акцент на пошаговых действиях и итоговых выводах.'
    : '';

  return `Сделай выжимку на ${languageLabels[language]} языке: ${lengthLabels[length]}. KeyPoints должны быть короткими, без длинных списков внутри одного пункта.${videoHint}`;
}
