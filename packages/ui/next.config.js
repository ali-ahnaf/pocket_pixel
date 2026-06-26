/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@expense-tracker/shared"],
  typescript: {
    tsconfigPath: 'tsconfig.next.json',
  },
};

module.exports = nextConfig;
