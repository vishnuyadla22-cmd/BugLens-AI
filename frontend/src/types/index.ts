export type SupportedLanguage = 'cpp' | 'python';

export type AnalysisMode = 'find_error' | 'why_wrong';

export type ErrorClassification =
  | 'Syntax Error'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Logical Error'
  | 'Algorithmic or Complexity Issue'
  | 'Potential Edge-Case Failure'
  | 'No Obvious Issue Found'
  | 'Insufficient Information';

export interface ErrorLocation {
  line_number?: number;
  snippet?: string;
  explanation: string;
}

export interface SuggestedFix {
  target_line_start?: number;
  target_line_end?: number;
  original_snippet?: string;
  fixed_snippet: string;
  explanation: string;
}

export interface TestCaseSuggestion {
  input: string;
  expected_output?: string;
  reason: string;
  is_edge_case: boolean;
  executed?: boolean;
}

export interface ComplexityAnalysis {
  time_complexity: string;
  space_complexity: string;
  verdict: string;
  explanation: string;
}

export interface AnalyzeResponse {
  overall_assessment: string;
  error_classifications: string[];
  error_locations: ErrorLocation[];
  explanation: string;
  suggested_fixes: SuggestedFix[];
  corrected_code?: string;
  test_suggestions: TestCaseSuggestion[];
  complexity_analysis?: ComplexityAnalysis;
  learning_tip: string;
  verification_status: string;
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
  model_used: string;
  analysis_mode: AnalysisMode;
}

export interface AnalyzeRequest {
  language: SupportedLanguage;
  problem_statement: string;
  code: string;
  custom_input?: string;
  actual_output?: string;
  expected_output?: string;
  error_message?: string;
  analysis_mode: AnalysisMode;
}

export interface ExecuteRequest {
  language: SupportedLanguage;
  code: string;
  custom_input?: string;
  expected_output?: string;
}

export type ExecutionStatus =
  | 'success'
  | 'compilation_error'
  | 'runtime_error'
  | 'timeout'
  | 'error';

export interface OutputComparison {
  is_match: boolean;
  is_exact_match: boolean;
  is_formatting_difference_only: boolean;
  details: string;
  actual_trimmed: string;
  expected_trimmed: string;
}

export interface ExecuteResponse {
  status: ExecutionStatus;
  exit_code?: number;
  stdout: string;
  stderr: string;
  execution_time_ms: number;
  timed_out: boolean;
  comparison?: OutputComparison;
  disclaimer: string;
}

export interface AIStatusResponse {
  connected: boolean;
  service_url: string;
  configured_model: string;
  model_available: boolean;
  available_models: string[];
  message: string;
  setup_instructions?: string[];
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  timestamp: string;
  sandbox_available: boolean;
  cpp_compiler_available: boolean;
}

export interface SampleProblem {
  id: string;
  title: string;
  language: SupportedLanguage;
  mode: AnalysisMode;
  problem_statement: string;
  code: string;
  custom_input?: string;
  expected_output?: string;
  description: string;
}
