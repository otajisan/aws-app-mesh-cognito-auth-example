/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverRuntimeConfig: {},
  publicRuntimeConfig: {
    region: process.env.AUTH_REGION,
    userPoolId: process.env.AUTH_USER_POOL_ID,
    userPoolWebClientId: process.env.AUTH_USER_POOL_WEB_CLIENT_ID,
  },
};

module.exports = nextConfig;
