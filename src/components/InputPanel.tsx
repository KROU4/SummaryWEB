import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { FileText, Link2, Sparkles } from 'lucide-react';
import type { InputTab, OpenRouterModel } from '../types/summary';
import { GlassCard } from './GlassCard';

type InputPanelProps = {
  selectedModel?: OpenRouterModel;
  busy: boolean;
  onSubmit: (input: { type: 'pdf'; file: File | null } | { type: 'youtube'; url: string }) => void;
};

export function InputPanel({ selectedModel, busy, onSubmit }: InputPanelProps) {
  const [tab, setTab] = useState<InputTab>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');

  const summaryBlocked = selectedModel && !selectedModel.supportsSummary;
  const canSubmit = useMemo(() => {
    if (busy || summaryBlocked) {
      return false;
    }
    return tab === 'pdf' ? Boolean(file) : Boolean(url.trim());
  }, [busy, file, tab, url, summaryBlocked]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit(tab === 'pdf' ? { type: 'pdf', file } : { type: 'youtube', url });
  }

  return (
    <GlassCard className="space-y-5 p-5">
      <div>
        <h2 className="section-title">Новая выжимка</h2>
        <p className="section-subtitle">PDF или YouTube</p>
      </div>

      <div className="segmented" role="tablist" aria-label="Источник">
        <button
          className={tab === 'pdf' ? 'active' : ''}
          type="button"
          onClick={() => setTab('pdf')}
          role="tab"
          aria-selected={tab === 'pdf'}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          PDF
        </button>
        <button
          className={tab === 'youtube' ? 'active' : ''}
          type="button"
          onClick={() => setTab('youtube')}
          role="tab"
          aria-selected={tab === 'youtube'}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          YouTube
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {tab === 'pdf' ? (
          <label className="upload-zone">
            <FileText className="h-8 w-8 text-indigo-600" aria-hidden="true" />
            <span className="font-medium text-slate-900">{file ? file.name : 'Выберите PDF'}</span>
            <span className="text-sm text-slate-600">{file ? `${(file.size / 1024 / 1024).toFixed(1)} МБ` : 'До 25 МБ'}</span>
            <input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">YouTube URL</span>
            <input
              className="field"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </label>
        )}

        {summaryBlocked && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Эта free-модель есть в каталоге, но не подходит для саммаризации PDF или YouTube.
          </p>
        )}

        <button className="primary-button w-full" disabled={!canSubmit}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Работаем...' : 'Сделать выжимку'}
        </button>
      </form>
    </GlassCard>
  );
}
