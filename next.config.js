/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Exponer al cliente sin prefijo NEXT_PUBLIC_
    NEXT_PUBLIC_PREDICTION_DEADLINE:
      process.env.PREDICTION_DEADLINE || '2026-06-03T23:59:59',
  },
};

module.exports = nextConfig;
