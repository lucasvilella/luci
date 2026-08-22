/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.68.138', '192.168.68.138:3000', '192.168.15.92', 'localhost:3000', '192.168.15.92:3000'],
}

export default nextConfig
