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
  // Headers para controle de cache - evita que HTML fique desatualizado
  async headers() {
    return [
      {
        // Aplica a todas as rotas
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Arquivos estáticos com hash podem ser cacheados indefinidamente
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Assets públicos
        source: '/:path*.@(jpg|jpeg|gif|png|svg|ico|css|js|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
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
