import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Terminal,
  AlertOctagon,
  CheckCircle,
} from 'lucide-react';

interface DebuggingInputsProps {
  customInput: string;
  actualOutput: string;
  expectedOutput: string;
  errorMessage: string;
  onChangeCustomInput: (v: string) => void;
  onChangeActualOutput: (v: string) => void;
  onChangeExpectedOutput: (v: string) => void;
  onChangeErrorMessage: (v: string) => void;
}

export const DebuggingInputs: React.FC<DebuggingInputsProps> = ({
  customInput,
  actualOutput,
  expectedOutput,
  errorMessage,
  onChangeCustomInput,
  onChangeActualOutput,
  onChangeExpectedOutput,
  onChangeErrorMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filledCount = [customInput, actualOutput, expectedOutput, errorMessage].filter(
    (s) => s.trim().length > 0
  ).length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span className="uppercase tracking-wider">Optional Debugging Details</span>
          {filledCount > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
              {filledCount} active
            </span>
          )}
          <span className="text-slate-500 font-normal">
            (Custom input, actual/expected outputs, compiler errors)
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[11px]">{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-slate-800 p-4 space-y-4 bg-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="custom-input"
                className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
              >
                <span>Custom Test Input (stdin)</span>
                <span className="text-[10px] text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="custom-input"
                rows={3}
                value={customInput}
                onChange={(e) => onChangeCustomInput(e.target.value)}
                placeholder="e.g. 5&#10;1 2 3 4 5&#10;7"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Expected Output */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="expected-output"
                className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Expected Output</span>
                <span className="text-[10px] text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="expected-output"
                rows={3}
                value={expectedOutput}
                onChange={(e) => onChangeExpectedOutput(e.target.value)}
                placeholder="e.g. 15"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Actual Output */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="actual-output"
                className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
              >
                <FileQuestion className="h-3.5 w-3.5 text-amber-400" />
                <span>Actual Output Received</span>
                <span className="text-[10px] text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="actual-output"
                rows={3}
                value={actualOutput}
                onChange={(e) => onChangeActualOutput(e.target.value)}
                placeholder="e.g. 10 (or Wrong Answer output)"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Compiler or Runtime Error Message */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="error-message"
                className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
              >
                <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                <span>Compiler / Runtime Error Message</span>
                <span className="text-[10px] text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="error-message"
                rows={3}
                value={errorMessage}
                onChange={(e) => onChangeErrorMessage(e.target.value)}
                placeholder="e.g. IndexError: list index out of range&#10;or g++: error: undefined reference"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-rose-300 placeholder-slate-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
