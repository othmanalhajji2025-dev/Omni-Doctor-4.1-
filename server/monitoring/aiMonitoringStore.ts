/**
 * AI Monitoring & Telemetry Store
 * Phase 9 — Administration Module
 * 
 * Mandates:
 * 1. Monitor Requests, Errors, Latency, and Token Usage across models and endpoints.
 * 2. Privacy Principle: Do NOT store or expose sensitive clinical data or PII (Personally Identifiable Information).
 * 3. Aggregates time-series data for analytics, percentiles (P50, P90, P99), and model distribution.
 */

import fs from 'fs';
import path from 'path';

export interface AiRequestLog {
  id: string;
  timestamp: string;
  endpoint: string;
  model: string;
  latencyMs: number;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  statusCode: number;
  success: boolean;
  errorCategory?: 'NONE' | 'SAFETY_VIOLATION' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_REQUEST' | 'INTERNAL_ERROR';
  anonymizedIntent: string;
  characterCount: number;
}

export interface AiMonitoringSummary {
  totalRequests: number;
  totalErrors: number;
  errorRatePercentage: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p99LatencyMs: number;
  totalTokensUsed: number;
  promptTokensUsed: number;
  responseTokensUsed: number;
  modelBreakdown: Record<string, { requests: number; tokens: number; avgLatencyMs: number; errors: number }>;
  endpointBreakdown: Record<string, { requests: number; tokens: number; errors: number }>;
  errorBreakdown: Record<string, number>;
  hourlyMetrics: Array<{
    hour: string;
    requests: number;
    errors: number;
    avgLatency: number;
    tokens: number;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const MONITORING_FILE = path.join(DATA_DIR, 'ai_monitoring_logs.json');
const MAX_LOGS_KEPT = 1000;

export class AiMonitoringStore {
  private logs: AiRequestLog[] = [];

  constructor() {
    this.ensureDirectory();
    this.loadLogs();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[AiMonitoringStore] Failed to initialize directory:', err);
    }
  }

  private loadLogs(): void {
    try {
      if (fs.existsSync(MONITORING_FILE)) {
        const data = fs.readFileSync(MONITORING_FILE, 'utf-8');
        this.logs = JSON.parse(data);
      } else {
        this.seedInitialMetrics();
        this.saveToFile();
      }
    } catch (err) {
      console.warn('[AiMonitoringStore] Error reading logs, seeding defaults:', err);
      this.seedInitialMetrics();
    }
  }

  private saveToFile(): void {
    try {
      this.ensureDirectory();
      const trimmed = this.logs.slice(-MAX_LOGS_KEPT);
      fs.writeFileSync(MONITORING_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[AiMonitoringStore] Failed to save logs:', err);
    }
  }

  private seedInitialMetrics(): void {
    const now = Date.now();
    const seededLogs: AiRequestLog[] = [];
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.7-flash'];
    const endpoints = [
      '/api/chat',
      '/api/rag/retrieve',
      '/api/safety/evaluate',
      '/api/drugs/search',
      '/api/labs/interpret',
      '/api/documents/extract-ocr',
    ];
    const intents = [
      'Symptom Triage Inquiry',
      'Drug Interaction Screening',
      'Lab Value Contextual Analysis',
      'Clinical Evidence Retrieval',
      'Pediatric Dosage Calculation',
      'Document OCR Classification',
      'Emergency Red Flag Detection',
    ];

    // Seed 72 realistic request logs across the past 24 hours
    for (let i = 72; i >= 0; i--) {
      const time = new Date(now - i * 20 * 60 * 1000).toISOString();
      const model = models[i % models.length];
      const endpoint = endpoints[i % endpoints.length];
      const isError = i === 14 || i === 38;
      const latency = isError
        ? 1200 + Math.floor(Math.random() * 800)
        : model === 'gemini-2.5-pro'
        ? 650 + Math.floor(Math.random() * 450)
        : 220 + Math.floor(Math.random() * 280);

      const promptTokens = 180 + Math.floor(Math.random() * 450);
      const responseTokens = isError ? 0 : 250 + Math.floor(Math.random() * 650);

      seededLogs.push({
        id: `aim_${Date.now().toString(36)}_${i}`,
        timestamp: time,
        endpoint,
        model,
        latencyMs: latency,
        promptTokens,
        responseTokens,
        totalTokens: promptTokens + responseTokens,
        statusCode: isError ? 500 : 200,
        success: !isError,
        errorCategory: isError ? (i === 14 ? 'RATE_LIMIT' : 'SAFETY_VIOLATION') : 'NONE',
        anonymizedIntent: intents[i % intents.length],
        characterCount: 120 + Math.floor(Math.random() * 500),
      });
    }

    this.logs = seededLogs;
  }

  /**
   * Log an AI Request safely without recording PII or raw patient transcripts
   */
  public logRequest(log: Omit<AiRequestLog, 'id' | 'timestamp'>): AiRequestLog {
    const newLog: AiRequestLog = {
      ...log,
      id: `aim_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(newLog);
    if (this.logs.length > MAX_LOGS_KEPT) {
      this.logs = this.logs.slice(-MAX_LOGS_KEPT);
    }
    this.saveToFile();
    return newLog;
  }

  /**
   * Get filtered logs with pagination
   */
  public getLogs(filter?: {
    model?: string;
    endpoint?: string;
    successOnly?: boolean;
    errorsOnly?: boolean;
    limit?: number;
  }): AiRequestLog[] {
    let result = [...this.logs].reverse();

    if (filter?.model) {
      result = result.filter((l) => l.model.toLowerCase() === filter.model?.toLowerCase());
    }
    if (filter?.endpoint) {
      result = result.filter((l) => l.endpoint.toLowerCase().includes(filter.endpoint?.toLowerCase() || ''));
    }
    if (filter?.successOnly) {
      result = result.filter((l) => l.success);
    }
    if (filter?.errorsOnly) {
      result = result.filter((l) => !l.success);
    }

    const limit = filter?.limit || 50;
    return result.slice(0, limit);
  }

  /**
   * Calculate aggregated telemetry metrics
   */
  public getSummary(): AiMonitoringSummary {
    const totalRequests = this.logs.length;
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        totalErrors: 0,
        errorRatePercentage: 0,
        averageLatencyMs: 0,
        p50LatencyMs: 0,
        p90LatencyMs: 0,
        p99LatencyMs: 0,
        totalTokensUsed: 0,
        promptTokensUsed: 0,
        responseTokensUsed: 0,
        modelBreakdown: {},
        endpointBreakdown: {},
        errorBreakdown: {},
        hourlyMetrics: [],
      };
    }

    let totalErrors = 0;
    let totalLatency = 0;
    let promptTokensUsed = 0;
    let responseTokensUsed = 0;

    const latencies: number[] = [];
    const modelBreakdown: Record<string, { requests: number; tokens: number; avgLatencyMs: number; errors: number; totalLatency: number }> = {};
    const endpointBreakdown: Record<string, { requests: number; tokens: number; errors: number }> = {};
    const errorBreakdown: Record<string, number> = {
      SAFETY_VIOLATION: 0,
      RATE_LIMIT: 0,
      TIMEOUT: 0,
      INVALID_REQUEST: 0,
      INTERNAL_ERROR: 0,
    };

    const hourlyMap = new Map<string, { requests: number; errors: number; totalLatency: number; tokens: number }>();

    for (const log of this.logs) {
      latencies.push(log.latencyMs);
      totalLatency += log.latencyMs;
      promptTokensUsed += log.promptTokens;
      responseTokensUsed += log.responseTokens;

      if (!log.success) {
        totalErrors++;
        if (log.errorCategory && log.errorCategory !== 'NONE') {
          errorBreakdown[log.errorCategory] = (errorBreakdown[log.errorCategory] || 0) + 1;
        }
      }

      // Model breakdown
      if (!modelBreakdown[log.model]) {
        modelBreakdown[log.model] = { requests: 0, tokens: 0, avgLatencyMs: 0, errors: 0, totalLatency: 0 };
      }
      modelBreakdown[log.model].requests += 1;
      modelBreakdown[log.model].tokens += log.totalTokens;
      modelBreakdown[log.model].totalLatency += log.latencyMs;
      if (!log.success) modelBreakdown[log.model].errors += 1;

      // Endpoint breakdown
      if (!endpointBreakdown[log.endpoint]) {
        endpointBreakdown[log.endpoint] = { requests: 0, tokens: 0, errors: 0 };
      }
      endpointBreakdown[log.endpoint].requests += 1;
      endpointBreakdown[log.endpoint].tokens += log.totalTokens;
      if (!log.success) endpointBreakdown[log.endpoint].errors += 1;

      // Hourly grouping
      const date = new Date(log.timestamp);
      const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
      const currentHourly = hourlyMap.get(hourKey) || { requests: 0, errors: 0, totalLatency: 0, tokens: 0 };
      currentHourly.requests += 1;
      if (!log.success) currentHourly.errors += 1;
      currentHourly.totalLatency += log.latencyMs;
      currentHourly.tokens += log.totalTokens;
      hourlyMap.set(hourKey, currentHourly);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

    // Finalize model averages
    const finalizedModelBreakdown: Record<string, { requests: number; tokens: number; avgLatencyMs: number; errors: number }> = {};
    for (const [key, val] of Object.entries(modelBreakdown)) {
      finalizedModelBreakdown[key] = {
        requests: val.requests,
        tokens: val.tokens,
        errors: val.errors,
        avgLatencyMs: Math.round(val.totalLatency / (val.requests || 1)),
      };
    }

    const hourlyMetrics = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      requests: data.requests,
      errors: data.errors,
      avgLatency: Math.round(data.totalLatency / (data.requests || 1)),
      tokens: data.tokens,
    }));

    return {
      totalRequests,
      totalErrors,
      errorRatePercentage: Number(((totalErrors / totalRequests) * 100).toFixed(2)),
      averageLatencyMs: Math.round(totalLatency / totalRequests),
      p50LatencyMs: p50,
      p90LatencyMs: p90,
      p99LatencyMs: p99,
      totalTokensUsed: promptTokensUsed + responseTokensUsed,
      promptTokensUsed,
      responseTokensUsed,
      modelBreakdown: finalizedModelBreakdown,
      endpointBreakdown,
      errorBreakdown,
      hourlyMetrics,
    };
  }
}

export const aiMonitoringStore = new AiMonitoringStore();
