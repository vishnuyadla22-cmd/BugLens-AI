import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import {
  Code,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface CodeEditorProps {
  language: SupportedLanguage;
  code: string;
  onChange: (val: string) => void;
  highlightedLine?: number | null;
  error?: string | null;
  onCopyToast?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  code,
  onChange,
  highlightedLine,
  error,
  onCopyToast,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Update line highlights when highlightedLine changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    if (highlightedLine && highlightedLine > 0) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monacoRef.current.Range(highlightedLine, 1, highlightedLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-rose-500/20 border-l-4 border-rose-500',
            glyphMarginClassName: 'text-rose-500 font-bold',
            hoverMessage: { value: `⚠️ Likely error location identified at line ${highlightedLine}` },
          },
        },
      ]);
      editorRef.current.revealLineInCenter(highlightedLine);
    } else {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [highlightedLine]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onCopyToast) onCopyToast();
    setTimeout(() => setCopied(false), 2000);
  };

  const monacoLanguage = language === 'cpp' ? 'cpp' : 'python';

  return (
    <div className="flex flex-col gap-1.5">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Code className="h-3.5 w-3.5 text-indigo-400" />
            <span>Code Solution</span>
            <span className="text-rose-400">*</span>
          </label>
          <span
            className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${
              language === 'cpp'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {language === 'cpp' ? 'C++ (C++14)' : 'Python 3'}
          </span>
          {highlightedLine && (
            <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-300 border border-rose-500/30 animate-pulse">
              Highlighting Line {highlightedLine}
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono">
            {code.split('\n').length} lines
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
            title="Clear editor code"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title={expanded ? 'Compress editor' : 'Expand editor'}
          >
            {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div
        className={`overflow-hidden rounded-xl border transition-all ${
          error
            ? 'border-rose-500/60 ring-1 ring-rose-500/50'
            : 'border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500'
        }`}
      >
        <Editor
          height={expanded ? '560px' : '360px'}
          language={monacoLanguage}
          value={code}
          theme="vs-dark"
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            lineNumbers: 'on',
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
          }}
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
