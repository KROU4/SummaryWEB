import type { Summary } from '../types/summary';

export function summaryToMarkdown(summary: Summary): string {
  const lines: string[] = [
    `# ${summary.title}`,
    '',
    summary.readingTimeSaved ? `_${summary.readingTimeSaved}_` : '',
    '',
    '## TL;DR',
    summary.tldr,
    '',
    '## Ключевые тезисы',
    ...summary.keyPoints.map((point) => `- ${point}`),
    '',
    '## Разбор',
  ].filter((line, index, all) => line || all[index - 1] !== '');

  for (const section of summary.sections) {
    lines.push('', `### ${section.heading}`, section.summary, '', ...section.points.map((point) => `- ${point}`));
  }

  lines.push('', '## Что применить', ...summary.keyTakeaways.map((point) => `- ${point}`));

  if (summary.notableQuotes?.length) {
    lines.push('', '## Цитаты');
    for (const quote of summary.notableQuotes) {
      lines.push(`- "${quote.text}"${quote.context ? ` — ${quote.context}` : ''}`);
    }
  }

  if (summary.glossary?.length) {
    lines.push('', '## Глоссарий');
    for (const item of summary.glossary) {
      lines.push(`- **${item.term}**: ${item.definition}`);
    }
  }

  if (summary.openQuestions?.length) {
    lines.push('', '## Открытые вопросы', ...summary.openQuestions.map((question) => `- ${question}`));
  }

  return `${lines.join('\n')}\n`;
}

export function downloadMarkdown(summary: Summary): void {
  const blob = new Blob([summaryToMarkdown(summary)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFilename(summary.title)}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function copyMarkdown(summary: Summary): Promise<void> {
  await navigator.clipboard.writeText(summaryToMarkdown(summary));
}

function safeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'summary';
}
