/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite que o Next.js siga symlinks na pasta public/
  experimental: { outputFileTracingIncludes: { '/**': ['./public/**/*'] } },
  async redirects() {
    return [
      {
        source: '/admin/sign-in',
        destination: '/sign-in',
        permanent: false,
      },
    ]
  },
}
module.exports = nextConfig
