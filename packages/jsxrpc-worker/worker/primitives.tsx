import React, { type ReactNode } from "react";

export function Text({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return React.createElement("Text", {
    className,
    children,
  });
}

export function View({
  children,
  className,
}: {
  children: ReactNode[];
  className?: string;
}) {
  return React.createElement("View", {
    className,
    children,
  });
}
