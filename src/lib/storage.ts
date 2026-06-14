import type { SummarySettings } from '../types/summary';

const AUTH_KEY = 'summaryweb_auth_ok';
const API_KEY = 'summaryweb_openrouter_key';
const SETTINGS_KEY = 'summaryweb_settings';

export const PASSWORD_HASH = import.meta.env.VITE_PASSWORD_SHA256?.trim() ?? '';

export const DEFAULT_SETTINGS: SummarySettings = {
  language: 'ru',
  length: 'medium',
  model: 'google/gemini-2.5-flash',
  pdfEngine: 'cloudflare-ai',
  freeOnly: false,
};

export async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === '1';
}

export function setAuthenticated(value: boolean): void {
  if (value) {
    localStorage.setItem(AUTH_KEY, '1');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY) ?? '';
}

export function setApiKey(value: string): void {
  const trimmed = value.trim();
  if (trimmed) {
    localStorage.setItem(API_KEY, trimmed);
  } else {
    localStorage.removeItem(API_KEY);
  }
}

export function getSettings(): SummarySettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as SummarySettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setSettings(settings: SummarySettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
