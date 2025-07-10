import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [ "thirdweb", "@workspace/database", "@workspace/evoverses" ],
};

export default nextConfig;
