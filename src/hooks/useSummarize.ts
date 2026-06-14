import { useCallback, useState } from 'react';
import { saveSummary } from '../lib/history';
import { readPdfAsDataUrl, validatePdf } from '../lib/pdf';
import { InvalidSummaryResponseError, summarizeWithOpenRouter } from '../lib/openrouter';
import { fetchYoutubeTranscript } from '../lib/transcript';
import { normalizeYouTubeUrl } from '../lib/youtube';
import type { ProcessingStep, SourceType, SummaryRecord, SummarySettings } from '../types/summary';

type SummarizeInput =
  | { type: 'pdf'; file: File | null }
  | { type: 'youtube'; url: string };

export function useSummarize(apiKey: string, settings: SummarySettings) {
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [error, setError] = useState('');
  const [rawModelResponse, setRawModelResponse] = useState('');
  const [streamText, setStreamText] = useState('');
  const [lastInput, setLastInput] = useState<SummarizeInput | null>(null);
  const [currentSource, setCurrentSource] = useState<SourceType | null>(null);

  const summarize = useCallback(
    async (input: SummarizeInput): Promise<SummaryRecord | null> => {
      setError('');
      setRawModelResponse('');
      setStreamText('');
      setLastInput(input);
      setCurrentSource(input.type);

      if (!apiKey.trim()) {
        setError('Сначала добавьте OpenRouter API key в настройках.');
        setCurrentSource(null);
        return null;
      }

      try {
        setStep('preparing');
        const source =
          input.type === 'pdf'
            ? await preparePdf(input.file)
            : await prepareYoutube(input.url, settings.language, () => setStep('transcribing'));

        setStep('sending');
        const summary = await summarizeWithOpenRouter(apiKey, settings, source.request, (text) => {
          setStep('generating');
          setStreamText(text);
        });

        setStep('saving');
        const record: SummaryRecord = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          title: summary.title,
          sourceType: summary.sourceType,
          sourceRef: source.ref,
          model: settings.model,
          summary,
        };
        await saveSummary(record);
        setStep('done');
        return record;
      } catch (error) {
        setStep('idle');
        setCurrentSource(null);
        if (error instanceof InvalidSummaryResponseError) {
          setRawModelResponse(error.rawResponse);
        }
        setError(error instanceof Error ? error.message : 'Не удалось сделать выжимку.');
        return null;
      }
    },
    [apiKey, settings],
  );

  const reset = useCallback(() => {
    setStep('idle');
    setError('');
    setRawModelResponse('');
    setStreamText('');
    setCurrentSource(null);
  }, []);

  const retry = useCallback(() => {
    return lastInput ? summarize(lastInput) : Promise.resolve(null);
  }, [lastInput, summarize]);

  return { step, error, rawModelResponse, streamText, currentSource, summarize, retry, reset };
}

async function preparePdf(file: File | null) {
  if (!file) {
    throw new Error('Выберите PDF.');
  }

  const validation = validatePdf(file);
  if (validation) {
    throw new Error(validation);
  }

  return {
    ref: file.name,
    request: {
      type: 'pdf' as const,
      filename: file.name,
      dataUrl: await readPdfAsDataUrl(file),
    },
  };
}

async function prepareYoutube(url: string, language: SummarySettings['language'], onTranscribing: () => void) {
  const normalized = normalizeYouTubeUrl(url);
  if (normalized.error || !normalized.url) {
    throw new Error(normalized.error ?? 'Некорректная ссылка YouTube.');
  }

  onTranscribing();
  const transcript = await fetchYoutubeTranscript(normalized.url, language);

  return {
    ref: normalized.url,
    request: {
      type: 'youtube' as const,
      url: normalized.url,
      transcriptText: transcript.transcriptText,
      transcriptLanguage: transcript.language,
    },
  };
}
