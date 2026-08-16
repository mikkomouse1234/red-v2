import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props { message: string; onRetry?: () => void; }
export const ErrorState: React.FC<Props> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
    <AlertCircle className="w-10 h-10 text-red-500" />
    <p className="text-sm text-zinc-300 max-w-xs leading-relaxed">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100">
        <RefreshCw className="w-3.5 h-3.5" /> Try Again
      </button>
    )}
  </div>
);
