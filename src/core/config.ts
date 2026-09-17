import type { NetFailSimConfig, PresetProfile } from "../types/index.js";

const PRESETS: Record<Exclude<PresetProfile, "none">, Partial<NetFailSimConfig>> = {
  slow3G: {
    delay: 2000,
    failRate: 0.1,
    timeout: 10000,
    mode: "slow",
  },
  unstable: {
    delay: 500,
    failRate: 0.4,
    timeout: 3000,
    mode: "unstable",
  },
  offline: {
    offline: true,
    mode: "offline",
  },
};

const DEFAULT_CONFIG: NetFailSimConfig = {
  enabled: false,
  mode: "custom",
  delay: 0,
  failRate: 0,
  timeout: undefined,
  offline: false,
  status: undefined,
  statusText: undefined,
  responseBody: undefined,
  retry: 0,
  failUntilAttempt: 0,
  preset: "none",
  rules: [],
  logging: false,
};

export function createConfig(overrides: Partial<NetFailSimConfig> = {}): NetFailSimConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

export function applyPreset(config: NetFailSimConfig): NetFailSimConfig {
  if (config.preset && config.preset !== "none" && PRESETS[config.preset]) {
    return { ...PRESETS[config.preset], ...config };
  }
  return config;
}

export function mergeConfig(
  base: NetFailSimConfig,
  overrides: Partial<NetFailSimConfig>
): NetFailSimConfig {
  return { ...base, ...overrides };
}
