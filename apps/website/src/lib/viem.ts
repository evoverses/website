import { Addressish } from "@/types/core";
import { createPublicClient, getAddress, http } from "viem";
import { avalanche } from "viem/chains";

export const client = createPublicClient({
  chain: avalanche,
  transport: http(),
});

export const getAddressSafe = (address: Addressish) => {
  if (address) {
    try {
      getAddress(address);
      return true;
    } catch {
      return false;
    }
  }
};

interface ViemDetailedError {
  contractCall: Record<string, string>,
  details: string,
  docs: string,
  error: string,
  rawCallArguments: Record<string, string>,
  requestBody: Record<string, any>,
  url: string,
  version: string,
  [k: string]: any,
}

export const parseViemDetailedError = (error: Error | null): ViemDetailedError | undefined => {
  if (error) {
    const d: ViemDetailedError = {} as ViemDetailedError;
    const blockParse = error.message.replace(/\n/g, "~").split("~").filter(v => v.trim());
    blockParse.forEach((v, i) => {
      if (i === 0) {
        d.error = v;
      } else {
        const strSplit = v.split(":");
        let rawKey = strSplit.length > 0 ? strSplit[0] : "";
        let value = strSplit.length > 1 ? strSplit.slice(1).join(":") : "";
        if (rawKey?.startsWith(" ")) {
          const key = Object.keys(d).pop() || "";
          const subKey = rawKey.trim();
          if (d[key] === "") {
            d[key] = { [subKey]: value.trim() };
          } else {
            (
              d[key] as Record<string, string>
            )[subKey] = value.trim();
          }
        } else {
          const key = (
            rawKey || ""
          ).trim().toLowerCase().split(" ").map((k, index) =>
            index === 0 ? k : k.charAt(0).toUpperCase() + k.slice(1)).join("");
          d[key] = value.trim();
          if (key === "requestBody") {
            d[key] = JSON.parse(value.trim());
          }
        }
      }
    });
    return d;
  }
};
