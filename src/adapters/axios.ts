import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { Engine } from "../core/engine.js";
import { evaluateConfig } from "../core/modes.js";
import { NetworkError } from "../errors/NetworkError.js";
import type { LogEntry, RequestOutcome } from "../types/index.js";

export function createAxiosInterceptor(engine: Engine) {
  let installed = false;

  return {
    install(axiosInstance: AxiosInstance): void {
      if (installed) return;

      axiosInstance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
          if (!engine.isEnabled()) return config;

          const url = config.url ?? "";
          const method = (config.method ?? "GET").toUpperCase();
          const fullUrl = config.baseURL ? `${config.baseURL}${url}` : url;
          const attempt = engine.incrementAttempt(fullUrl);
          const startTime = Date.now();

          const simConfig = engine.getConfig();
          const evaluated = evaluateConfig(fullUrl, method, simConfig, attempt);

          const makeLog = (outcome: RequestOutcome, extra?: Partial<LogEntry>): LogEntry => ({
            timestamp: startTime,
            url: fullUrl,
            method,
            outcome,
            duration: Date.now() - startTime,
            attempt,
            ...extra,
          });

          if (evaluated.offline) {
            engine.addLog(makeLog("offline"));
            return Promise.reject(
              new NetworkError("Network offline (simulated)", { url: fullUrl })
            );
          }

          if (evaluated.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, evaluated.delay));
          }

          if (evaluated.failRate > 0 && Math.random() < evaluated.failRate) {
            engine.addLog(makeLog("failed", { error: "random_failure" }));
            return Promise.reject(
              new NetworkError("Simulated network failure", { url: fullUrl })
            );
          }

          if (evaluated.status) {
            engine.addLog(makeLog("custom_status", { status: evaluated.status }));

            const error = new Error("Simulated response") as any;
            error.response = {
              status: evaluated.status,
              statusText: evaluated.statusText ?? "Simulated",
              data: evaluated.responseBody,
              headers: {},
              config,
            };
            return Promise.reject(error);
          }

          if (evaluated.timeout) {
            config.timeout = evaluated.timeout;
          }

          const outcome: RequestOutcome = evaluated.delay > 0 ? "delayed" : "success";
          engine.addLog(makeLog(outcome));
          return config;
        },
        (error: unknown) => Promise.reject(error)
      );

      installed = true;
    },

    uninstall(): void {
      installed = false;
    },
  };
}
