/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  redirects: () => {
    return [
      { source: "/discord", destination: "https://discord.gg/zxdTHCkpvJ", permanent: false },
      { source: "/twitter", destination: "https://twitter.com/evoverses", permanent: false },
      { source: "/github", destination: "https://github.com/evoverses", permanent: false },
      {
        source: "/privacy",
        destination: "https://app.termly.io/document/privacy-policy/836ee923-8be7-4ffb-8bba-e53a9aebe6fe",
        permanent: false,
      }
    ];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  }
}

module.exports = nextConfig
