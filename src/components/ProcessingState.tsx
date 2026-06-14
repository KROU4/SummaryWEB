import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CloudUpload, Database, FileSearch, LoaderCircle, RadioTower } from 'lucide-react';
import type { ProcessingStep, SourceType } from '../types/summary';

const labels: Record<ProcessingStep, string> = {
  idle: '',
  preparing: 'Готовим входные данные',
  transcribing: 'Получаем субтитры YouTube',
  sending: 'Отправляем transcript в OpenRouter',
  generating: 'Модель анализирует материал',
  saving: 'Сохраняем в библиотеку',
  done: 'Готово',
};

type ProcessingStateProps = {
  step: ProcessingStep;
  preview: string;
  source: SourceType | null;
};

const progressByStep: Record<ProcessingStep, number> = {
  idle: 0,
  preparing: 18,
  transcribing: 34,
  sending: 48,
  generating: 72,
  saving: 92,
  done: 100,
};

const stages: { step: ProcessingStep; label: string; icon: typeof FileSearch }[] = [
  { step: 'preparing', label: 'Подготовка', icon: FileSearch },
  { step: 'transcribing', label: 'Субтитры', icon: RadioTower },
  { step: 'sending', label: 'Передача', icon: CloudUpload },
  { step: 'generating', label: 'Анализ', icon: RadioTower },
  { step: 'saving', label: 'Запись', icon: Database },
];

export function ProcessingState({ step, preview, source }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(0);
  const active = step !== 'idle' && step !== 'done';

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return undefined;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, step]);

  const helperText = useMemo(() => {
    if (source === 'youtube') {
      return 'Сначала получаем субтитры, затем отправляем в модель только текст transcript.';
    }

    if (source === 'pdf') {
      return 'Большой PDF может занять несколько минут: файл передается и разбирается на стороне OpenRouter.';
    }

    return 'Запрос выполняется.';
  }, [source]);

  if (step === 'idle') {
    return null;
  }

  return (
    <div className="processing-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="processing-orbit" aria-hidden="true">
          <span />
          <LoaderCircle className="h-8 w-8 animate-spin text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">{labels[step]}</h2>
              <p className="mt-1 text-sm text-slate-600">{helperText}</p>
            </div>
            <span className="rounded-lg bg-white/75 px-3 py-1 text-sm font-bold text-indigo-700">
              {formatElapsed(elapsed)}
            </span>
          </div>

          <div className="processing-progress mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressByStep[step]}>
            <span style={{ width: `${progressByStep[step]}%` }} />
          </div>
        </div>
      </div>

      <div className="processing-stages">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const complete = progressByStep[step] > progressByStep[stage.step];
          const current = step === stage.step || (step === 'generating' && stage.step === 'generating');

          return (
            <div className={`processing-stage ${complete ? 'complete' : ''} ${current ? 'current' : ''}`} key={stage.step}>
              <span>
                {complete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
              </span>
              {stage.label}
            </div>
          );
        })}
      </div>

      {preview && (
        <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/75 p-3 text-xs text-slate-700">
          {preview.slice(0, 1600)}
        </pre>
      )}
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
