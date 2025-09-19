/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',          // frontend request
        destination: 'http://localhost:4000/api/:path*', // backend server
      },
    ];
  },
};

export default nextConfig;
