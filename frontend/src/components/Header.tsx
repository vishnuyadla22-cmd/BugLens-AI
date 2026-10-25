import React from 'react';
import { Bug, RotateCcw } from 'lucide-react';
import type { AIStatusResponse, HealthResponse, SampleProblem } from '../types';
import { SAMPLE_PROBLEMS } from '../constants/samples';

interface HeaderProps {
  aiStatus: AIStatusResponse | null;
  health: HealthResponse | null;
  onOpenAIModal: () => void;
  onSelectSample: (sample: SampleProblem) => void;
  onResetAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  aiStatus,
  onOpenAIModal,
  onSelectSample,
  onResetAll,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25">
            <Bug className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                BugLens <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                Local Open-Weight AI
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              See the Bug. Understand the Cause. Fix with Confidence.
            </p>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-3">
          {/* Sample Selector */}
          <div className="relative">
            <select
              aria-label="Load Sample Problem"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              defaultValue=""
              onChange={(e) => {
                const sample = SAMPLE_PROBLEMS.find((s) => s.id === e.target.value);
                if (sample) {
                  onSelectSample(sample);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>
                ⚡ Load Sample Buggy Code...
              </option>
              {SAMPLE_PROBLEMS.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.title}
                </option>
              ))}
            </select>
          </div>

          {/* Reset All */}
          <button
            onClick={onResetAll}
            title="Reset problem and editor"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Clear</span>
          </button>

          {/* Ollama Status Pill */}
          <button
            onClick={onOpenAIModal}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              aiStatus?.connected && aiStatus?.model_available
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : aiStatus?.connected
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                aiStatus?.connected && aiStatus?.model_available
                  ? 'bg-emerald-400 animate-pulse'
                  : aiStatus?.connected
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="font-semibold">
              {aiStatus?.connected && aiStatus?.model_available
                ? `AI: ${aiStatus.configured_model}`
                : aiStatus?.connected
                ? `Model Missing: ${aiStatus.configured_model}`
                : 'AI Service Offline'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
