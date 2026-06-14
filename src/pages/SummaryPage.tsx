import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SummaryView } from '../components/SummaryView';
import { getSummary } from '../lib/history';
import type { SummaryRecord } from '../types/summary';

export function SummaryPage() {
  const { id } = useParams();
  const [record, setRecord] = useState<SummaryRecord | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRecord(null);
      return;
    }

    getSummary(id).then((item) => setRecord(item ?? null));
  }, [id]);

  if (record === undefined) {
    return <main className="mx-auto max-w-4xl px-5 py-10 text-slate-700">Загружаем...</main>;
  }

  if (record === null) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <Link className="link-button" to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад
        </Link>
        <div className="glass mt-6 p-6">
          <h1 className="section-title">Выжимка не найдена</h1>
          <p className="section-subtitle">Запись могла быть удалена из локальной истории.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <Link className="link-button mb-6 print:hidden" to="/">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Назад
      </Link>
      <SummaryView summary={record.summary} />
    </main>
  );
}
