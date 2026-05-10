const path = require("path");
const { addWebpackAlias } = require("@craco/craco");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
};
