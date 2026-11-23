import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf must load its own React, not the one Next bundles
  serverExternalPackages: ["@react-pdf/renderer", "sharp", "better-sqlite3", "@huggingface/transformers", "onnxruntime-node"],
  // pictures and PDFs chosen in the customer form travel with the Save (each picture is shrunk to about 400 KB first); videos are up to 50 MB each
  experimental: { serverActions: { bodySizeLimit: "200mb" }, agentUpgrade: "security" },
};

export default nextConfig;
