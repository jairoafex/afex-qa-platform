/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // compiler.removeConsole no es compatible con Turbopack (dev).
  // Solo se aplica en producción donde se usa el compilador SWC estándar.
  ...(process.env.NODE_ENV === 'production' ? {
    compiler: {
      removeConsole: { exclude: ['error', 'warn'] },
    },
  } : {}),
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Variables de entorno se manejan automáticamente
  // Las que necesiten estar en el cliente deben usar prefijo NEXT_PUBLIC_
}

module.exports = nextConfig
