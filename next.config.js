/** @type {import('next').NextConfig} */
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
    ];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  }
}

module.exports = nextConfig
