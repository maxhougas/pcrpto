/** @type {import('next').NextConfig} */
const nextConfig = {};

/*
const cspHeader =`
  script-src-elem 'self';
`

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g," "),
          },
        ],
      },
    ]
  }

  async rewrites() {
    return [
      {
        source: '/:slug*',
        destination: (process.env.BACKEND || 'http://localhost:5000/') + ':slug*',
      },
    ]
  }
}
*/

export default nextConfig;
