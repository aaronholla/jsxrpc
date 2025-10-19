import React, { Suspense } from "react";

type Marker<T extends string, Rest extends object = {}> = { $jsxrpc: T } & Rest;

function generateLongId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export type OpaqueSerializedElementShape =
  | { type: string; key?: string; props?: Record<string, unknown> }
  | Marker<"promise", { id: string }>
  | Marker<
      "suspense",
      {
        fallback?: OpaqueSerializedElementShape;
        props?: Record<string, unknown>;
      }
    >
  | OpaqueSerializedElementShape[]
  | string
  | number
  | boolean
  | null
  | undefined;

export function serializeNode(
  element: React.ReactNode,
  asyncComponentRenderedCallback: (
    id: string,
    element: OpaqueSerializedElementShape
  ) => void
): OpaqueSerializedElementShape {
  try {
    if (React.isValidElement(element)) {
      if (
        typeof element.type === "symbol" &&
        element.type === Symbol.for("react.suspense")
      ) {
        const { fallback, children, ...rest } = element.props as {
          fallback?: React.ReactNode;
          children?: React.ReactNode;
        };

        const serializedChildren = children
          ? serializeNode(children, asyncComponentRenderedCallback)
          : undefined;

        return {
          $jsxrpc: "suspense",
          props: {
            ...rest,
            children: serializedChildren,
          },
          fallback: fallback
            ? serializeNode(fallback, asyncComponentRenderedCallback)
            : undefined,
        };
      }

      if (typeof element.type === "function") {
        const rendered = (element.type as any)(element.props);

        if (rendered instanceof Promise) {
          const id = generateLongId();

          // We can't return a promise over the RPC boundary, so instead we return a
          // marker with an id and then later push the serialized element to the callback.
          void rendered.then((it) => {
            const serialized = serializeNode(
              it,
              asyncComponentRenderedCallback
            );
            console.log(`Rendered ${id} as ${JSON.stringify(serialized)}`);
            asyncComponentRenderedCallback(id, serialized);
          });

          return { $jsxrpc: "promise", id };
        } else {
          return serializeNode(rendered, asyncComponentRenderedCallback);
        }
      }

      const props: Record<string, unknown> = {};
      const out: Record<string, unknown> = {};
      out.type = element.type;
      out.key = element.key;

      for (const [key, value] of Object.entries(element.props ?? {})) {
        const cleaned = serializeNode(value, asyncComponentRenderedCallback);
        if (cleaned !== undefined) props[key] = cleaned;
      }

      out.props = props;

      return out as OpaqueSerializedElementShape;
    }

    if (Array.isArray(element)) {
      return element.map((item) =>
        serializeNode(item, asyncComponentRenderedCallback)
      );
    }

    return element as OpaqueSerializedElementShape;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function AsyncWrapper({
  childrenPromise,
}: {
  childrenPromise: Promise<React.ReactNode>;
}) {
  const children = React.use(childrenPromise);
  return children;
}

export function deserializeNode(
  element: OpaqueSerializedElementShape,
  asyncComponentResolvers: Map<
    string,
    | OpaqueSerializedElementShape
    | ((element: OpaqueSerializedElementShape) => void)
  >
): any {
  if (element && typeof element === "object") {
    if ("$jsxrpc" in element && element["$jsxrpc"] === "promise") {
      const promise = new Promise<React.ReactNode>((resolve) => {
        if (asyncComponentResolvers.has(element.id)) {
          const existing = asyncComponentResolvers.get(element.id);
          if (typeof existing !== "function") {
            resolve(deserializeNode(existing, asyncComponentResolvers));
          } else {
            throw new Error(`Async component ${element.id} already set`);
          }
        }
        asyncComponentResolvers.set(element.id, (elem) => {
          resolve(deserializeNode(elem, asyncComponentResolvers));
        });
      });
      return <AsyncWrapper childrenPromise={promise} />;
    }

    if ("$jsxrpc" in element && element["$jsxrpc"] === "suspense") {
      const props = { ...element.props };
      delete props["fallback"];

      const children = deserializeNode(
        element.props?.children as OpaqueSerializedElementShape,
        asyncComponentResolvers
      );
      return React.createElement(Suspense, {
        fallback: element.fallback
          ? deserializeNode(
              element.fallback as OpaqueSerializedElementShape,
              asyncComponentResolvers
            )
          : undefined,
        children,
      });
    }

    if ("type" in element && "props" in element) {
      const { children, ...rest } = element.props as {
        children?:
          | OpaqueSerializedElementShape[]
          | OpaqueSerializedElementShape;
        props?: Record<string, unknown>;
      };

      const childrenArray =
        children === undefined || Array.isArray(children)
          ? children ?? []
          : [children];

      const props = {};
      for (const key of Object.keys(rest)) {
        // @ts-ignore
        props[key] = deserializeNode(rest[key]);
      }

      return React.createElement(
        element.type,
        props,
        ...childrenArray.map((item) =>
          deserializeNode(item, asyncComponentResolvers)
        )
      );
    }

    return element;
  }

  return element;
}
