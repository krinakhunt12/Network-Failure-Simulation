export type {
  SimulationMode,
  PresetProfile,
  HttpMethod,
  RequestOutcome,
  CustomHandlerContext,
  FailureRule,
  NetFailSimConfig,
  LogEntry,
  NetFailSimEngine,
} from "./types/index.js";

export { NetworkError } from "./errors/NetworkError.js";
export { Engine } from "./core/engine.js";
export { createConfig, applyPreset, mergeConfig } from "./core/config.js";
export { matchRule, evaluateConfig, resolveMode } from "./core/modes.js";
export type { EvaluatedConfig } from "./core/modes.js";
export { createFetchInterceptor } from "./adapters/fetch.js";
export { createAxiosInterceptor } from "./adapters/axios.js";

export {
  NetFailSimProvider,
  DevToolbar,
  useNetFailSim,
  NetFailSimContext,
} from "./react/index.js";
export type { NetFailSimContextValue } from "./react/index.js";

import { Engine } from "./core/engine.js";
import { createFetchInterceptor } from "./adapters/fetch.js";
import type { NetFailSimConfig } from "./types/index.js";

export function createNetFailSim(config: Partial<NetFailSimConfig> = {}) {
  const engine = new Engine(config);
  const fetchInterceptor = createFetchInterceptor(engine);

  return {
    engine,
    fetch: fetchInterceptor,

    enable() {
      engine.enable();
      fetchInterceptor.install();
      return this;
    },

    disable() {
      engine.disable();
      fetchInterceptor.uninstall();
      return this;
    },

    reset() {
      engine.reset();
      fetchInterceptor.uninstall();
      return this;
    },

    configure(overrides: Partial<NetFailSimConfig>) {
      engine.configure(overrides);
      return this;
    },

    getConfig() {
      return engine.getConfig();
    },

    getLogs() {
      return engine.getLogs();
    },

    clearLogs() {
      engine.clearLogs();
      return this;
    },

    getAttemptCount(url: string) {
      return engine.getAttemptCount(url);
    },

    resetAttempts(url?: string) {
      engine.resetAttempts(url);
      return this;
    },
  };
}

export default createNetFailSim;
