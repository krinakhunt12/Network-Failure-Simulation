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

## Features

### Phase 1 - MVP

- **Fetch interception** - Intercepts native `fetch` calls
- **Offline mode** - Block all network requests
- **Artificial delay** - Add latency to requests
- **Enable / disable / reset** - Toggle simulation on the fly
- **TypeScript types** - Full type support

### Phase 2 - Advanced Failures

- **Random failure rate** - Randomly fail a percentage of requests
- **Timeout simulation** - Kill requests that take too long
- **Custom HTTP status errors** - Return specific status codes
- **URL pattern matching** - Apply rules to specific URLs
- **Configurable rules** - Fine-grained control per endpoint

### Phase 3 - Developer Experience

- **React integration** - Provider, hooks, and dev toolbar
- **Request logging** - Track all simulated failures
- **Preset profiles** - Slow 3G, Unstable, Offline

## API

### `createNetFailSim(config?)`

Creates a simulation instance.

```ts
const sim = createNetFailSim({
  delay: 500,        // Add 500ms delay
  failRate: 0.2,     // 20% chance of failure
  timeout: 3000,     // Kill requests after 3s
  offline: true,     // Block all requests
  preset: "slow3G",  // Use a preset profile
  logging: true,     // Log all requests
});
```

### Methods

| Method | Description |
|--------|-------------|
| `sim.enable()` | Start intercepting fetch |
| `sim.disable()` | Stop intercepting |
| `sim.reset()` | Reset to defaults |
| `sim.configure(config)` | Update settings |
| `sim.getConfig()` | Get current config |
| `sim.getLogs()` | Get request logs |
| `sim.clearLogs()` | Clear logs |

### Rules

Apply different settings to specific URLs:

```ts
const sim = createNetFailSim({
  rules: [
    { match: "/api/auth", offline: true },
    { match: /\/api\/users/, delay: 2000 },
    { match: "/api/slow", timeout: 500 },
    { match: "/api/errors", status: 500 },
  ],
});
```

### Presets

```ts
sim.configure({ preset: "slow3G" });  // 2s delay, 10% fail
sim.configure({ preset: "unstable" }); // 500ms delay, 40% fail
sim.configure({ preset: "offline" });  // Block all requests
```

### React Integration

```tsx
import { NetFailSimProvider, DevToolbar, useNetFailSim } from "net-fail-sim/react";

function App() {
  return (
    <NetFailSimProvider config={{ delay: 1000, logging: true }}>
      <YourApp />
      <DevToolbar />
    </NetFailSimProvider>
  );
}

function YourApp() {
  const { config, logs } = useNetFailSim();
  // ...
}
```

### Axios Support

```ts
import axios from "axios";
import { createNetFailSim, createAxiosInterceptor } from "net-fail-sim";

const sim = createNetFailSim({ delay: 1000 });
const axiosInterceptor = createAxiosInterceptor(sim.engine);

axiosInterceptor.install(axios);
// Now axios calls are intercepted
```

## License

MIT
