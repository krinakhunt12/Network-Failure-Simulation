import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import { createFetchInterceptor } from "../src/adapters/fetch.js";
import { NetworkError } from "../src/errors/NetworkError.js";

describe("Retry testing (failUntilAttempt)", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    engine = new Engine({ enabled: true, failUntilAttempt: 2, logging: true });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
  });

  it("returns 500 on first attempt", async () => {
    const response = await fetch("https://example.com");
    expect(response.status).toBe(500);
    expect(response.statusText).toBe("Forced failure");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 500 on second attempt", async () => {
    await fetch("https://example.com");
    const response = await fetch("https://example.com");
    expect(response.status).toBe(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("succeeds on third attempt", async () => {
    await fetch("https://example.com");
    await fetch("https://example.com");
    const response = await fetch("https://example.com");
    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("tracks attempt count", async () => {
    await fetch("https://example.com");
    expect(engine.getAttemptCount("https://example.com/")).toBe(1);

    await fetch("https://example.com");
    expect(engine.getAttemptCount("https://example.com/")).toBe(2);

    await fetch("https://example.com");
    expect(engine.getAttemptCount("https://example.com/")).toBe(3);
  });

  it("resets attempts", async () => {
    await fetch("https://example.com");
    await fetch("https://example.com");
    expect(engine.getAttemptCount("https://example.com/")).toBe(2);

    engine.resetAttempts("https://example.com/");
    expect(engine.getAttemptCount("https://example.com/")).toBe(0);
  });

  it("logs forced failure outcome", async () => {
    await fetch("https://example.com");
    const logs = engine.getLogs();
    expect(logs[0].outcome).toBe("custom_status");
    expect(logs[0].status).toBe(500);
  });
});

describe("Server error simulation", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    engine = new Engine({ enabled: true, status: 503, statusText: "Service Unavailable" });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
  });

  it("returns simulated error response", async () => {
    const response = await fetch("https://example.com");
    expect(response.status).toBe(503);
    expect(response.statusText).toBe("Service Unavailable");
  });

  it("returns custom response body", async () => {
    engine.configure({
      status: 404,
      statusText: "Not Found",
      responseBody: { error: "Resource not found" },
    });

    const response = await fetch("https://example.com");
    const body = await response.json();
    expect(body).toEqual({ error: "Resource not found" });
  });

  it("does not call original fetch", async () => {
    await fetch("https://example.com");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("Per-rule configuration", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    engine = new Engine({
      enabled: true,
      rules: [
        { match: "/api/payment", offline: true },
        { match: /\/api\/slow/, delay: 1000 },
        { match: "/api/errors", status: 500 },
        { match: "/api/retry", failUntilAttempt: 1 },
      ],
    });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
  });

  it("blocks payment endpoints", async () => {
    await expect(fetch("https://example.com/api/payment")).rejects.toThrow("offline");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("delays slow endpoints", async () => {
    vi.useFakeTimers();
    const promise = fetch("https://example.com/api/slow");
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    expect(mockFetch).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("returns error for error endpoints", async () => {
    const response = await fetch("https://example.com/api/errors");
    expect(response.status).toBe(500);
  });

  it("retries retry endpoints", async () => {
    const first = await fetch("https://example.com/api/retry");
    expect(first.status).toBe(500);

    const second = await fetch("https://example.com/api/retry");
    expect(second.ok).toBe(true);
  });

  it("passes through unmatched URLs", async () => {
    const response = await fetch("https://example.com/api/other");
    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("Custom handler", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    engine = new Engine({
      enabled: true,
      rules: [
        {
          match: "/api/custom",
          handler: () => new Response("custom response", { status: 201 }),
        },
      ],
    });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
  });

  it("uses custom handler", async () => {
    const response = await fetch("https://example.com/api/custom");
    expect(response.status).toBe(201);
    expect(await response.text()).toBe("custom response");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("passes through when handler returns undefined", async () => {
    engine.configure({
      rules: [
        {
          match: "/api/pass",
          handler: () => undefined,
        },
      ],
    });

    const response = await fetch("https://example.com/api/pass");
    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });
});

describe("Request logging", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    engine = new Engine({ enabled: true, logging: true });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
  });

  it("logs successful requests", async () => {
    await fetch("https://example.com");
    const logs = engine.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].outcome).toBe("success");
    expect(logs[0].url).toBe("https://example.com/");
    expect(logs[0].method).toBe("GET");
    expect(logs[0].attempt).toBe(1);
  });

  it("logs failed requests", async () => {
    engine.configure({ failRate: 1 });
    await expect(fetch("https://example.com")).rejects.toThrow();
    const logs = engine.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].outcome).toBe("failed");
  });

  it("logs custom_status outcomes", async () => {
    engine.configure({ status: 503 });
    await fetch("https://example.com");
    const logs = engine.getLogs();
    expect(logs[0].outcome).toBe("custom_status");
    expect(logs[0].status).toBe(503);
  });

  it("logs offline outcomes", async () => {
    engine.configure({ offline: true });
    await expect(fetch("https://example.com")).rejects.toThrow();
    const logs = engine.getLogs();
    expect(logs[0].outcome).toBe("offline");
  });

  it("clears logs", async () => {
    await fetch("https://example.com");
    expect(engine.getLogs().length).toBe(1);
    engine.clearLogs();
    expect(engine.getLogs().length).toBe(0);
  });

  it("does not log when logging is disabled", async () => {
    engine.configure({ logging: false });
    await fetch("https://example.com");
    expect(engine.getLogs().length).toBe(0);
  });
});
