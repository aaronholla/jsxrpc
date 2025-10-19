// @ts-nocheck

// file: server-component.tsx

// Queues the function
export async function Counter({ name }: { name: string }) {
  return <div>Counter {name}</div>;
}

// file: worker.ts

export const components = registerRpcComponents({
  ServerComponent,
});

// file: app.jsx
import { useRpcComponents } from "jsxrpc";
import type { components } from "./worker.ts";

function App() {
  const { ServerComponent } = useRpcComponents<typeof components>();

  return <ServerComponent />;
}
