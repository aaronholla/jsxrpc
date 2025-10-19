/* eslint-disable react-refresh/only-export-components */
import { WorkerEntrypoint } from "cloudflare:workers";
import { jsxrpcMiddleware, registerRpcComponents } from "jsxrpc/server";
import { Suspense } from "react";

async function ServerComponent() {
  await scheduler.wait(1000);
  return (
    <div style={{ fontFamily: "monospace" }}>
      <h3>// Suspense works serverside!</h3>
      <Suspense fallback={<div>waiting on nexted server component...</div>}>
        <NestedServerComponent />
      </Suspense>
    </div>
  );
}

async function NestedServerComponent() {
  await scheduler.wait(1000);
  return <div>Nested data!</div>;
}

export const registry = registerRpcComponents({
  ServerComponent,
});

export default class Main extends WorkerEntrypoint<Env> {
  async fetch(request: Request) {
    return jsxrpcMiddleware(
      registry,
      request,
      () => new Response("not found", { status: 404 })
    );
  }
}
