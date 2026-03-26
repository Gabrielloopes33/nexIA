import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.ENABLE_STANDALONE === '1' ? 'standalone' : undefined,
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Redirecionar rotas antigas do Instagram para a nova estrutura Meta API
      {
        source: '/integracoes/instagram',
        destination: '/meta-api/instagram',
        permanent: true,
      },
      {
        source: '/integracoes/instagram/connect',
        destination: '/meta-api/instagram/connect',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;
