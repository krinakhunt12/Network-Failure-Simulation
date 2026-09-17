import { Engine } from "../core/engine.js";
import { evaluateConfig } from "../core/modes.js";
import { NetworkError } from "../errors/NetworkError.js";
import type { LogEntry } from "../types/index.js";

export function createFetchInterceptor(engine: Engine) {
  const originalFetch = globalThis.fetch;

  return {
    install(): void {
      globalThis.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        const request = new Request(...args);
        const url = request.url;
        const method = request.method;

        if (!engine.isEnabled()) {
          return originalFetch(...args);
        }

        const config = engine.getConfig();
        const evaluated = evaluateConfig(url, method, config);

        const logEntry: LogEntry = {
          timestamp: Date.now(),
          url,
          method,
          blocked: false,
        };

        if (evaluated.offline) {
          logEntry.blocked = true;
          logEntry.reason = "offline";
          engine.addLog(logEntry);
          throw new NetworkError("Network offline (simulated)", { url });
        }

        if (evaluated.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, evaluated.delay));
          logEntry.delay = evaluated.delay;
        }

        if (evaluated.failRate > 0 && Math.random() < evaluated.failRate) {
          logEntry.blocked = true;
          logEntry.reason = "random_failure";
          engine.addLog(logEntry);
          throw new NetworkError("Simulated network failure", { url });
        }

        if (evaluated.status) {
          logEntry.blocked = true;
          logEntry.reason = "custom_status";
          logEntry.status = evaluated.status;
          engine.addLog(logEntry);

          const body = evaluated.responseBody
            ? JSON.stringify(evaluated.responseBody)
            : evaluated.statusText ?? "";

          return new Response(body, {
            status: evaluated.status,
            statusText: evaluated.statusText ?? "Simulated",
            headers: { "Content-Type": "application/json" },
          });
        }

        const fetchWithTimeout = async (): Promise<Response> => {
          if (evaluated.timeout) {
            return Promise.race([
              originalFetch(...args),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new NetworkError("Request timeout (simulated)", { url })),
                  evaluated.timeout
                )
              ),
            ]);
          }
          return originalFetch(...args);
        };

        let lastError: Error | undefined;
        const attempts = evaluated.retry + 1;

        for (let i = 0; i < attempts; i++) {
          try {
            const response = await fetchWithTimeout();
            engine.addLog(logEntry);
            return response;
          } catch (err) {
            lastError = err as Error;
            if (i < attempts - 1) {
              await new Promise((r) => setTimeout(r, 100 * (i + 1)));
            }
          }
        }

        engine.addLog(logEntry);
        throw lastError;
      };
    },

    uninstall(): void {
      globalThis.fetch = originalFetch;
    },
  };
}
