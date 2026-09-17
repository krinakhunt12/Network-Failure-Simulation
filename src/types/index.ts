export type PresetProfile = "slow3G" | "unstable" | "offline" | "none";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export type FailureType = "offline" | "timeout" | "status" | "random";

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
}

export interface NetFailSimConfig {
  enabled?: boolean;
  delay?: number;
  failRate?: number;
  timeout?: number;
  offline?: boolean;
  status?: number;
  statusText?: string;
  responseBody?: unknown;
  retry?: number;
  preset?: PresetProfile;
  rules?: FailureRule[];
  logging?: boolean;
}

export interface LogEntry {
  timestamp: number;
  url: string;
  method: string;
  blocked: boolean;
  reason?: string;
  delay?: number;
  status?: number;
}

export interface NetFailSimEngine {
  enable(): void;
  disable(): void;
  reset(): void;
  configure(config: Partial<NetFailSimConfig>): void;
  getConfig(): NetFailSimConfig;
  getLogs(): LogEntry[];
  clearLogs(): void;
}
