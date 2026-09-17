import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import { createFetchInterceptor } from "../src/adapters/fetch.js";

describe("Artificial delay", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    engine = new Engine({ enabled: true, delay: 500 });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
    vi.useRealTimers();
  });

  it("delays before resolving", async () => {
    const promise = fetch("https://example.com");
    await vi.advanceTimersByTimeAsync(500);
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not delay when delay is 0", async () => {
    engine.configure({ delay: 0 });

    const promise = fetch("https://example.com");
    await vi.advanceTimersByTimeAsync(0);
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("respects per-rule delay", async () => {
    engine.configure({
      delay: 0,
      rules: [{ match: "slow", delay: 1000 }],
    });

    const promise = fetch("https://example.com/slow");
    await vi.advanceTimersByTimeAsync(1000);
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
