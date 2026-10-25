import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HardDrive,
  RefreshCw,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import type { AIStatusResponse } from '../types';

interface AIStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiStatus: AIStatusResponse | null;
  onRefresh: () => Promise<void>;
}

export const AIStatusModal: React.FC<AIStatusModalProps> = ({
  isOpen,
  onClose,
  aiStatus,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const isFullyReady = aiStatus?.connected && aiStatus?.model_available;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isFullyReady
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : aiStatus?.connected
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}
            >
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Local AI Engine Status
              </h2>
              <p className="text-xs text-slate-400">
                Powered by Ollama & Open-Weight Coding Models
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`rounded-xl border p-4 text-xs space-y-1.5 ${
              isFullyReady
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : aiStatus?.connected
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {isFullyReady ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>AI Engine Operational & Ready</span>
                </>
              ) : aiStatus?.connected ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Ollama Connected — Model Download Needed</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Ollama Service Not Detected Locally</span>
                </>
              )}
            </div>
            <p className="leading-relaxed">
              {aiStatus?.message || 'Inspecting local Ollama service...'}
            </p>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold">
                Service Endpoint
              </span>
              <div className="text-slate-200 truncate">
                {aiStatus?.service_url || 'http://localhost:11434'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold">
                Configured Model
              </span>
              <div className="text-indigo-400 font-bold">
                {aiStatus?.configured_model || 'qwen2.5-coder:7b'}
              </div>
            </div>
          </div>

          {/* Installed Models list if any */}
          {aiStatus?.available_models && aiStatus.available_models.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-slate-300">
                Models Installed on this Device:
              </span>
              <div className="flex flex-wrap gap-2">
                {aiStatus.available_models.map((m) => (
                  <span
                    key={m}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-slate-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Setup Commands & Guide */}
          {(!isFullyReady || !aiStatus?.connected) && (
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span>How to Get Ready in 2 Minutes</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Step 1: Install Ollama */}
                <div className="space-y-1">
                  <span className="text-slate-300 font-semibold">
                    1. Install Ollama (Free & Open Source)
                  </span>
                  <p className="text-slate-400">
                    Download and install Ollama from{' '}
                    <a
                      href="https://ollama.com/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 underline inline-flex items-center gap-1 hover:text-indigo-300"
                    >
                      ollama.com/download <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                {/* Step 2: Start Service */}
                <div className="space-y-1">
                  <span className="text-slate-300 font-semibold">
                    2. Start the Ollama Service
                  </span>
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-xs text-indigo-300">
                    <code>ollama serve</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('ollama serve')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedCmd === 'ollama serve' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 3: Pull Model */}
                <div className="space-y-1">
                  <span className="text-slate-300 font-semibold">
                    3. Pull the Open-Weight Coding Model
                  </span>
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-xs text-indigo-300">
                    <code>ollama pull {aiStatus?.configured_model || 'qwen2.5-coder:7b'}</code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(`ollama pull ${aiStatus?.configured_model || 'qwen2.5-coder:7b'}`)
                      }
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedCmd === `ollama pull ${aiStatus?.configured_model || 'qwen2.5-coder:7b'}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hardware & Offline Notes */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <HardDrive className="h-4 w-4 text-cyan-400" />
              <span>Offline Operation & Hardware Requirements</span>
            </div>
            <ul className="list-disc list-inside space-y-1 leading-relaxed text-[11px]">
              <li>
                <strong>100% Offline & Private:</strong> Once the model is pulled, BugLens AI operates without any internet connection. Your source code never leaves your local machine.
              </li>
              <li>
                <strong>qwen2.5-coder:7b:</strong> Requires ~8GB system RAM or 6GB VRAM. (Recommended)
              </li>
              <li>
                <strong>Lightweight alternative:</strong> If running on lower RAM, pull{' '}
                <code className="text-cyan-300">ollama pull qwen2.5-coder:1.5b</code> and update{' '}
                <code className="text-cyan-300">OLLAMA_MODEL=qwen2.5-coder:1.5b</code> in your{' '}
                <code className="text-cyan-300">.env</code>.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-950/60">
          <span className="text-[11px] text-slate-500">
            BugLens AI does not require paid external API keys.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={refreshing}
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
