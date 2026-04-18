/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for minimal Docker image
  output: 'standalone',

  // All API calls go through /api/proxy/* — no backend URL ever reaches the browser
  // The rewrite is handled by our own API route, so no rewrites config needed here.
  
  // Disable powered-by header
  poweredByHeader: false,
};

module.exports = nextConfig;
