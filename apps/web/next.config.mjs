import path from 'node:path';

try {
  process.loadEnvFile(path.resolve(process.cwd(), '../../.env'));
} catch {
  // Ignorer si le fichier .env n'est pas présent (ex: en CI)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@allotech/config', '@allotech/ui', '@allotech/api', '@allotech/auth', '@allotech/db'],
};

export default nextConfig;
