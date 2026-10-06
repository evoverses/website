import * as Sentry from "@sentry/nextjs";
import { appDevMode } from "@/data/constants";

const localPlayerLogin = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN === "1";
export const onRequestError = (...args: Parameters<typeof Sentry.captureRequestError>) => {
  if (!localPlayerLogin) Sentry.captureRequestError(...args);
};

export const register = async () => {
  if (localPlayerLogin) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
      spotlight: appDevMode,

    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Adjust this value in production or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
      spotlight: appDevMode
    });

  }
};
