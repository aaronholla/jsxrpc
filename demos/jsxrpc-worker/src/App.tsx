import { Suspense } from "react";
import { useRpcComponents } from "jsxrpc/client";
import type { registry } from "../worker/index.tsx";
import "./App.css";

export default function App() {
  const { ServerComponent } = useRpcComponents<typeof registry>();
  return (
    <Suspense
      fallback={<div>Fallback while rendering server component...</div>}
    >
      <ServerComponent />
    </Suspense>
  );
}
