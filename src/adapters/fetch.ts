import { Engine } from "../core/engine.js";
import { evaluateConfig } from "../core/modes.js";
import { NetworkError } from "../errors/NetworkError.js";
import type { LogEntry, RequestOutcome } from "../types/index.js";

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

        const attempt = engine.incrementAttempt(url);
        const config = engine.getConfig();
        const evaluated = evaluateConfig(url, method, config, attempt);
        const startTime = Date.now();

        const makeLog = (outcome: RequestOutcome, extra?: Partial<LogEntry>): LogEntry => ({
          timestamp: startTime,
          url,
          method,
          outcome,
          duration: Date.now() - startTime,
          attempt,
          ...extra,
        });

        if (evaluated.handler) {
          try {
            const response = await evaluated.handler({ url, method, attempt });
            if (response) {
              engine.addLog(makeLog("success", { duration: Date.now() - startTime }));
              return response;
            }
          } catch (err) {
            engine.addLog(makeLog("failed", { error: (err as Error).message }));
            throw err;
          }
        }

        if (evaluated.offline) {
          engine.addLog(makeLog("offline"));
          throw new NetworkError("Network offline (simulated)", { url });
        }

        if (evaluated.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, evaluated.delay));
        }

        if (evaluated.failRate > 0 && Math.random() < evaluated.failRate) {
          engine.addLog(makeLog("failed", { error: "random_failure" }));
          throw new NetworkError("Simulated network failure", { url });
        }

        if (evaluated.status) {
          const body = evaluated.responseBody
            ? JSON.stringify(evaluated.responseBody)
            : evaluated.statusText ?? "";

          engine.addLog(makeLog("custom_status", { status: evaluated.status }));

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
            const outcome: RequestOutcome = evaluated.delay > 0 ? "delayed" : "success";
            engine.addLog(makeLog(outcome, { duration: Date.now() - startTime }));
            return response;
          } catch (err) {
            lastError = err as Error;
            if (i < attempts - 1) {
              await new Promise((r) => setTimeout(r, 100 * (i + 1)));
            }
          }
        }

        const isTimeout = lastError?.message?.includes("timeout");
        engine.addLog(
          makeLog(isTimeout ? "timeout" : "failed", {
            error: lastError?.message,
            duration: Date.now() - startTime,
          })
        );
        throw lastError;
      };
    },

    uninstall(): void {
      globalThis.fetch = originalFetch;
    },
  };
}
