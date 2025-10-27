export function unreachable(message?: string): never {
  throw new Error(message ?? "Unreachable code");
}

export function todo(message?: string): never {
  throw new Error(message ?? "Todo");
}
