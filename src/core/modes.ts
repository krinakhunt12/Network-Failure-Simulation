import type { FailureRule, NetFailSimConfig } from "../types/index.js";

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

export function evaluateConfig(
  url: string,
  method: string,
  config: NetFailSimConfig
): {
  delay: number;
  failRate: number;
  timeout: number | undefined;
  offline: boolean;
  status: number | undefined;
  statusText: string | undefined;
  responseBody: unknown;
  retry: number;
} {
  const rule = config.rules?.length ? matchRule(url, method, config.rules) : undefined;

  return {
    delay: rule?.delay ?? config.delay ?? 0,
    failRate: rule?.failRate ?? config.failRate ?? 0,
    timeout: rule?.timeout ?? config.timeout,
    offline: rule?.offline ?? config.offline ?? false,
    status: rule?.status ?? config.status,
    statusText: rule?.statusText ?? config.statusText,
    responseBody: rule?.responseBody ?? config.responseBody,
    retry: config.retry ?? 0,
  };
}
