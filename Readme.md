# net-fail-sim

Simulate network failures like delay, timeout, offline mode, and random errors for testing apps.

## Install

```bash
npm install net-fail-sim
```

## Quick Start

```ts
import { createNetFailSim } from "net-fail-sim";

const sim = createNetFailSim({
  delay: 1000,
  failRate: 0.3,
});

sim.enable();

// Now all fetch calls are intercepted
await fetch("https://api.example.com/data");

sim.disable();
```

## Modes

| Mode | Behavior | Example |
|------|----------|---------|
| `offline` | Reject all requests | No network |
| `slow` | Add latency to requests | 3-second delay |
| `unstable` | Random failures | 30% failure rate |
| `timeout` | Kill slow requests | 5-second timeout |
| `server-error` | Return HTTP error status | 503 |
| `custom` | User-defined rules | Advanced testing |

```ts
sim.configure({ mode: "slow", delay: 2000 });
sim.configure({ mode: "offline" });
sim.configure({ mode: "server-error", status: 503 });
```

## Presets

```ts
sim.configure({ preset: "slow3G" });  // 2s delay, 10% fail, 10s timeout
sim.configure({ preset: "unstable" }); // 500ms delay, 40% fail, 3s timeout
sim.configure({ preset: "offline" });  // Block all requests
```

## URL-based Rules

Only fail requests matching specific patterns:

```ts
const sim = createNetFailSim({
  rules: [
    { match: "/api/payment", offline: true },         // Block payments
    { match: /\/api\/slow/, delay: 3000 },             // Slow endpoints
    { match: "/api/errors", status: 500 },             // Server errors
    { match: "/api/users", method: "POST", status: 429 }, // Rate limit POSTs
  ],
});
```

## Retry Testing

Fail the first N attempts, then succeed:

```ts
// Global: fail first 2 attempts for all requests
sim.configure({ failUntilAttempt: 2 });

// Per-rule: fail first attempt for specific endpoints
sim.configure({
  rules: [
    { match: "/api/flaky", failUntilAttempt: 3 },
  ],
});
```

## Custom Handlers

Define your own request behavior:

```ts
sim.configure({
  rules: [
    {
      match: "/api/custom",
      handler: ({ url, method, attempt }) => {
        if (attempt < 3) {
          return new Response("Service unavailable", { status: 503 });
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],
});
```

## Request Logging

Track all simulated requests with detailed outcomes:

```ts
sim.configure({ logging: true });

// After making requests...
const logs = sim.getLogs();
// [
//   {
//     timestamp: 1234567890,
//     url: "https://api.example.com/data",
//     method: "GET",
//     outcome: "success",  // success | failed | delayed | timeout | offline | custom_status
//     duration: 1023,
//     attempt: 1,
//   },
// ]

sim.clearLogs();
```

## API

### `createNetFailSim(config?)`

| Method | Description |
|--------|-------------|
| `sim.enable()` | Start intercepting fetch |
| `sim.disable()` | Stop intercepting |
| `sim.reset()` | Reset to defaults |
| `sim.configure(config)` | Update settings |
| `sim.getConfig()` | Get current config |
| `sim.getLogs()` | Get request logs |
| `sim.clearLogs()` | Clear logs |
| `sim.getAttemptCount(url)` | Get attempt count for URL |
| `sim.resetAttempts(url?)` | Reset attempt counter |

## React Integration

```tsx
import { NetFailSimProvider, DevToolbar, useNetFailSim } from "net-fail-sim/react";

function App() {
  return (
    <NetFailSimProvider config={{ delay: 1000, logging: true }}>
      <YourApp />
      <DevToolbar />  {/* Interactive floating toolbar */}
    </NetFailSimProvider>
  );
}

function YourApp() {
  const { config, logs, enable, disable, configure } = useNetFailSim();
  // ...
}
```

## Axios Support

```ts
import axios from "axios";
import { createNetFailSim, createAxiosInterceptor } from "net-fail-sim";

const sim = createNetFailSim({ delay: 1000 });
const axiosInterceptor = createAxiosInterceptor(sim.engine);

axiosInterceptor.install(axios);
// Now axios calls are intercepted
```

## Environment Support

| Environment | Support |
|-------------|---------|
| Browser fetch | Supported |
| Axios | Adapter available |
| Node.js fetch | Supported |
| WebSocket | Out of scope |

## Production Safety

The library defaults to **disabled**. No requests are intercepted until you call `sim.enable()`.

```ts
// Safe to leave in production code
const sim = createNetFailSim(); // disabled by default

// Only activate in development
if (import.meta.env.DEV) {
  sim.enable();
}
```

## License

MIT
