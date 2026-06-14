import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Trash2, Video } from 'lucide-react';
import { clearSummaries, deleteSummary, listSummaries } from '../lib/history';
import type { SummaryRecord } from '../types/summary';
import { GlassCard } from './GlassCard';

export function HistoryList() {
  const [items, setItems] = useState<SummaryRecord[]>([]);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setItems(await listSummaries());
  }

  async function handleDelete(id: string) {
    await deleteSummary(id);
    await refresh();
  }

  async function handleClear() {
    await clearSummaries();
    await refresh();
  }

  return (
    <GlassCard className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">История</h2>
          <p className="section-subtitle">{items.length ? `${items.length} сохранено` : 'Пока пусто'}</p>
        </div>
        {items.length > 0 && (
          <button className="icon-button" onClick={handleClear} title="Очистить историю" aria-label="Очистить историю">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="history-item">
            <Link className="min-w-0 flex-1" to={`/summary/${item.id}`}>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {item.sourceType === 'pdf' ? (
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Video className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {item.sourceType === 'pdf' ? 'PDF' : 'YouTube'}
              </div>
              <h3 className="mt-1 truncate font-medium text-slate-950">{item.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {new Date(item.createdAt).toLocaleString('ru-RU')}
              </p>
            </Link>
            <button className="icon-button" onClick={() => handleDelete(item.id)} title="Удалить" aria-label="Удалить">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </GlassCard>
  );
}
