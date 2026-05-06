import React from 'react';

interface Props {
  enabled:    boolean;
  safeMode:   boolean;
  onToggleEnabled:  (v: boolean) => void;
  onToggleSafeMode: (v: boolean) => void;
}

export function AISafeModeToggle({ enabled, safeMode, onToggleEnabled, onToggleSafeMode }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          AI Docs
        </span>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggleEnabled(!enabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">Safe mode</span>
          <button
            role="switch"
            aria-checked={safeMode}
            onClick={() => onToggleSafeMode(!safeMode)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              safeMode ? 'bg-green-500' : 'bg-orange-500'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                safeMode ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {safeMode ? 'AI failures are silent' : 'AI failures block generation'}
          </span>
        </div>
      )}
    </div>
  );
}
