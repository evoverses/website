import type { LocalEpicConfig } from "./auth-core";
export const betaWebOrigin = "https://beta.evoverses.com";
export type HostedWebOrigin = typeof betaWebOrigin | "https://evoverses.com";
export type PlayerWebOrigin = HostedWebOrigin | "http://localhost:3100";
export function hostedWebOrigin(env: Record<string, string | undefined>): HostedWebOrigin | null {
  const origin = env.EVOVERSES_WEB_ORIGIN ?? betaWebOrigin;
  return origin === betaWebOrigin || origin === "https://evoverses.com" ? origin : null;
}
// Explicit opt-in. Local switches never enable hosted authentication.
export function hostedAccountConfig(env: Record<string,string|undefined>): LocalEpicConfig | null {
  if (env.NODE_ENV !== "production" || env.EVOVERSES_HOSTED_BETA !== "1") return null;
  try {
    const origin = hostedWebOrigin(env);
    if (!origin) return null;
    const {AUTH_EPIC_ID:clientId,AUTH_EPIC_SECRET:clientSecret,EVOVERSES_EPIC_DEPLOYMENT_ID:deploymentId,EVOVERSES_EPIC_APPLICATION_ID:applicationId,EVOVERSES_ACCOUNT_API_ORIGIN:apiUrl,EVOVERSES_ACCOUNT_SERVICE_TOKEN:serviceToken}=env;
    if (!clientId || !/^[A-Za-z0-9]{16,128}$/.test(clientId) || !clientSecret || clientSecret.trim()!==clientSecret || clientSecret.length>2048 || clientSecret==="REPLACE_ME" ||
      !deploymentId || !/^[A-Za-z0-9_-]{1,128}$/.test(deploymentId) || !applicationId || !/^[A-Za-z0-9_-]{1,128}$/.test(applicationId) || !apiUrl || !serviceToken || !/^[a-f0-9]{64}$/.test(serviceToken)) return null;
    const url=new URL(apiUrl);
    if(url.protocol!=="https:"||url.origin!==apiUrl||url.username||url.password||url.port||url.hostname==="localhost"||url.hostname.endsWith(".localhost")||/^[\d.]+$/.test(url.hostname)||!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(url.hostname))return null;
    return {clientId,clientSecret,deploymentId,applicationId,apiUrl,hosted:{origin,serviceToken}};
  } catch { return null; }
}
