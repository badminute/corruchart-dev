/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/corruchart-dev",
  assetPrefix: "/corruchart-dev/",
};

export default nextConfig;
