import type { NetFailSimConfig, LogEntry } from "../types/index.js";
import { createConfig, applyPreset, mergeConfig } from "./config.js";

export class Engine {
  private config: NetFailSimConfig;
  private logs: LogEntry[] = [];
  private enabled: boolean;

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
