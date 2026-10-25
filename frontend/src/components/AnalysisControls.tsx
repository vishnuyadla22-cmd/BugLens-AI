import React from 'react';
import {
  AlertTriangle,
  HelpCircle,
  Loader2,
  Play,
} from 'lucide-react';
import type { AnalysisMode } from '../types';

interface AnalysisControlsProps {
  onAnalyze: (mode: AnalysisMode) => void;
  onExecute: () => void;
  isAnalyzing: boolean;
  isExecuting: boolean;
  currentMode: AnalysisMode | null;
  disabled: boolean;
}

export const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  onAnalyze,
  onExecute,
  isAnalyzing,
  isExecuting,
  currentMode,
  disabled,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      {/* AI Analysis Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1">
        {/* Find My Error Button */}
        <button
          type="button"
          disabled={disabled || isAnalyzing || isExecuting}
          onClick={() => onAnalyze('find_error')}
          className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all w-full sm:w-auto ${
            isAnalyzing && currentMode === 'find_error'
              ? 'bg-indigo-600/60 ring-2 ring-indigo-400 cursor-wait'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] shadow-indigo-600/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isAnalyzing && currentMode === 'find_error' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Diagnosing Errors...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              <span>Find My Error</span>
            </>
          )}
        </button>

        {/* Why Is My Answer Wrong Button */}
        <button
          type="button"
          disabled={disabled || isAnalyzing || isExecuting}
          onClick={() => onAnalyze('why_wrong')}
          className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all w-full sm:w-auto ${
            isAnalyzing && currentMode === 'why_wrong'
              ? 'bg-purple-600/60 ring-2 ring-purple-400 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-[0.98] shadow-purple-600/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isAnalyzing && currentMode === 'why_wrong' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Analyzing Logic & Edge Cases...</span>
            </>
          ) : (
            <>
              <HelpCircle className="h-4 w-4 text-cyan-300" />
              <span>Why Is My Answer Wrong?</span>
            </>
          )}
        </button>
      </div>

      {/* Execution Sandbox Button */}
      <div className="flex items-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-3">
        <button
          type="button"
          disabled={disabled || isExecuting || isAnalyzing}
          onClick={onExecute}
          className={`flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 active:scale-[0.98] w-full sm:w-auto ${
            isExecuting ? 'cursor-wait opacity-80' : 'cursor-pointer'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Running in Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
              <span>Run Code in Sandbox</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
