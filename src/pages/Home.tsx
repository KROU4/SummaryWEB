import { useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../components/ErrorBanner';
import { HistoryList } from '../components/HistoryList';
import { InputPanel } from '../components/InputPanel';
import { ProcessingState } from '../components/ProcessingState';
import { Settings } from '../components/Settings';
import { useSettings } from '../hooks/useSettings';
import { useSummarize } from '../hooks/useSummarize';
import type { OpenRouterModel } from '../types/summary';

type HomeProps = {
  onLogout: () => void;
};

export function Home({ onLogout }: HomeProps) {
  const navigate = useNavigate();
  const { settings, updateSettings, apiKey, updateApiKey, models, modelsError } = useSettings();
  const { step, error, rawModelResponse, streamText, currentSource, summarize, retry } = useSummarize(apiKey, settings);
  const selectedModel: OpenRouterModel | undefined = models.find((model) => model.id === settings.model);
  const busy = step !== 'idle' && step !== 'done';

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-6">
        <Settings
          apiKey={apiKey}
          onApiKeyChange={updateApiKey}
          settings={settings}
          onSettingsChange={updateSettings}
          models={models}
          modelsError={modelsError}
          onLogout={onLogout}
        />
        <HistoryList />
      </aside>

      <section className="space-y-6">
        <div className="app-heading">
          <span className="badge">Static · OpenRouter</span>
          <h1>BookVideo Summarizer</h1>
        </div>

        <InputPanel
          selectedModel={selectedModel}
          busy={busy}
          onSubmit={async (input) => {
            const record = await summarize(input);
            if (record) {
              navigate(`/summary/${record.id}`);
            }
          }}
        />
        <ErrorBanner message={error} />
        {rawModelResponse && (
          <div className="glass space-y-3 p-4">
            <div>
              <h2 className="section-title">Сырой ответ модели</h2>
              <p className="section-subtitle">JSON не прошел проверку схемы</p>
            </div>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-white/75 p-3 text-xs text-slate-700">
              {rawModelResponse}
            </pre>
            <button
              className="primary-button"
              disabled={busy}
              onClick={async () => {
                const record = await retry();
                if (record) {
                  navigate(`/summary/${record.id}`);
                }
              }}
            >
              Повторить
            </button>
          </div>
        )}
        <ProcessingState step={step} preview={streamText} source={currentSource} />
      </section>
    </main>
  );
}
