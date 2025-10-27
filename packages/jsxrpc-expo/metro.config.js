const path = require("path");

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withReactNativeCSS } = require("react-native-css/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// config.resolver.nodeModulesPaths = [
//   path.resolve(__dirname, "node_modules"),
//   path.resolve(__dirname, "../../node_modules"),
// ];
// config.watchFolders = [path.resolve(__dirname, "../../")];

config.resolver.unstable_enablePackageExports = true;

module.exports = withReactNativeCSS(config);
