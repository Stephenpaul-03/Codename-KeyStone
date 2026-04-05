// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Work around packages that publish a broken/unsupported "module" entry.
// Prefer the CommonJS "main" entry when present.
config.resolver.resolverMainFields = ["react-native", "main", "module"];

module.exports = config;

