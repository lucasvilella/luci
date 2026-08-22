/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Trailing slash garante que /index.html funcione corretamente como arquivos estáticos
  trailingSlash: true,
}

export default nextConfig
