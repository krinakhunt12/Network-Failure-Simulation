import type { FailureRule, NetFailSimConfig, SimulationMode } from "../types/index.js";

export function matchRule(url: string, method: string, rules: FailureRule[]): FailureRule | undefined {
  return rules.find((rule) => {
    if (rule.match) {
      const matches =
        typeof rule.match === "string" ? url.includes(rule.match) : rule.match.test(url);
      if (!matches) return false;
    }

    if (rule.method) {
      const methods = Array.isArray(rule.method) ? rule.method : [rule.method];
      if (!methods.includes(method.toUpperCase() as any)) return false;
    }

    return true;
  });
}

export function resolveMode(config: NetFailSimConfig): SimulationMode {
  if (config.mode) return config.mode;
  if (config.offline) return "offline";
  if (config.timeout) return "timeout";
  if (config.status) return "server-error";
  if (config.failRate && config.failRate > 0) return "unstable";
  if (config.delay && config.delay > 0) return "slow";
  return "custom";
}

export interface EvaluatedConfig {
  delay: number;
  failRate: number;
  timeout: number | undefined;
  offline: boolean;
  status: number | undefined;
  statusText: string | undefined;
  responseBody: unknown;
  retry: number;
  failUntilAttempt: number;
  mode: SimulationMode;
  handler?: FailureRule["handler"];
}

export function evaluateConfig(
  url: string,
  method: string,
  config: NetFailSimConfig,
  attempt: number = 1
): EvaluatedConfig {
  const rule = config.rules?.length ? matchRule(url, method, config.rules) : undefined;
  const mode = resolveMode(config);

  const failUntilAttempt = rule?.failUntilAttempt ?? config.failUntilAttempt ?? 0;
  const shouldForceFail = failUntilAttempt > 0 && attempt <= failUntilAttempt;

  if (rule?.handler) {
    return {
      delay: 0,
      failRate: 0,
      timeout: undefined,
      offline: false,
      status: undefined,
      statusText: undefined,
      responseBody: undefined,
      retry: 0,
      failUntilAttempt: 0,
      mode: "custom",
      handler: rule.handler,
    };
  }

  if (shouldForceFail) {
    return {
      delay: rule?.delay ?? config.delay ?? 0,
      failRate: 0,
      timeout: undefined,
      offline: false,
      status: rule?.status ?? config.status ?? 500,
      statusText: rule?.statusText ?? config.statusText ?? "Forced failure",
      responseBody: rule?.responseBody ?? config.responseBody,
      retry: 0,
      failUntilAttempt,
      mode: mode,
    };
  }

  return {
    delay: rule?.delay ?? config.delay ?? 0,
    failRate: rule?.failRate ?? config.failRate ?? 0,
    timeout: rule?.timeout ?? config.timeout,
    offline: rule?.offline ?? config.offline ?? false,
    status: rule?.status ?? config.status,
    statusText: rule?.statusText ?? config.statusText,
    responseBody: rule?.responseBody ?? config.responseBody,
    retry: config.retry ?? 0,
    failUntilAttempt,
    mode,
    handler: rule?.handler,
  };
}
