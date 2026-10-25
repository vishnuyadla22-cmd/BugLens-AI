import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Gauge,
  HelpCircle,
  Lightbulb,
  MapPin,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  AnalyzeResponse,
  SuggestedFix,
  TestCaseSuggestion,
} from '../types';

interface AnalysisResultsProps {
  results: AnalyzeResponse;
  onApplyFix: (fix: SuggestedFix) => void;
  onHighlightLine: (lineNumber: number) => void;
  onExecuteTestCase: (testCase: TestCaseSuggestion) => void;
  onCopyToast: (msg: string) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  results,
  onApplyFix,
  onHighlightLine,
  onExecuteTestCase,
  onCopyToast,
}) => {
  const [copiedCorrected, setCopiedCorrected] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);
  const [appliedFixIndex, setAppliedFixIndex] = useState<number | null>(null);
  const [confirmFixIndex, setConfirmFixIndex] = useState<number | null>(null);

  const getClassificationBadge = (cat: string) => {
    switch (cat) {
      case 'Syntax Error':
      case 'Compilation Error':
        return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
      case 'Runtime Error':
        return 'border-red-500/40 bg-red-500/10 text-red-300';
      case 'Logical Error':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
      case 'Algorithmic or Complexity Issue':
        return 'border-purple-500/40 bg-purple-500/10 text-purple-300';
      case 'Potential Edge-Case Failure':
        return 'border-orange-500/40 bg-orange-500/10 text-orange-300';
      case 'No Obvious Issue Found':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      default:
        return 'border-slate-500/40 bg-slate-500/10 text-slate-300';
    }
  };

  const handleCopyCorrected = () => {
    if (results.corrected_code) {
      navigator.clipboard.writeText(results.corrected_code);
      setCopiedCorrected(true);
      onCopyToast('Full corrected code copied to clipboard!');
      setTimeout(() => setCopiedCorrected(false), 2000);
    }
  };

  const handleCopyFixSnippet = (snippet: string, idx: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(idx);
    onCopyToast('Suggested fix snippet copied!');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleApplyFixClick = (fix: SuggestedFix, idx: number) => {
    onApplyFix(fix);
    setAppliedFixIndex(idx);
    setConfirmFixIndex(null);
    onCopyToast('Suggested fix applied to editor!');
  };

  return (
    <div className="space-y-6">
      {/* Header Assessment Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Diagnosis Overview</h2>
              <p className="text-xs text-slate-400">
                Mode: <span className="font-semibold text-indigo-300">{results.analysis_mode === 'find_error' ? 'Find My Error' : 'Why Is My Answer Wrong?'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-800 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 font-mono">
              Model: {results.model_used}
            </span>
            <span
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                results.confidence === 'high'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : results.confidence === 'medium'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
              }`}
            >
              Confidence: {results.confidence.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Summary text */}
        <p className="mt-4 text-sm leading-relaxed text-slate-200">
          {results.overall_assessment}
        </p>

        {/* Error Classification Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Classifications:
          </span>
          {results.error_classifications.map((cat, idx) => (
            <span
              key={idx}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getClassificationBadge(
                cat
              )}`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Disclaimer Pill */}
        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
          <span>
            <strong className="text-slate-300">Notice:</strong> {results.verification_status}. Always test your code against corner cases using the sandbox runner below.
          </span>
        </div>
      </div>

      {/* Error Locations & Problematic Snippets */}
      {results.error_locations && results.error_locations.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Error Location & Line Reference
            </h3>
          </div>

          <div className="space-y-3">
            {results.error_locations.map((loc, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {loc.line_number ? (
                      <span className="rounded-md bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 font-mono text-xs font-bold text-rose-300">
                        Line {loc.line_number}
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-medium">
                        General Block
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-300">
                      Issue Identified
                    </span>
                  </div>

                  {loc.line_number && (
                    <button
                      type="button"
                      onClick={() => onHighlightLine(loc.line_number!)}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      <span>Highlight in Editor</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {loc.snippet && (
                  <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs text-rose-300">
                    <pre className="whitespace-pre">{loc.snippet}</pre>
                  </div>
                )}

                <p className="text-xs leading-relaxed text-slate-300">
                  {loc.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beginner-Friendly Detailed Explanation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Root Cause Explanation
          </h3>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
          {results.explanation}
        </div>
      </div>

      {/* Suggested Fix (Minimal Replacement) */}
      {results.suggested_fixes && results.suggested_fixes.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Suggested Minimal Fix
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Surgical changes before a full rewrite
            </span>
          </div>

          <div className="space-y-4">
            {results.suggested_fixes.map((fix, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {fix.target_line_start && (
                      <span className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 font-mono text-xs text-indigo-300">
                        Target Lines {fix.target_line_start}
                        {fix.target_line_end && fix.target_line_end !== fix.target_line_start
                          ? ` - ${fix.target_line_end}`
                          : ''}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{fix.explanation}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyFixSnippet(fix.fixed_snippet, idx)}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 transition"
                    >
                      {copiedSnippet === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Fix</span>
                        </>
                      )}
                    </button>

                    {/* Explicit user confirmation to apply fix */}
                    {confirmFixIndex === idx ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyFixClick(fix, idx)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow"
                        >
                          Confirm & Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmFixIndex(null)}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : appliedFixIndex === idx ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold px-2 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmFixIndex(idx)}
                        className="flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
                        title="Apply this suggested fix to the code editor"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Apply Fix</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Diff view: Original vs Fixed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {fix.original_snippet && (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3">
                      <div className="text-[10px] uppercase font-bold text-rose-400 mb-1.5">
                        Current Code
                      </div>
                      <pre className="whitespace-pre text-rose-200 overflow-x-auto">
                        {fix.original_snippet}
                      </pre>
                    </div>
                  )}
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1.5">
                      Suggested Fix
                    </div>
                    <pre className="whitespace-pre text-emerald-200 overflow-x-auto">
                      {fix.fixed_snippet}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Corrected Solution */}
      {results.corrected_code && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Full Corrected Solution
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyCorrected}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              {copiedCorrected ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Corrected Solution</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 max-h-[360px] overflow-y-auto">
            <pre className="whitespace-pre">{results.corrected_code}</pre>
          </div>
        </div>
      )}

      {/* Complexity Analysis Card */}
      {results.complexity_analysis && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Complexity Analysis
              </h3>
            </div>
            <span
              className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                results.complexity_analysis.verdict.toLowerCase().includes('optimal')
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : results.complexity_analysis.verdict.toLowerCase().includes('tle')
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              {results.complexity_analysis.verdict}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                Time Complexity
              </div>
              <div className="text-base font-bold text-indigo-400">
                {results.complexity_analysis.time_complexity}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                Auxiliary Space Complexity
              </div>
              <div className="text-base font-bold text-cyan-400">
                {results.complexity_analysis.space_complexity}
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-300 font-sans">
            {results.complexity_analysis.explanation}
          </p>
        </div>
      )}

      {/* Test Case Suggestions */}
      {results.test_suggestions && results.test_suggestions.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Insightful Test Cases
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              AI Generated suggestions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.test_suggestions.map((tc, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Case #{idx + 1}
                    </span>
                    {tc.is_edge_case && (
                      <span className="rounded bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                        Edge Case
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="rounded bg-slate-900 p-2 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-500 block font-sans">
                        Input:
                      </span>
                      <pre className="whitespace-pre overflow-x-auto text-slate-300">{tc.input}</pre>
                    </div>

                    {tc.expected_output && (
                      <div className="rounded bg-slate-900 p-2 border border-slate-800/80">
                        <span className="text-[10px] uppercase text-slate-500 block font-sans">
                          Expected Output:
                        </span>
                        <pre className="whitespace-pre overflow-x-auto text-emerald-300">{tc.expected_output}</pre>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 italic">
                    Why: {tc.reason}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onExecuteTestCase(tc)}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                  title="Load this test case into sandbox and run"
                >
                  <Play className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                  <span>Execute in Sandbox</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Tip Callout */}
      {results.learning_tip && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Lightbulb className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Learning Tip & Best Practices
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            {results.learning_tip}
          </p>
        </div>
      )}
    </div>
  );
};
