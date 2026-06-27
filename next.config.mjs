/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // wagmi/walletconnect optional deps
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // MetaMask SDK has an optional React Native dependency that isn't used in a
    // web build; resolve it to an empty module to silence the "module not found"
    // warning instead of pulling in the unused RN package.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};
export default nextConfig;
