import React from 'react';
import { CheckCircle2, Cpu, FileCode2 } from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Step 1: Select Programming Language <span className="text-rose-400">*</span>
        </label>
        <span className="text-[11px] text-slate-500">
          Active: <strong className="text-indigo-400">{selectedLanguage === 'cpp' ? 'C++' : 'Python'}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* C++ Card */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectLanguage('cpp')}
          className={`group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
            selectedLanguage === 'cpp'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition ${
              selectedLanguage === 'cpp'
                ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-300'
                : 'border-slate-800 bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
            }`}
          >
            <Cpu className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">C++</span>
              {selectedLanguage === 'cpp' && (
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              C++14/17 standard library, strict types, pointers, vectors & manual memory.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-indigo-300">
                MinGW g++
              </span>
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5">STL</span>
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5">Competitive Ready</span>
            </div>
          </div>
        </button>

        {/* Python Card */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectLanguage('python')}
          className={`group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
            selectedLanguage === 'python'
              ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition ${
              selectedLanguage === 'python'
                ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300'
                : 'border-slate-800 bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
            }`}
          >
            <FileCode2 className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">Python</span>
              {selectedLanguage === 'python' && (
                <CheckCircle2 className="h-5 w-5 text-cyan-400" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Python 3.14 dynamic typing, native high-level collections, and standard math.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-cyan-300">
                Python 3.14
              </span>
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5">Builtins</span>
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5">Fast Prototyping</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
