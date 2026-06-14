import { KeyRound, LogOut, RefreshCw } from 'lucide-react';
import type { OpenRouterModel, SummarySettings } from '../types/summary';
import { GlassCard } from './GlassCard';

type SettingsProps = {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  settings: SummarySettings;
  onSettingsChange: (patch: Partial<SummarySettings>) => void;
  models: OpenRouterModel[];
  modelsError: string;
  onLogout: () => void;
};

export function Settings({
  apiKey,
  onApiKeyChange,
  settings,
  onSettingsChange,
  models,
  modelsError,
  onLogout,
}: SettingsProps) {
  const selectedModel = models.find((model) => model.id === settings.model);
  const visibleModels = settings.freeOnly ? models.filter((model) => model.isFree) : models;

  function handleFreeOnlyChange(checked: boolean) {
    const firstFreeModel = models.find((model) => model.isFree);
    onSettingsChange({
      freeOnly: checked,
      model: checked && firstFreeModel && !selectedModel?.isFree ? firstFreeModel.id : settings.model,
    });
  }

  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Настройки</h2>
          <p className="section-subtitle">OpenRouter и параметры выжимки</p>
        </div>
        <button className="icon-button" onClick={onLogout} title="Выйти" aria-label="Выйти">
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <label className="block space-y-2">
        <span className="label-row">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          API key
        </span>
        <input
          className="field"
          type="password"
          placeholder="sk-or-..."
          value={apiKey}
          autoComplete="off"
          onChange={(event) => onApiKeyChange(event.target.value)}
        />
      </label>

      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Создайте отдельный ключ OpenRouter, задайте лимит трат и после деплоя ограничьте HTTP referrer доменом
        GitHub Pages.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Язык</span>
          <select
            className="field"
            value={settings.language}
            onChange={(event) => onSettingsChange({ language: event.target.value as SummarySettings['language'] })}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Длина</span>
          <select
            className="field"
            value={settings.length}
            onChange={(event) => onSettingsChange({ length: event.target.value as SummarySettings['length'] })}
          >
            <option value="short">Кратко</option>
            <option value="medium">Средне</option>
            <option value="detailed">Подробно</option>
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Модель</span>
        <select
          className="field"
          value={settings.model}
          onChange={(event) => onSettingsChange({ model: event.target.value })}
        >
          {visibleModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} {model.isFree ? '· free' : ''}{' '}
              {!model.supportsSummary ? '· не для саммари' : ''}
            </option>
          ))}
          {!visibleModels.length && <option value={settings.model}>{settings.model}</option>}
        </select>
      </label>

      <label className="flex items-center justify-between gap-4 rounded-lg border border-white/70 bg-white/50 px-3 py-2 text-sm">
        <span>
          <span className="block font-medium text-slate-800">Только free-модели</span>
          <span className="text-slate-600">У free-тарифа обычно жесткие лимиты</span>
        </span>
        <input
          className="h-5 w-5 accent-indigo-600"
          type="checkbox"
          checked={settings.freeOnly}
          onChange={(event) => handleFreeOnlyChange(event.target.checked)}
        />
      </label>

      <label className="flex items-center justify-between gap-4 rounded-lg border border-white/70 bg-white/50 px-3 py-2 text-sm">
        <span>
          <span className="block font-medium text-slate-800">PDF engine</span>
          <span className="text-slate-600">native дороже, но лучше для сканов</span>
        </span>
        <select
          className="rounded-md border border-slate-200 bg-white px-2 py-1"
          value={settings.pdfEngine}
          onChange={(event) => onSettingsChange({ pdfEngine: event.target.value as SummarySettings['pdfEngine'] })}
        >
          <option value="cloudflare-ai">cloudflare-ai</option>
          <option value="pdf-text">pdf-text legacy</option>
          <option value="native">native</option>
        </select>
      </label>

      {selectedModel?.isFree && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Free-модели могут быстро упереться в лимиты запросов, особенно на видео и больших PDF.
        </div>
      )}

      {selectedModel?.description && (
        <div className="rounded-lg bg-white/60 px-3 py-2 text-sm text-slate-700">
          {selectedModel.description}
        </div>
      )}

      {modelsError && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <RefreshCw className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          <span>{modelsError}</span>
        </div>
      )}

    </GlassCard>
  );
}
