const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

if (
	process.env.NODE_ENV === "production" &&
	process.env.npm_lifecycle_event === "start"
) {
	throw new Error(
		"Do not start the dev server in production mode, it will fail",
	);
}

const config = getDefaultConfig(__dirname);

// Add SVG asset support
config.resolver.assetExts.push("svg");

config.transformer.inlineRequires = true;

module.exports = withNativeWind(config, {
	input: path.resolve(__dirname, "./src/global.css"),
});
