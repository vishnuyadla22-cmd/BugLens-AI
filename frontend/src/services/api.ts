import { API_BASE_URL } from '../config';
import type {
  AIStatusResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  ExecuteRequest,
  ExecuteResponse,
  HealthResponse,
} from '../types';

const API_BASE = API_BASE_URL;

export class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new APIError('Failed to fetch backend health', res.status);
  }
  return res.json();
}

export async function fetchAIStatus(): Promise<AIStatusResponse> {
  const res = await fetch(`${API_BASE}/api/ai/status`);
  if (!res.ok) {
    throw new APIError('Failed to fetch AI service status', res.status);
  }
  return res.json();
}

export async function analyzeCode(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data.detail?.message ||
      data.detail?.error ||
      data.message ||
      (typeof data.detail === 'string' ? data.detail : 'Analysis request failed');
    throw new APIError(errorMsg, res.status, data.detail || data);
  }

  return data;
}

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResponse> {
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data.detail?.message ||
      (typeof data.detail === 'string' ? data.detail : 'Code execution failed');
    throw new APIError(errorMsg, res.status, data);
  }

  return data;
}
