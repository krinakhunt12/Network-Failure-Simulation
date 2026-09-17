import type { NetFailSimConfig, LogEntry } from "../types/index.js";
import { createConfig, applyPreset, mergeConfig } from "./config.js";

export class Engine {
  private config: NetFailSimConfig;
  private logs: LogEntry[] = [];
  private enabled: boolean;
  private attemptCounts = new Map<string, number>();

  constructor(initialConfig: Partial<NetFailSimConfig> = {}) {
    this.config = applyPreset(createConfig(initialConfig));
    this.enabled = this.config.enabled ?? false;
  }

  enable(): void {
    this.enabled = true;
    this.config.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.config.enabled = false;
  }

  reset(): void {
    this.config = applyPreset(createConfig());
    this.enabled = false;
    this.logs = [];
    this.attemptCounts.clear();
  }

  configure(overrides: Partial<NetFailSimConfig>): void {
    this.config = applyPreset(mergeConfig(this.config, overrides));
    if (overrides.enabled !== undefined) {
      this.enabled = overrides.enabled;
    }
  }

  getConfig(): NetFailSimConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getAttemptCount(url: string): number {
    return this.attemptCounts.get(url) ?? 0;
  }

  incrementAttempt(url: string): number {
    const current = this.attemptCounts.get(url) ?? 0;
    const next = current + 1;
    this.attemptCounts.set(url, next);
    return next;
  }

  resetAttempts(url?: string): void {
    if (url) {
      this.attemptCounts.delete(url);
    } else {
      this.attemptCounts.clear();
    }
  }

  addLog(entry: LogEntry): void {
    if (this.config.logging) {
      this.logs.push(entry);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}
