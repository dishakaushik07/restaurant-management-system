/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // Disabled for Vercel deployment so API routes work
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
