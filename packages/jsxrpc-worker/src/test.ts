import { newWebSocketRpcSession } from "capnweb";
import type { ComponentDispatcher } from "../../../dist/server";

const stub = newWebSocketRpcSession<ComponentDispatcher>(
  new URL("/rpc", window.location.origin).toString()
);

const result = await stub.render("Component", {});
console.log(result);
