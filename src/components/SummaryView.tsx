import { motion } from 'framer-motion';
import { ClipboardCopy, Download, Printer, Quote } from 'lucide-react';
import { copyMarkdown, downloadMarkdown } from '../lib/export';
import type { Summary } from '../types/summary';

type SummaryViewProps = {
  summary: Summary;
};

export function SummaryView({ summary }: SummaryViewProps) {
  return (
    <article className="summary-layout">
      <header className="summary-header">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge">{summary.sourceType === 'pdf' ? 'PDF' : 'YouTube'}</span>
            {summary.readingTimeSaved && <span className="badge muted">{summary.readingTimeSaved}</span>}
          </div>
          <h1 className="max-w-3xl font-display text-3xl leading-tight text-slate-950 sm:text-4xl">{summary.title}</h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <button className="icon-button" onClick={() => copyMarkdown(summary)} title="Копировать" aria-label="Копировать">
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
          </button>
          <button className="icon-button" onClick={() => downloadMarkdown(summary)} title="Скачать MD" aria-label="Скачать MD">
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
          <button className="icon-button" onClick={() => window.print()} title="Печать" aria-label="Печать">
            <Printer className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <motion.section className="glass p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="summary-title">TL;DR</h2>
        <p className="summary-text text-lg">{summary.tldr}</p>
      </motion.section>

      <section>
        <h2 className="summary-title">Ключевые тезисы</h2>
        <ol className="glass divide-y divide-slate-200/70 overflow-hidden">
          {summary.keyPoints.map((point, index) => (
            <motion.li
              className="summary-point"
              key={point}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p className="summary-text">{point}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="summary-title">Разбор</h2>
        {summary.sections.map((section) => (
          <motion.div className="glass p-5" key={section.heading} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="mb-2 text-xl font-semibold text-slate-950">{section.heading}</h3>
            <p className="summary-text">{section.summary}</p>
            <ul className="mt-4 space-y-2">
              {section.points.map((point) => (
                <li className="summary-bullet" key={point}>
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </section>

      <section className="glass p-5">
        <h2 className="summary-title">Что применить</h2>
        <ul className="space-y-2">
          {summary.keyTakeaways.map((point) => (
            <li className="summary-bullet" key={point}>
              {point}
            </li>
          ))}
        </ul>
      </section>

      {summary.notableQuotes?.length ? (
        <section>
          <h2 className="summary-title">Цитаты</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {summary.notableQuotes.map((quote) => (
              <div className="glass p-4" key={quote.text}>
                <Quote className="mb-3 h-5 w-5 text-indigo-500" aria-hidden="true" />
                <p className="summary-text">«{quote.text}»</p>
                {quote.context && <p className="mt-2 text-sm text-slate-500">{quote.context}</p>}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(summary.glossary?.length || summary.openQuestions?.length) && (
        <section className="grid gap-4 md:grid-cols-2">
          {summary.glossary?.length ? (
            <div className="glass p-5">
              <h2 className="summary-title">Глоссарий</h2>
              <dl className="space-y-3">
                {summary.glossary.map((item) => (
                  <div key={item.term}>
                    <dt className="font-semibold text-slate-950">{item.term}</dt>
                    <dd className="summary-text">{item.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {summary.openQuestions?.length ? (
            <div className="glass p-5">
              <h2 className="summary-title">Открытые вопросы</h2>
              <ul className="space-y-2">
                {summary.openQuestions.map((question) => (
                  <li className="summary-bullet" key={question}>
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    </article>
  );
}
