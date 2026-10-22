import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: "/:locale/v2", destination: "/:locale", permanent: true },
      { source: "/:locale/v2/:path*", destination: "/:locale/:path*", permanent: true },
      { source: "/:locale/v3", destination: "/:locale", permanent: true },
      { source: "/:locale/v3/:path*", destination: "/:locale/:path*", permanent: true }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default withNextIntl(nextConfig);
