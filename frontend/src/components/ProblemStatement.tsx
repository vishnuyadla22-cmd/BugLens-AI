import React from 'react';
import { BookOpen, Trash2 } from 'lucide-react';

interface ProblemStatementProps {
  value: string;
  onChange: (val: string) => void;
  error?: string | null;
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="problem-statement"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
          <span>Problem Statement</span>
          <span className="text-rose-400">*</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-mono">
            {value.length.toLocaleString()} chars
          </span>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition"
              title="Clear problem statement"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          id="problem-statement"
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the problem statement you are trying to solve..."
          className={`w-full rounded-xl border bg-slate-900/80 p-3.5 text-sm text-slate-200 placeholder-slate-500 transition focus:outline-none focus:ring-1 ${
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
};
