/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@expense-tracker/shared"],
};

module.exports = nextConfig;
