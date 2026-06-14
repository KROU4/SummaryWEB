import { AlertTriangle } from 'lucide-react';

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
