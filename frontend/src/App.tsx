import { useEffect, useState } from 'react';
import { Sparkles, Terminal } from 'lucide-react';
import type {
  AIStatusResponse,
  AnalysisMode,
  AnalyzeResponse,
  ExecuteResponse,
  HealthResponse,
  SampleProblem,
  SuggestedFix,
  SupportedLanguage,
  TestCaseSuggestion,
} from './types';
import {
  analyzeCode,
  executeCode,
  fetchAIStatus,
  fetchHealth,
} from './services/api';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { ProblemStatement } from './components/ProblemStatement';
import { CodeEditor } from './components/CodeEditor';
import { DebuggingInputs } from './components/DebuggingInputs';
import { AnalysisControls } from './components/AnalysisControls';
import { AnalysisResults } from './components/AnalysisResults';
import { SandboxRunner } from './components/SandboxRunner';
import { AIStatusModal } from './components/AIStatusModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

export function App() {
  // Application State
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [actualOutput, setActualOutput] = useState<string>('');
  const [expectedOutput, setExpectedOutput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Validation Errors
  const [problemError, setProblemError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Status & Health
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // Analysis & Execution state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentAnalysisMode, setCurrentAnalysisMode] = useState<AnalysisMode | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalyzeResponse | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecuteResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'sandbox'>('analysis');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Poll / Check initial status
  const checkStatus = async () => {
    try {
      const [h, ai] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchAIStatus().catch(() => null),
      ]);
      if (h) setHealth(h);
      if (ai) setAiStatus(ai);
    } catch {
      // Backend not running yet or connection refused
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Validation helper
  const validateForm = (): boolean => {
    let valid = true;
    if (!problemStatement.trim()) {
      setProblemError('Please provide the problem statement you are trying to solve.');
      valid = false;
    } else {
      setProblemError(null);
    }

    if (!code.trim()) {
      setCodeError('Please paste your code solution.');
      valid = false;
    } else {
      setCodeError(null);
    }

    return valid;
  };

  // Handle Analysis (Find My Error or Why Is My Answer Wrong)
  const handleAnalyze = async (mode: AnalysisMode) => {
    if (!validateForm()) {
      addToast('Please fill in the required problem statement and code fields.', 'error');
      return;
    }

    // Check if AI service is offline
    if (aiStatus && (!aiStatus.connected || !aiStatus.model_available)) {
      setIsAIModalOpen(true);
      addToast('Ollama service is not connected. Check setup instructions.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setCurrentAnalysisMode(mode);
    setHighlightedLine(null);

    try {
      const response = await analyzeCode({
        language,
        problem_statement: problemStatement,
        code,
        custom_input: customInput || undefined,
        actual_output: actualOutput || undefined,
        expected_output: expectedOutput || undefined,
        error_message: errorMessage || undefined,
        analysis_mode: mode,
      });

      setAnalysisResults(response);
      setActiveTab('analysis');

      // Auto-highlight first line number if available
      const firstLineLoc = response.error_locations?.find((l) => l.line_number);
      if (firstLineLoc?.line_number) {
        setHighlightedLine(firstLineLoc.line_number);
      }

      addToast('AI analysis completed successfully!', 'success');
    } catch (err: any) {
      const msg = err.message || 'Analysis failed';
      addToast(msg, 'error');
      // If disconnected, trigger modal
      if (err.status === 503 || msg.includes('Ollama') || msg.includes('connect')) {
        setIsAIModalOpen(true);
      }
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysisMode(null);
    }
  };

  // Handle Sandbox Execution
  const handleExecuteSandbox = async (stdinVal?: string, expectedVal?: string) => {
    if (!code.trim()) {
      setCodeError('Please paste code to execute in the sandbox.');
      addToast('Please provide code before running.', 'error');
      return;
    }
    setCodeError(null);
    setIsExecuting(true);

    try {
      const response = await executeCode({
        language,
        code,
        custom_input: stdinVal !== undefined ? stdinVal : customInput,
        expected_output: expectedVal !== undefined ? expectedVal : expectedOutput || undefined,
      });

      setExecutionResult(response);
      setActiveTab('sandbox');
      addToast(`Execution completed: ${response.status}`, response.status === 'success' ? 'success' : 'info');
    } catch (err: any) {
      addToast(err.message || 'Execution failed', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Load a sample problem
  const handleSelectSample = (sample: SampleProblem) => {
    setLanguage(sample.language);
    setProblemStatement(sample.problem_statement);
    setCode(sample.code);
    setCustomInput(sample.custom_input || '');
    setExpectedOutput(sample.expected_output || '');
    setActualOutput('');
    setErrorMessage('');
    setAnalysisResults(null);
    setExecutionResult(null);
    setHighlightedLine(null);
    setProblemError(null);
    setCodeError(null);
    addToast(`Loaded sample: ${sample.title}`, 'info');
  };

  // Reset all fields
  const handleResetAll = () => {
    setProblemStatement('');
    setCode('');
    setCustomInput('');
    setActualOutput('');
    setExpectedOutput('');
    setErrorMessage('');
    setAnalysisResults(null);
    setExecutionResult(null);
    setHighlightedLine(null);
    setProblemError(null);
    setCodeError(null);
    addToast('Cleared problem statement and code editor.', 'info');
  };

  // Apply a suggested fix to the code in Monaco Editor
  const handleApplyFix = (fix: SuggestedFix) => {
    if (!code) return;

    if (fix.original_snippet && code.includes(fix.original_snippet.trim())) {
      const updatedCode = code.replace(fix.original_snippet.trim(), fix.fixed_snippet);
      setCode(updatedCode);
    } else if (fix.target_line_start) {
      const lines = code.split('\n');
      const startIdx = Math.max(0, fix.target_line_start - 1);
      const endIdx = fix.target_line_end ? fix.target_line_end : fix.target_line_start;
      const deleteCount = Math.max(1, endIdx - startIdx);
      lines.splice(startIdx, deleteCount, fix.fixed_snippet);
      setCode(lines.join('\n'));
    } else {
      // Fallback: replace using full corrected code if available
      if (analysisResults?.corrected_code) {
        setCode(analysisResults.corrected_code);
      }
    }

    if (fix.target_line_start) {
      setHighlightedLine(fix.target_line_start);
    }
  };

  // Run a test case from the suggestions list in the sandbox runner
  const handleExecuteTestCase = (testCase: TestCaseSuggestion) => {
    setCustomInput(testCase.input);
    if (testCase.expected_output) {
      setExpectedOutput(testCase.expected_output);
    }
    setActiveTab('sandbox');
    handleExecuteSandbox(testCase.input, testCase.expected_output);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        aiStatus={aiStatus}
        health={health}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onSelectSample={handleSelectSample}
        onResetAll={handleResetAll}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Step 1: Language Selector */}
        <section aria-label="Programming Language Selection">
          <LanguageSelector
            selectedLanguage={language}
            onSelectLanguage={(lang) => {
              setLanguage(lang);
              addToast(`Switched active language to ${lang === 'cpp' ? 'C++' : 'Python'}`, 'info');
            }}
            disabled={isAnalyzing || isExecuting}
          />
        </section>

        {/* Workspace Grid: Left = Inputs, Right = Results / Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Problem Input, Code Editor, Debugging Info, Action Controls */}
          <div className="lg:col-span-6 space-y-5">
            {/* Step 2: Problem Statement */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg backdrop-blur-sm">
              <ProblemStatement
                value={problemStatement}
                onChange={(val) => {
                  setProblemStatement(val);
                  if (problemError) setProblemError(null);
                }}
                error={problemError}
              />
            </div>

            {/* Step 3: Code Editor */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg backdrop-blur-sm">
              <CodeEditor
                language={language}
                code={code}
                onChange={(val) => {
                  setCode(val);
                  if (codeError) setCodeError(null);
                }}
                highlightedLine={highlightedLine}
                error={codeError}
                onCopyToast={() => addToast('Code copied to clipboard!', 'info')}
              />
            </div>

            {/* Step 4: Optional Debugging Inputs Accordion */}
            <DebuggingInputs
              customInput={customInput}
              actualOutput={actualOutput}
              expectedOutput={expectedOutput}
              errorMessage={errorMessage}
              onChangeCustomInput={setCustomInput}
              onChangeActualOutput={setActualOutput}
              onChangeExpectedOutput={setExpectedOutput}
              onChangeErrorMessage={setErrorMessage}
            />

            {/* Step 5: Analysis Controls */}
            <AnalysisControls
              onAnalyze={handleAnalyze}
              onExecute={() => handleExecuteSandbox()}
              isAnalyzing={isAnalyzing}
              isExecuting={isExecuting}
              currentMode={currentAnalysisMode}
              disabled={isAnalyzing || isExecuting}
            />
          </div>

          {/* Right Column: Results & Sandbox Runner */}
          <div className="lg:col-span-6 space-y-4">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('analysis')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'analysis'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI Diagnosis</span>
                  {analysisResults && (
                    <span className="rounded-full bg-indigo-500/30 px-1.5 py-0.2 text-[10px] text-white">
                      Ready
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('sandbox')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'sandbox'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Terminal className="h-4 w-4" />
                  <span>Sandbox Runner</span>
                  {executionResult && (
                    <span className="rounded-full bg-emerald-500/30 px-1.5 py-0.2 text-[10px] text-white">
                      Done
                    </span>
                  )}
                </button>
              </div>

              {/* View Status */}
              <div className="text-xs text-slate-500 hidden sm:block">
                {activeTab === 'analysis' ? 'Analysis View' : 'Live Execution View'}
              </div>
            </div>

            {/* Tab 1: AI Diagnosis Results */}
            {activeTab === 'analysis' && (
              <div>
                {analysisResults ? (
                  <AnalysisResults
                    results={analysisResults}
                    onApplyFix={handleApplyFix}
                    onHighlightLine={(line) => setHighlightedLine(line)}
                    onExecuteTestCase={handleExecuteTestCase}
                    onCopyToast={(msg) => addToast(msg, 'info')}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">
                        No Analysis Requested Yet
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Select C++ or Python, paste your problem statement and code on the left, then click{' '}
                        <strong className="text-indigo-400 font-semibold">Find My Error</strong> or{' '}
                        <strong className="text-purple-400 font-semibold">Why Is My Answer Wrong?</strong>.
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-xs text-slate-500">
                        Need quick code to test? Use the{' '}
                        <span className="text-indigo-400 font-semibold">"⚡ Load Sample Buggy Code"</span>{' '}
                        dropdown in the top navigation.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Sandbox Runner */}
            {activeTab === 'sandbox' && (
              <SandboxRunner
                language={language}
                executionResult={executionResult}
                isExecuting={isExecuting}
                onExecute={(inVal, expVal) => handleExecuteSandbox(inVal, expVal)}
                initialInput={customInput}
                initialExpected={expectedOutput}
                onCopyToast={(msg) => addToast(msg, 'info')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            BugLens AI • Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady
          </span>
          <span className="text-slate-400">
            Local Open-Weight AI Inference • Zero External Cloud APIs
          </span>
        </div>
      </footer>

      {/* AI Setup & Status Diagnostics Modal */}
      <AIStatusModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        aiStatus={aiStatus}
        onRefresh={checkStatus}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
