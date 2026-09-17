import { useState, useCallback, useEffect, type ReactNode } from "react";
import { Engine } from "../core/engine.js";
import { createFetchInterceptor } from "../adapters/fetch.js";
import { NetFailSimContext, type NetFailSimContextValue } from "./context.js";
import type { NetFailSimConfig, LogEntry } from "../types/index.js";

interface NetFailSimProviderProps {
  children: ReactNode;
  config?: Partial<NetFailSimConfig>;
}

export function NetFailSimProvider({ children, config = {} }: NetFailSimProviderProps) {
  const [engine] = useState(() => new Engine(config));
  const [interceptor] = useState(() => createFetchInterceptor(engine));
  const [configState, setConfigState] = useState(engine.getConfig());
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (config.enabled) {
      engine.enable();
      interceptor.install();
    }
    return () => {
      interceptor.uninstall();
    };
  }, []);

  const enable = useCallback(() => {
    engine.enable();
    interceptor.install();
    setConfigState(engine.getConfig());
  }, [engine, interceptor]);

  const disable = useCallback(() => {
    engine.disable();
    interceptor.uninstall();
    setConfigState(engine.getConfig());
  }, [engine, interceptor]);

  const reset = useCallback(() => {
    engine.reset();
    interceptor.uninstall();
    setConfigState(engine.getConfig());
    setLogs([]);
  }, [engine, interceptor]);

  const configure = useCallback(
    (overrides: Partial<NetFailSimConfig>) => {
      engine.configure(overrides);
      setConfigState(engine.getConfig());
    },
    [engine]
  );

  const clearLogs = useCallback(() => {
    engine.clearLogs();
    setLogs([]);
  }, [engine]);

  const getAttemptCount = useCallback(
    (url: string) => engine.getAttemptCount(url),
    [engine]
  );

  const resetAttempts = useCallback(
    (url?: string) => {
      engine.resetAttempts(url);
    },
    [engine]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(engine.getLogs());
    }, 500);
    return () => clearInterval(interval);
  }, [engine]);

  const value: NetFailSimContextValue = {
    engine,
    config: configState,
    logs,
    enable,
    disable,
    reset,
    configure,
    clearLogs,
    getAttemptCount,
    resetAttempts,
  };

  return <NetFailSimContext.Provider value={value}>{children}</NetFailSimContext.Provider>;
}
