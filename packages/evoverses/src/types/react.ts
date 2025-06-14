import React from "react";

declare module "react" {
  interface HTMLAttributes<T> extends React.DOMAttributes<T> {
    tw?: string;
  }

  interface SVGProps<T> extends React.SVGProps<SVGElement> {
    tw?: string;
  }
}

export {};
