import type { NextConfig } from "next";

// Baseline response headers. The main app forbids framing; /embed is a
// deliberately iframe-embeddable widget, so it opts out of the frame denial and
// keeps only the MIME/referrer hardening.
const BASE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const FRAME_DENY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), camera=(), microphone=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Everything except /embed: deny framing outright.
        source: "/((?!embed).*)",
        headers: [...BASE_SECURITY_HEADERS, ...FRAME_DENY_HEADERS],
      },
      {
        // The embeddable widget stays frameable by design.
        source: "/embed/:path*",
        headers: [...BASE_SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
