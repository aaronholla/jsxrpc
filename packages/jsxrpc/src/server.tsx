import { newWorkersRpcResponse, RpcStub, RpcTarget } from "capnweb";
import { serializeNode, type OpaqueSerializedElementShape } from "./serde2";

export class ComponentDispatcher extends RpcTarget {
  #registry: RpcComponentRegistry<ServerComponents>;
  #platform: string;
  #styles: { native: any; web: string } | undefined;

  constructor(
    registry: RpcComponentRegistry<ServerComponents>,
    platform: string,
    styles: { native: any; web: string } | undefined
  ) {
    super();
    this.#registry = registry;
    this.#platform = platform;
    this.#styles = styles;
  }

  async styles() {
    try {
      if (this.#platform === "web") {
        return this.#styles?.web;
      } else {
        return this.#styles?.native;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async render(
    name: string,
    props: Record<string, any>,
    asyncComponentRenderedCallback: (
      id: string,
      element: OpaqueSerializedElementShape
    ) => void
  ) {
    const component = this.#registry.components[name];
    if (!component) {
      throw new Error(`Component ${name} not found`);
    }

    const element = await component({ ...props, platform: this.#platform });
    const renderedCallback = (
      asyncComponentRenderedCallback as RpcStub<
        typeof asyncComponentRenderedCallback
      >
    ).dup();
    return serializeNode(element, renderedCallback);
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
>(
  registry: T,
  styles: { native: any; web: string } | undefined,
  request: Request
): Promise<Response | undefined>;
export function jsxrpcMiddleware<
  T extends RpcComponentRegistry<ServerComponents>
>(
  registry: T,
  styles: { native: any; web: string } | undefined,
  request: Request,
  next: (
    request: Request
  ) => Promise<Response | undefined> | Response | undefined
): Promise<Response>;
export async function jsxrpcMiddleware<
  T extends RpcComponentRegistry<ServerComponents>
>(
  registry: T,
  styles: { native: any; web: string } | undefined,
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
    const platform = url.searchParams.get("platform") ?? "web";
    return newWorkersRpcResponse(
      request,
      new ComponentDispatcher(registry, platform, styles)
    );
  }

  return await next?.(request);
}
