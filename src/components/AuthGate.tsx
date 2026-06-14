import { FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { ErrorBanner } from './ErrorBanner';

type AuthGateProps = {
  error: string;
  onLogin: (password: string) => Promise<boolean>;
};

export function AuthGate({ error, onLogin }: AuthGateProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await onLogin(password);
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <form className="glass w-full space-y-5 p-6" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl text-slate-950">BookVideo Summarizer</h1>
            <p className="text-sm text-slate-600">Локальный вход</p>
          </div>
        </div>

        <ErrorBanner message={error} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Пароль</span>
          <input
            className="field"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button className="primary-button w-full" disabled={busy || !password}>
          {busy ? 'Проверяем...' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
