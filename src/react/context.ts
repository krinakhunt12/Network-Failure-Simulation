import { createContext, useContext } from "react";
import type { Engine } from "../core/engine.js";
import type { NetFailSimConfig, LogEntry } from "../types/index.js";

export interface NetFailSimContextValue {
  engine: Engine;
  config: NetFailSimConfig;
  logs: LogEntry[];
  enable: () => void;
  disable: () => void;
  reset: () => void;
  configure: (config: Partial<NetFailSimConfig>) => void;
  clearLogs: () => void;
}

export const NetFailSimContext = createContext<NetFailSimContextValue | null>(null);

export function useNetFailSim(): NetFailSimContextValue {
  const ctx = useContext(NetFailSimContext);
  if (!ctx) {
    throw new Error("useNetFailSim must be used within a NetFailSimProvider");
  }
  return ctx;
}
