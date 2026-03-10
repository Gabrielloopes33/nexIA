/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
