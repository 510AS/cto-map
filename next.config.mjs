/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel serverless deployment
  experimental: {
    // Reduce cold start times by bundling Prisma
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
