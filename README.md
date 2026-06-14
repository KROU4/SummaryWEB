# BookVideo Summarizer

Статическое веб-приложение для структурированных выжимок из PDF и публичных YouTube-ссылок через OpenRouter.

Проект рассчитан на public GitHub repository: в репозитории не должно быть пользовательских секретов или других приватных значений.

## Возможности

- Выжимка из PDF.
- Выжимка из публичной YouTube-ссылки через субтитры: сначала Cloudflare Worker получает transcript, затем OpenRouter получает обычный текст.
- Структурированный результат: `TL;DR`, ключевые тезисы, разделы, выводы, цитаты, глоссарий и открытые вопросы.
- Локальная история в IndexedDB.
- Экспорт результата в Markdown, копирование в буфер и печать через браузер.
- Анимированное состояние обработки, чтобы было видно активный запрос.
- Каталог актуальных free-моделей OpenRouter с проверкой совместимости.

## Стек

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- IndexedDB через `idb`
- OpenRouter REST API
- Cloudflare Worker для YouTube transcript endpoint

## Безопасность и публичный репозиторий

- Не коммитьте секреты в репозиторий.
- Runtime-значения вводятся пользователем в интерфейсе и остаются в браузере.
- Build-time значения задаются через локальные переменные окружения или GitHub Actions Variables.
- Локальный password gate не является шифрованием и не заменяет настоящую авторизацию.

## Локальный запуск

```powershell
pnpm install
pnpm dev
```

Откройте локальный адрес, который напечатает Vite.

Для YouTube-ссылок нужен transcript endpoint:

```powershell
pnpm worker:dev
```

В отдельной локальной переменной окружения для Vite задайте URL Worker endpoint:

```text
VITE_TRANSCRIPT_API_URL=http://localhost:8787/api/transcript
```

Также задайте `VITE_PASSWORD_SHA256`, если хотите оставить локальный password gate включенным.

## Модели

Приложение загружает live metadata из OpenRouter `/models` и использует встроенный каталог только как curated fallback.

Текущий curated-каталог оставляет только модели, найденные в публичном `/models` OpenRouter и имеющие `text` output:

- `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`
- `google/gemma-4-26b-a4b-it:free`
- `google/gemma-4-31b-it:free`
- `liquid/lfm-2.5-1.2b-instruct:free`
- `liquid/lfm-2.5-1.2b-thinking:free`
- `meta-llama/llama-3.2-3b-instruct:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `nex-agi/nex-n2-pro:free`
- `nousresearch/hermes-3-llama-3.1-405b:free`
- `nvidia/nemotron-3-nano-30b-a3b:free`
- `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
- `nvidia/nemotron-3-super-120b-a12b:free`
- `nvidia/nemotron-3-ultra-550b-a55b:free`
- `nvidia/nemotron-nano-12b-v2-vl:free`
- `nvidia/nemotron-nano-9b-v2:free`
- `openai/gpt-oss-120b:free`
- `openai/gpt-oss-20b:free`
- `openrouter/free`
- `poolside/laguna-m.1:free`
- `poolside/laguna-xs.2:free`
- `qwen/qwen3-coder:free`
- `qwen/qwen3-next-80b-a3b-instruct:free`

Для YouTube приложение больше не отправляет `video_url` в модель. Оно получает субтитры через Worker и отправляет в OpenRouter обычный текст, поэтому free-моделям не нужен `video input`.

## Cloudflare Worker для субтитров

Worker находится в:

```text
worker/src/
wrangler.toml
```

Локальный запуск:

```powershell
pnpm worker:dev
```

Деплой:

```powershell
pnpm worker:deploy
```

После деплоя добавьте URL endpoint в build-time variable фронтенда:

```text
VITE_TRANSCRIPT_API_URL=https://<worker-host>/api/transcript
```

Worker поддерживает CORS. При необходимости ограничьте origin переменной `ALLOWED_ORIGIN` на стороне Cloudflare.

## Проверки

```powershell
pnpm lint
pnpm test
pnpm build
```

## GitHub Pages

Рекомендуемый способ деплоя: загрузить исходники в GitHub, а сборку выполнять через GitHub Actions.

1. Создайте пустой GitHub repository.
2. Привяжите локальную папку:

```powershell
git init
git branch -M main
git remote add origin https://github.com/<github-user>/<repo-name>.git
git add .
git commit -m "Ship static OpenRouter summarizer" -m "Constraint: Static GitHub Pages app with no backend.
Confidence: high
Scope-risk: moderate
Tested: pnpm lint; pnpm test; pnpm build"
git push -u origin main
```

3. В GitHub repository откройте `Settings` -> `Pages`.
4. В `Build and deployment` выберите `GitHub Actions`.
5. В `Settings` -> `Secrets and variables` -> `Actions` -> `Variables` задайте build-time переменные, которые нужны вашему деплою.
6. Запустите workflow `Deploy Pages` во вкладке `Actions`.

Workflow уже находится в:

```text
.github/workflows/deploy.yml
```

## Ручная сборка

```powershell
pnpm build
```

Готовые статические файлы появятся в:

```text
dist/
```

Скрипт сборки копирует `dist/index.html` в `dist/404.html`, чтобы HashRouter SPA корректно открывалась на GitHub Pages.

## Структура

```text
src/lib/openrouter.ts        OpenRouter client, model metadata, payloads, errors
src/lib/freeModels.ts        curated-каталог актуальных free-моделей
src/lib/prompts.ts           системный промпт и JSON schema
src/lib/transcript.ts        frontend-клиент transcript endpoint
src/hooks/useSummarize.ts    основной сценарий PDF/YouTube -> transcript -> OpenRouter -> IndexedDB
src/components/Settings.tsx  настройки и выбор модели
src/components/InputPanel.tsx PDF/YouTube input
src/components/ProcessingState.tsx анимированное состояние обработки
src/components/SummaryView.tsx рендер результата
src/lib/history.ts           IndexedDB
src/lib/export.ts            Markdown/copy/print export
worker/src/transcript.ts     Cloudflare Worker endpoint для YouTube-субтитров
```

## Частые проблемы

### YouTube не получает субтитры

Проверьте, что `VITE_TRANSCRIPT_API_URL` настроен и Worker доступен. Если у видео нет доступных субтитров, приложение покажет ошибку без fallback на прямую отправку видео.

### Ошибка лимитов

Free-модели могут иметь жесткие лимиты. Подождите, выберите другую модель или используйте модель с доступным балансом.

### Невалидный JSON

Приложение делает один автоматический повтор. Если повтор тоже не помог, оно покажет сырой ответ модели и кнопку повторного запуска.

### Белый экран на Pages

Проверьте, что workflow завершился успешно, Pages source установлен в `GitHub Actions`, а в `dist/` есть `index.html` и `404.html`.
