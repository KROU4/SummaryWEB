import { useCallback, useEffect, useState } from 'react';
import { fetchOpenRouterModels } from '../lib/openrouter';
import { getApiKey, getSettings, setApiKey, setSettings as persistSettings } from '../lib/storage';
import type { OpenRouterModel, SummarySettings } from '../types/summary';

export function useSettings() {
  const [settings, setSettingsState] = useState<SummarySettings>(() => getSettings());
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsError, setModelsError] = useState('');

  useEffect(() => {
    let active = true;

    fetchOpenRouterModels()
      .then((items) => {
        if (!active) {
          return;
        }
        setModels(items);
        setModelsError('');
        if (!items.some((item) => item.id === settings.model) && items[0]) {
          updateSettings({ model: items[0].id });
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setModelsError(error instanceof Error ? error.message : 'Не удалось загрузить модели.');
      });

    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<SummarySettings>) => {
    setSettingsState((current) => {
      const next = { ...current, ...patch };
      persistSettings(next);
      return next;
    });
  }, []);

  const updateApiKey = useCallback((value: string) => {
    setApiKey(value);
    setApiKeyState(value);
  }, []);

  return { settings, updateSettings, apiKey, updateApiKey, models, modelsError };
}
