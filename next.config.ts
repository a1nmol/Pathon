import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typedRoutes: true,
  // Three.js and R3F use browser globals and must not be parsed by the
  // Next.js server-side bundler. Transpiling them here ensures they work
  // as client-only modules without SSR errors.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  webpack: (config) => {
    // pdfjs-dist optionally requires 'canvas' for server-side rendering.
    // We don't use that path — alias it to false so webpack skips it.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
