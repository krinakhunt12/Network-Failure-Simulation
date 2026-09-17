import { useState } from "react";
import { NetFailSimProvider, DevToolbar, useNetFailSim } from "../../src/react/index.js";

function AppContent() {
  const { config, logs } = useNetFailSim();
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setError(null);
    setData(null);
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/todos/1");
      const json = await res.json();
      setData(JSON.stringify(json, null, 2));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", paddingBottom: 80 }}>
      <h1>netfail-sim React Demo</h1>
      <p>Open the toolbar below to simulate network failures.</p>

      <button onClick={fetchData} style={{ padding: "8px 16px", fontSize: 14 }}>
        Fetch Todo
      </button>

      <div style={{ marginTop: 20 }}>
        <h3>Status</h3>
        <pre style={{ background: "#f4f4f4", padding: 10, borderRadius: 4 }}>
          Enabled: {config.enabled ? "Yes" : "No"}{"\n"}
          Preset: {config.preset ?? "none"}{"\n"}
          Delay: {config.delay ?? 0}ms{"\n"}
          Fail Rate: {config.failRate ?? 0}{"\n"}
          Timeout: {config.timeout ?? "none"}{"\n"}
          Offline: {config.offline ? "Yes" : "No"}
        </pre>
      </div>

      {data && (
        <div>
          <h3>Response</h3>
          <pre style={{ background: "#e8f5e9", padding: 10, borderRadius: 4 }}>{data}</pre>
        </div>
      )}

      {error && (
        <div>
          <h3>Error</h3>
          <pre style={{ background: "#ffebee", padding: 10, borderRadius: 4, color: "#c62828" }}>
            {error}
          </pre>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <h3>Request Log ({logs.length})</h3>
          <pre style={{ background: "#f4f4f4", padding: 10, borderRadius: 4, maxHeight: 200, overflow: "auto" }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: log.blocked ? "#c62828" : "#2e7d32" }}>
                {log.method} {log.url} {log.blocked ? `[${log.reason}]` : "OK"}
              </div>
            ))}
          </pre>
        </div>
      )}

      <DevToolbar />
    </div>
  );
}

export default function App() {
  return (
    <NetFailSimProvider config={{ logging: true }}>
      <AppContent />
    </NetFailSimProvider>
  );
}
