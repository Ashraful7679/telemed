/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  }
};

const nextConfigWithOptimizations = {
  ...nextConfig,
  images: {
    ...nextConfig.images,
    formats: ["image/webp", "image/avif"]
  },
  experimental: {
    optimizeCss: true
  }
};

module.exports = nextConfigWithOptimizations;
