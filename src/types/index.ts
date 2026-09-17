export type SimulationMode = "offline" | "slow" | "unstable" | "timeout" | "server-error" | "custom";

export type PresetProfile = "slow3G" | "unstable" | "offline" | "none";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export type RequestOutcome = "success" | "failed" | "delayed" | "timeout" | "offline" | "custom_status";

export interface CustomHandlerContext {
  url: string;
  method: string;
  attempt: number;
  abortSignal?: AbortSignal;
}

export interface FailureRule {
  match?: string | RegExp;
  method?: HttpMethod | HttpMethod[];
  delay?: number;
  failRate?: number;
  timeout?: number;
  offline?: boolean;
  status?: number;
  statusText?: string;
  responseBody?: unknown;
  failUntilAttempt?: number;
  handler?: (ctx: CustomHandlerContext) => Promise<Response> | Response | undefined;
}

export interface NetFailSimConfig {
  enabled?: boolean;
  mode?: SimulationMode;
  delay?: number;
  failRate?: number;
  timeout?: number;
  offline?: boolean;
  status?: number;
  statusText?: string;
  responseBody?: unknown;
  retry?: number;
  failUntilAttempt?: number;
  preset?: PresetProfile;
  rules?: FailureRule[];
  logging?: boolean;
}

export interface LogEntry {
  timestamp: number;
  url: string;
  method: string;
  outcome: RequestOutcome;
  delay?: number;
  status?: number;
  duration: number;
  attempt: number;
  error?: string;
}

export interface NetFailSimEngine {
  enable(): void;
  disable(): void;
  reset(): void;
  configure(config: Partial<NetFailSimConfig>): void;
  getConfig(): NetFailSimConfig;
  getLogs(): LogEntry[];
  clearLogs(): void;
  getAttemptCount(url: string): number;
}
