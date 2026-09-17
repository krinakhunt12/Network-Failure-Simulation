import { useState } from "react";
import { useNetFailSim } from "./context.js";
import type { PresetProfile, SimulationMode, RequestOutcome } from "../types/index.js";

const PRESETS: { key: PresetProfile; label: string }[] = [
  { key: "none", label: "None" },
  { key: "slow3G", label: "Slow 3G" },
  { key: "unstable", label: "Unstable" },
  { key: "offline", label: "Offline" },
];

const MODES: { key: SimulationMode; label: string }[] = [
  { key: "offline", label: "Offline" },
  { key: "slow", label: "Slow" },
  { key: "unstable", label: "Unstable" },
  { key: "timeout", label: "Timeout" },
  { key: "server-error", label: "Server Error" },
  { key: "custom", label: "Custom" },
];

const OUTCOME_COLORS: Record<RequestOutcome, string> = {
  success: "#16c784",
  delayed: "#f0a500",
  failed: "#e94560",
  timeout: "#e94560",
  offline: "#e94560",
  custom_status: "#e94560",
};

export function DevToolbar() {
  const { config, logs, enable, disable, reset, configure, clearLogs } = useNetFailSim();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#1a1a2e",
        color: "#eee",
        fontFamily: "monospace",
        fontSize: 12,
        zIndex: 99999,
        borderTop: "2px solid #e94560",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ color: "#e94560", fontWeight: "bold" }}>netfail-sim</span>
        <span
          style={{
            padding: "2px 6px",
            borderRadius: 4,
            background: config.enabled ? "#16c784" : "#666",
            fontSize: 10,
          }}
        >
          {config.enabled ? "ON" : "OFF"}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            config.enabled ? disable() : enable();
          }}
          style={btnStyle}
        >
          {config.enabled ? "Disable" : "Enable"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          style={btnStyle}
        >
          Reset
        </button>
        <span style={{ marginLeft: "auto", color: "#888" }}>
          {expanded ? "\u25B2" : "\u25BC"}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid #333" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <label>
              Mode:
              <select
                value={config.mode ?? "custom"}
                onChange={(e) => {
                  const mode = e.target.value as SimulationMode;
                  const modeConfig: Partial<import("../types/index.js").NetFailSimConfig> = { mode };
                  if (mode === "offline") modeConfig.offline = true;
                  else modeConfig.offline = false;
                  configure(modeConfig);
                }}
                style={selectStyle}
              >
                {MODES.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Preset:
              <select
                value={config.preset ?? "none"}
                onChange={(e) => configure({ preset: e.target.value as PresetProfile })}
                style={selectStyle}
              >
                {PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Delay:
              <input
                type="number"
                value={config.delay ?? 0}
                onChange={(e) => configure({ delay: Number(e.target.value) })}
                style={inputStyle}
                min={0}
                step={100}
              />
              ms
            </label>

            <label>
              Fail Rate:
              <input
                type="number"
                value={config.failRate ?? 0}
                onChange={(e) => configure({ failRate: Number(e.target.value) })}
                style={inputStyle}
                min={0}
                max={1}
                step={0.1}
              />
            </label>

            <label>
              Timeout:
              <input
                type="number"
                value={config.timeout ?? ""}
                onChange={(e) =>
                  configure({ timeout: e.target.value ? Number(e.target.value) : undefined })
                }
                style={inputStyle}
                min={0}
                step={500}
                placeholder="none"
              />
              ms
            </label>

            <label>
              Status:
              <input
                type="number"
                value={config.status ?? ""}
                onChange={(e) =>
                  configure({ status: e.target.value ? Number(e.target.value) : undefined })
                }
                style={inputStyle}
                min={100}
                max={599}
                step={1}
                placeholder="none"
              />
            </label>

            <label>
              Fail Until:
              <input
                type="number"
                value={config.failUntilAttempt ?? 0}
                onChange={(e) => configure({ failUntilAttempt: Number(e.target.value) })}
                style={inputStyle}
                min={0}
                step={1}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="checkbox"
                checked={config.logging ?? false}
                onChange={(e) => configure({ logging: e.target.checked })}
              />
              Log
            </label>
          </div>

          {config.logging && logs.length > 0 && (
            <div style={{ maxHeight: 150, overflow: "auto", background: "#111", padding: 6, borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Logs ({logs.length})</span>
                <button onClick={clearLogs} style={btnStyle}>
                  Clear
                </button>
              </div>
              {logs.slice(-20).map((log, i) => (
                <div key={i} style={{ color: OUTCOME_COLORS[log.outcome] ?? "#888" }}>
                  {new Date(log.timestamp).toLocaleTimeString()} {log.method} {log.url}{" "}
                  <span style={{ fontSize: 10 }}>[{log.outcome}]</span>{" "}
                  {log.delay ? `+${log.delay}ms ` : ""}
                  {log.duration ? `${log.duration}ms ` : ""}
                  {log.attempt > 1 ? `#${log.attempt} ` : ""}
                  {log.error ? log.error : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  borderRadius: 4,
  padding: "2px 8px",
  cursor: "pointer",
  fontSize: 11,
};

const selectStyle: React.CSSProperties = {
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  borderRadius: 4,
  marginLeft: 4,
  fontSize: 11,
};

const inputStyle: React.CSSProperties = {
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  borderRadius: 4,
  width: 60,
  marginLeft: 4,
  padding: "2px 4px",
  fontSize: 11,
};
