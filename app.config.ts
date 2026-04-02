import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { config } from "@dotenvx/dotenvx";
import { ExpoConfig, ConfigContext } from "expo/config";

config();
const name = process.env.PROJECT_NAME ?? "simple-project-template";

// Resolve version: VERSION file (Nix sandbox), or git describe (local dev)
let version = "dev";
try {
  if (existsSync("VERSION")) {
    version = readFileSync("VERSION", "utf-8").trim();
  } else {
    version = execSync("git describe --tags --exact-match HEAD 2>/dev/null || git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    try { execSync("git diff --quiet && git diff --cached --quiet", { stdio: "ignore" }); } catch { version += "-dirty"; }
  }
} catch { /* keep "dev" */ }

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name,
  slug: name,
  version,
  orientation: "portrait",
  icon: "./src/assets/images/icon.png",
  scheme: name,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./src/assets/images/android-icon-foreground.png",
      backgroundImage: "./src/assets/images/android-icon-background.png",
      monochromeImage: "./src/assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    output: "server",
    favicon: "./src/assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./src/assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
