/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/agent",
  redirects: () => [
    { source: "/", destination: "/agent", permanent: false, basePath: false },
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.deepgram.com",
        port: "",
        pathname: "/examples/avatars/**",
      },
    ],
  },
};

export default nextConfig;
