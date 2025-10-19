// @ts-nocheck

import { jsxrpcMiddleware, registerRpcComponents } from "./server";
import { useRpcComponents } from "./client";

async function Component({}: { name: string }) {
  const response = await fetch("/api/hello");
  const data = await response.json();
  return (
    <p>
      {data.message} - {name}
    </p>
  );
}

const registry = registerRpcComponents({
  Component,
});

export default {
  async fetch(request: Request) {
    return jsxrpcMiddleware(registry, request, async (request) => {
      return new Response("Hello, world!", { status: 200 });
    });
  },
};

function App() {
  const { Component } = useRpcComponents<typeof registry>();
  return <Component name="World" />;
}
