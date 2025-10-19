import { newWorkersRpcResponse, RpcStub, RpcTarget } from "capnweb";
import { serializeNode, type OpaqueSerializedElementShape } from "./serde2";

export class ComponentDispatcher extends RpcTarget {
  #registry: RpcComponentRegistry<ServerComponents>;
  constructor(registry: RpcComponentRegistry<ServerComponents>) {
    super();
    this.#registry = registry;
  }

  async render(
    name: string,
    props: Record<string, any>,
    asyncComponentRenderedCallback: (
      id: string,
      element: OpaqueSerializedElementShape
    ) => void
  ): Promise<any> {
    const component = this.#registry.components[name];
    if (!component) {
      throw new Error(`Component ${name} not found`);
    }

    const element = await component(props);
    const renderedCallback = (
      asyncComponentRenderedCallback as RpcStub<
        typeof asyncComponentRenderedCallback
      >
    ).dup();
    return serializeNode(element, renderedCallback) as unknown as Promise<any>;
  }
}

export type ServerComponents = Record<string, (...args: any[]) => Promise<any>>;

export type RpcComponentRegistry<T extends ServerComponents> = {
  components: T;
};

/**
 * Creates a register of RPC server components that can be used on a client.
 *
 * @param components - The components to register.
 * @returns A registry of the registered components.
 */
export function registerRpcComponents<T extends ServerComponents>(
  components: T
): RpcComponentRegistry<T> {
  return { components };
}

export function jsxrpcMiddleware<
  T extends RpcComponentRegistry<ServerComponents>
>(registry: T, request: Request): Promise<Response | undefined>;
export function jsxrpcMiddleware<
  T extends RpcComponentRegistry<ServerComponents>
>(
  registry: T,
  request: Request,
  next: (
    request: Request
  ) => Promise<Response | undefined> | Response | undefined
): Promise<Response>;
export async function jsxrpcMiddleware<
  T extends RpcComponentRegistry<ServerComponents>
>(
  registry: T,
  request: Request,
  next?: (
    request: Request
  ) => Promise<Response | undefined> | Response | undefined
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/rpc")) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }
    return newWorkersRpcResponse(request, new ComponentDispatcher(registry));
  }

  return await next?.(request);
}
