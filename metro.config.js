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

// Add SVG and WASM asset support (WASM needed for expo-sqlite on web)
config.resolver.assetExts.push("svg", "wasm");

// COEP/COOP headers required for SharedArrayBuffer (expo-sqlite web)
config.server.enhanceMiddleware = (middleware) => {
	return (req, res, next) => {
		res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
		res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
		middleware(req, res, next);
	};
};

config.transformer.inlineRequires = true;

module.exports = withNativeWind(config, {
	input: path.resolve(__dirname, "./src/global.css"),
});
