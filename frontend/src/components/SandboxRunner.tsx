import React, { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  Loader2,
  Play,
  Terminal,
} from 'lucide-react';
import type { ExecuteResponse, SupportedLanguage } from '../types';

interface SandboxRunnerProps {
  language: SupportedLanguage;
  executionResult: ExecuteResponse | null;
  isExecuting: boolean;
  onExecute: (customInput: string, expectedOutput: string) => void;
  initialInput?: string;
  initialExpected?: string;
  onCopyToast: (msg: string) => void;
}

export const SandboxRunner: React.FC<SandboxRunnerProps> = ({
  language,
  executionResult,
  isExecuting,
  onExecute,
  initialInput = '',
  initialExpected = '',
  onCopyToast,
}) => {
  const [inputVal, setInputVal] = useState(initialInput);
  const [expectedVal, setExpectedVal] = useState(initialExpected);

  // Sync if props change
  React.useEffect(() => {
    if (initialInput) setInputVal(initialInput);
  }, [initialInput]);

  React.useEffect(() => {
    if (initialExpected) setExpectedVal(initialExpected);
  }, [initialExpected]);

  const handleRun = () => {
    onExecute(inputVal, expectedVal);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      case 'compilation_error':
        return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
      case 'runtime_error':
        return 'border-red-500/40 bg-red-500/10 text-red-300';
      case 'timeout':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
      default:
        return 'border-slate-500/40 bg-slate-500/10 text-slate-300';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Sandbox Execution & Verification</h3>
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
            {language === 'cpp' ? 'C++ MinGW g++' : 'Python 3'}
          </span>
        </div>

        <button
          type="button"
          disabled={isExecuting}
          onClick={handleRun}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Executing in Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>

      {/* Input / Expected Output Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span>Standard Input (stdin)</span>
            <span className="text-[10px] text-slate-500">Passed to program</span>
          </label>
          <textarea
            rows={3}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Provide standard input..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span>Expected Output (Optional)</span>
            <span className="text-[10px] text-slate-500">For automated diff</span>
          </label>
          <textarea
            rows={3}
            value={expectedVal}
            onChange={(e) => setExpectedVal(e.target.value)}
            placeholder="Provide expected output to verify..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Execution Results View */}
      {executionResult && (
        <div className="space-y-4 pt-2">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Result:</span>
              <span
                className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getStatusBadge(
                  executionResult.status
                )}`}
              >
                {executionResult.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span>{executionResult.execution_time_ms} ms</span>
              </span>
              <span>•</span>
              <span>Exit Code: {executionResult.exit_code ?? 'N/A'}</span>
            </div>
          </div>

          {/* Comparison Card (if expected output was provided) */}
          {executionResult.comparison && (
            <div
              className={`rounded-xl border p-4 text-xs space-y-2 ${
                executionResult.comparison.is_exact_match
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : executionResult.comparison.is_formatting_difference_only
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  {executionResult.comparison.is_exact_match ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Exact Match</span>
                    </>
                  ) : executionResult.comparison.is_formatting_difference_only ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>Logical Match (Formatting Discrepancy)</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="h-4 w-4 text-rose-400" />
                      <span>Output Mismatch</span>
                    </>
                  )}
                </div>
              </div>
              <p className="leading-relaxed">{executionResult.comparison.details}</p>
            </div>
          )}

          {/* Program Standard Output */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Standard Output (stdout)</span>
              {executionResult.stdout && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(executionResult.stdout);
                    onCopyToast('Standard output copied!');
                  }}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 min-h-[60px] max-h-[220px] overflow-y-auto">
              {executionResult.stdout ? (
                <pre className="whitespace-pre">{executionResult.stdout}</pre>
              ) : (
                <span className="text-slate-600 italic">No output produced</span>
              )}
            </div>
          </div>

          {/* Program Standard Error (if any) */}
          {executionResult.stderr && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-rose-400 font-semibold">
                <span>Standard Error & Compiler Diagnostics (stderr)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(executionResult.stderr);
                    onCopyToast('Error log copied!');
                  }}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 font-mono text-xs text-rose-300 max-h-[220px] overflow-y-auto">
                <pre className="whitespace-pre">{executionResult.stderr}</pre>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-lg bg-slate-950/60 p-2.5 text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{executionResult.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
