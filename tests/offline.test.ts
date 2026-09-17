import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Engine } from "../src/core/engine.js";
import { createFetchInterceptor } from "../src/adapters/fetch.js";
import { NetworkError } from "../src/errors/NetworkError.js";

describe("Offline mode", () => {
  let engine: Engine;
  let interceptor: ReturnType<typeof createFetchInterceptor>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mockFetch;

    engine = new Engine({ enabled: true, offline: true });
    interceptor = createFetchInterceptor(engine);
    interceptor.install();
  });

  afterEach(() => {
    interceptor.uninstall();
  });

  it("throws NetworkError when offline", async () => {
    await expect(fetch("https://example.com")).rejects.toThrow(NetworkError);
  });

  it("throws with offline reason", async () => {
    await expect(fetch("https://example.com")).rejects.toThrow("Network offline");
  });

  it("passes through when disabled", async () => {
    engine.disable();
    await fetch("https://example.com");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("passes through when offline is false", async () => {
    engine.configure({ offline: false });
    await fetch("https://example.com");
    expect(mockFetch).toHaveBeenCalled();
  });
});
