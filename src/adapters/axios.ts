import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { Engine } from "../core/engine.js";
import { evaluateConfig } from "../core/modes.js";
import { NetworkError } from "../errors/NetworkError.js";
import type { LogEntry } from "../types/index.js";

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

          const simConfig = engine.getConfig();
          const evaluated = evaluateConfig(fullUrl, method, simConfig);

          const logEntry: LogEntry = {
            timestamp: Date.now(),
            url: fullUrl,
            method,
            blocked: false,
          };

          if (evaluated.offline) {
            logEntry.blocked = true;
            logEntry.reason = "offline";
            engine.addLog(logEntry);
            return Promise.reject(
              new NetworkError("Network offline (simulated)", { url: fullUrl })
            );
          }

          if (evaluated.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, evaluated.delay));
            logEntry.delay = evaluated.delay;
          }

          if (evaluated.failRate > 0 && Math.random() < evaluated.failRate) {
            logEntry.blocked = true;
            logEntry.reason = "random_failure";
            engine.addLog(logEntry);
            return Promise.reject(
              new NetworkError("Simulated network failure", { url: fullUrl })
            );
          }

          if (evaluated.status) {
            logEntry.blocked = true;
            logEntry.reason = "custom_status";
            logEntry.status = evaluated.status;
            engine.addLog(logEntry);

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

          engine.addLog(logEntry);
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
