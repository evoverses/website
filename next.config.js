/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.seadn.io" },
    ],
  },
  redirects: () => {
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
  rewrites: () => {
    return [
      { source: "/docs", destination: "https://docs.evoverses.com" },
      {
        source: "/docs/:category(general|tokenomics|the-game|intellectual-property)/:path*",
        destination: "https://docs.evoverses.com/:category/:path*",
      },
    ];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

module.exports = nextConfig;
