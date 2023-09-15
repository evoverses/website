/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  redirects: () => {
    return [
      {
        source: "/discord",
        destination: "https://discord.gg/zxdTHCkpvJ",
        permanent: false,
      },
      {
        source: "/twitter",
        destination: "https://twitter.com/evoverses",
        permanent: false,
      },
      {
        source: "/github",
        destination: "https://github.com/evoverses",
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  }
}

module.exports = nextConfig
