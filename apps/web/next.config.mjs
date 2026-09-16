/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@allotech/config', '@allotech/ui', '@allotech/api', '@allotech/auth', '@allotech/db'],
};

export default nextConfig;
