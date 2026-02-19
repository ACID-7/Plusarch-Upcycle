/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined

const remotePatterns = [
  { protocol: "https", hostname: "localhost" },
  { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
]

if (supabaseHost) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHost,
    pathname: "/storage/v1/object/public/**",
  })
}

const nextConfig = {
  images: {
    remotePatterns,
  },
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
}

module.exports = nextConfig
