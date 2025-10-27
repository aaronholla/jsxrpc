/* eslint-disable react-refresh/only-export-components */
import { WorkerEntrypoint } from "cloudflare:workers";
import { jsxrpcMiddleware, registerRpcComponents } from "jsxrpc/server";
import { Suspense } from "react";

import styles from "./styles.rncss";
import { Text, View } from "./primitives";

async function ServerComponent() {
  await scheduler.wait(1000);
  return (
    <View>
      <Text className="bg-red">Suspense works serverside!</Text>
      <Suspense fallback={<Text>waiting on nested server component...</Text>}>
        <NestedServerComponent />
      </Suspense>
    </View>
  );
}

async function NestedServerComponent() {
  await scheduler.wait(1000);
  return <Text>Nested data!</Text>;
}

export const registry = registerRpcComponents({
  ServerComponent,
});

export default class Main extends WorkerEntrypoint<Env> {
  async fetch(request: Request) {
    return jsxrpcMiddleware(
      registry,
      styles,
      request,
      () => new Response("not found", { status: 404 })
    );
  }
}
