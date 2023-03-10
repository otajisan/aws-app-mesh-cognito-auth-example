/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverRuntimeConfig: {
    apiUrlBase: process.env.API_URL_BASE,
  },
  publicRuntimeConfig: {
    region: process.env.AWS_COGNITO_AUTH_REGION,
    userPoolId: process.env.AWS_COGNITO_AUTH_USER_POOL_ID,
    userPoolWebClientId: process.env.AWS_COGNITO_AUTH_USER_POOL_WEB_CLIENT_ID,
  },
};

module.exports = nextConfig;
