/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.API_BASE_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.ip.world" },
      { protocol: "https", hostname: "dev.cdn.ip.world" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "abs.twimg.com" },
      { protocol: "https", hostname: "*.tiktokcdn-us.com" },
      { protocol: "https", hostname: "*.tiktokcdn.com" },
      { protocol: "https", hostname: "*.tiktokcdn-eu.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "example.com" },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}

    config.resolve.alias["why-is-node-running"] = false
    config.resolve.alias["tap"] = false
    config.resolve.alias["tape"] = false

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        pino: "pino/browser",
        "thread-stream": false,
        "pino-pretty": false,
        "@react-native-async-storage/async-storage": false,
      }
    }

    // Reduce parallelism to avoid OOM on Vercel builds
    config.optimization = config.optimization || {}
    config.optimization.minimizer?.forEach((plugin) => {
      if (plugin.constructor.name === "TerserPlugin") {
        plugin.options = plugin.options || {}
        plugin.options.parallel = 2
      }
    })

    return config
  },
  async redirects() {
    return []
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/landing",
      },
    ]
  },
}

export default nextConfig
