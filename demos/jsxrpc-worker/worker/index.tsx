/* eslint-disable react-refresh/only-export-components */
import { WorkerEntrypoint } from "cloudflare:workers";
import { jsxrpcMiddleware, registerRpcComponents } from "jsxrpc/server";
import React, { Suspense, type ReactNode } from "react";

function Text({ platform, children }: { platform: string; children: string }) {
  return React.createElement(
    platform === "web" ? "div" : "RCTText",
    null,
    children
  );
}

function View({
  platform,
  children,
}: {
  platform: string;
  children: ReactNode[];
}) {
  return React.createElement(
    platform === "web" ? "div" : "RCTView",
    null,
    children
  );
}

async function ServerComponent({ platform }: { platform: string }) {
  await scheduler.wait(1000);
  return (
    <View platform={platform}>
      <Text platform={platform}>Suspense works serverside!</Text>
      <Suspense
        fallback={
          <Text platform={platform}>waiting on nested server component...</Text>
        }
      >
        <NestedServerComponent platform={platform} />
      </Suspense>
    </View>
  );
}

async function NestedServerComponent({ platform }: { platform: string }) {
  await scheduler.wait(1000);
  return <Text platform={platform}>Nested data!</Text>;
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
