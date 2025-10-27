import React from "react";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import type { ComponentType } from "react";
import type {
  ComponentDispatcher,
  RpcComponentRegistry,
  ServerComponents,
} from "./server";
import { deserializeNode, type OpaqueSerializedElementShape } from "./serde2";
import createCSSStyleSheet from "./dom/createCSSStyleSheet";

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
  dispatcher: T | null,
  clientComponentMap: Record<string, AnyComponent>
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

          const promise = cachedPromise(prop as string, async () => {
            const serverComponentMap = new Map<
              string,
              | OpaqueSerializedElementShape
              | ((element: OpaqueSerializedElementShape) => void)
            >();

            const styles = dispatcher.styles();

            const render = dispatcher.render(
              prop as string,
              props,
              (id, element) => {
                console.log(`Received ${id} as ${JSON.stringify(element)}`);
                const existing = serverComponentMap.get(id);
                if (!existing) {
                  serverComponentMap.set(id, element);
                } else if (typeof existing === "function") {
                  existing(element);
                } else {
                  throw new Error(`Async component ${id} already set`);
                }
              }
            );

            // @ts-ignore
            const [css, serializedElem] = await Promise.all([styles, render]);

            if (css) {
              console.log(`Received styles ${JSON.stringify(css)}`);
              if (process.env.EXPO_OS === "web") {
                createCSSStyleSheet("jsxrpc", css);
              } else {
                // @ts-ignore
                globalThis.__react_native_css_style_collection?.inject(css);
              }
            }

            return deserializeNode(
              serializedElem,
              serverComponentMap,
              clientComponentMap
            );
          });

          return <Wrapper childrenPromise={promise} />;
        };
      },
    }
  );
}

export type AnyComponent = ComponentType<any>;

export function useRpcComponents<
  T extends RpcComponentRegistry<ServerComponents>
>(componentMap: Record<string, AnyComponent>, wsUrl?: string): T["components"] {
  const stubRef = React.useRef(
    newWebSocketRpcSession<ComponentDispatcher>(
      // @ts-ignore
      new URL(
        `/rpc?platform=${process.env.EXPO_OS ?? "web"}`,
        wsUrl ?? window.location.origin
      ).toString()
    )
  );
  return proxyFor(stubRef.current, componentMap);
}

/**
 * Creates a register of client components that can be used when deserializing server components.
 *
 * @param components - The components to register.
 * @returns A registry of the registered components.
 */
export function registerClientComponents<T extends ServerComponents>(
  components: T
): RpcComponentRegistry<T> {
  return { components };
}
