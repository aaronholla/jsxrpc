import React from "react";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import type {
  ComponentDispatcher,
  RpcComponentRegistry,
  ServerComponents,
} from "./server";
import { deserializeNode, type OpaqueSerializedElementShape } from "./serde2";

const neverResolves = new Promise<never>(() => {});

function Wrapper({
  childrenPromise,
}: {
  childrenPromise: Promise<React.ReactNode>;
}) {
  const children = React.use(childrenPromise);
  return children;
}
const cache = new Map<string, Promise<any>>();

function cachedPromise<Value>(
  key: string,
  promise: () => Promise<Value>
): Promise<Value> {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const newPromise = promise().then((value) => {
    cache.set(key, Promise.resolve(value));
    return value;
  });
  cache.set(key, newPromise);
  return newPromise;
}

function proxyFor<T extends RpcStub<ComponentDispatcher>>(
  dispatcher: T | null
): Record<string, (props: object) => Promise<any>> {
  // @ts-ignore
  return new Proxy(
    {},
    {
      get(_, prop) {
        return (props: object) => {
          if (!dispatcher) {
            React.use(neverResolves);
            return null;
          }

          const promise = cachedPromise(prop as string, () => {
            const map = new Map<
              string,
              | OpaqueSerializedElementShape
              | ((element: OpaqueSerializedElementShape) => void)
            >();

            // @ts-ignore
            const x: Promise<any> = dispatcher.render(
              prop as string,
              props,
              (id, element) => {
                console.log(`Received ${id} as ${JSON.stringify(element)}`);
                const existing = map.get(id);
                if (!existing) {
                  map.set(id, element);
                } else if (typeof existing === "function") {
                  existing(element);
                } else {
                  throw new Error(`Async component ${id} already set`);
                }
              }
            );
            return x.then((serializedElem) => {
              return deserializeNode(serializedElem, map);
            });
          });

          return <Wrapper childrenPromise={promise} />;
        };
      },
    }
  );
}

export function useRpcComponents<
  T extends RpcComponentRegistry<ServerComponents>
>(): T["components"] {
  const stubRef = React.useRef(
    newWebSocketRpcSession<ComponentDispatcher>(
      // @ts-ignore
      new URL("/rpc", window.location.origin).toString()
    )
  );
  return proxyFor(stubRef.current);
}
