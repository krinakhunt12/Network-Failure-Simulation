import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import { createFetchInterceptor } from "../src/adapters/fetch.js";
import { NetworkError } from "../src/errors/NetworkError.js";

describe("Timeout simulation", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    engine = new Engine({ enabled: true, timeout: 1000 });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
    vi.useRealTimers();
  });

  it("throws timeout error when fetch takes too long", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const promise = fetch("https://example.com");
    const timeoutPromise = vi.advanceTimersByTimeAsync(1000);

    await expect(Promise.race([promise, timeoutPromise.then(() => promise)])).rejects.toThrow(
      NetworkError
    );
  });

  it("succeeds when fetch resolves before timeout", async () => {
    mockFetch.mockResolvedValue(new Response("ok"));

    const response = await fetch("https://example.com");
    expect(response.ok).toBe(true);
  });

  it("does not timeout when no timeout configured", async () => {
    engine.configure({ timeout: undefined });
    mockFetch.mockResolvedValue(new Response("ok"));

    const response = await fetch("https://example.com");
    expect(response.ok).toBe(true);
  });
});
