import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string) => {
  const config: NextConfig = {
    transpilePackages: [ "@workspace/ui", "@workspace/database", "thirdweb" ],
    serverExternalPackages: [ "cloudflare" ],
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "raw.seadn.io" },
        { protocol: "https", hostname: "i.seadn.io" },
      ],
    },
    devIndicators: {
      position: "bottom-right",
    },
    poweredByHeader: false,
    experimental: {
      typedEnv: true,
      authInterrupts: true,
    },
    allowedDevOrigins: [ "localhost", "192.168.75.110" ],
    redirects: async () => {
      return [
        { source: "/discord", destination: "https://discord.gg/zxdTHCkpvJ", permanent: false },
        { source: "/twitter", destination: "https://twitter.com/evoverses", permanent: false },
        { source: "/github", destination: "https://github.com/evoverses", permanent: false },
        {
          source: "/:category(general|tokenomics|the-game|intellectual-property)/:path*",
          destination: "/docs/:category/:path*",
          permanent: false,
        },
      ];
    },
    rewrites: async () => {
      return [
        { source: "/docs", destination: "https://docs.evoverses.com" },
        {
          source: "/docs/:category(general|tokenomics|the-game|intellectual-property)/:path*",
          destination: "https://docs.evoverses.com/:category/:path*",
        },
        { source: "/profile/assets", destination: "/profile/assets/evos" },
      ];
    },
    headers: async () => (
      [
        { source: "/.well-known/did.json", headers: [ { key: "Access-Control-Allow-Origin", value: "*" } ] },
      ]
    ),
  };
  if (phase !== PHASE_DEVELOPMENT_SERVER) {
    config.webpack = (config) => {
      config.externals.push("pino-pretty", "lokijs", "encoding");
      return config;
    };
    return withSentryConfig(
      config,
      {
        org: "cajun-pro",
        project: "evoverses",
        telemetry: false,
        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Transpiles SDK to be compatible with IE11 (increases bundle size)
        // transpileClientSDK: false,

        // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of
        // client-side errors will fail.
        tunnelRoute: "/monitoring",

        // Hides source maps from generated client bundles
        // hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route
        // handlers.) See the following for more information: https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,

        sourcemaps: {
          deleteSourcemapsAfterUpload: true,
        },
      },
    );
  }
  return config;
};

export default nextConfig;
