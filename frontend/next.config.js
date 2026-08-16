/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:9000';

const nextConfig = {
  async rewrites() {
    return [
      // Proxies browser requests through the Next.js server to the FastAPI
      // backend, so responses (including Set-Cookie) look same-origin to
      // the browser. Without this, the httpOnly `access_token` cookie the
      // backend sets gets stored under 127.0.0.1:9000 and is invisible to
      // both client-side code AND this app's own middleware.ts, which reads
      // cookies on the localhost:3000 (Next.js) origin.
      //
      // Frontend code should call /api/backend/... (relative path) instead
      // of hitting BACKEND_URL directly for anything that relies on the
      // auth cookie — login, logout, and any protected dashboard fetches.
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
