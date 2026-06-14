const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export function normalizeYouTubeUrl(input: string): { url?: string; error?: string } {
  const raw = input.trim();
  if (!raw) {
    return { error: 'Вставьте ссылку на YouTube.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: 'Ссылка выглядит некорректно.' };
  }

  if (!YOUTUBE_HOSTS.has(parsed.hostname)) {
    return { error: 'Поддерживаются только публичные ссылки YouTube.' };
  }

  const videoId = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
  if (!videoId || !/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
    return { error: 'Не удалось найти ID видео в ссылке.' };
  }

  return { url: `https://www.youtube.com/watch?v=${videoId}` };
}
