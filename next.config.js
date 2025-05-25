/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Browser polyfills for face-api.js and tensorflow.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      encoding: false,
      util: false,
      stream: false,
    };
    
    return config;
  },
};

module.exports = nextConfig; 