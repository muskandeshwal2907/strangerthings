const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "supports-color": false,
    };
    return config;
  },
};

module.exports = nextConfig;

