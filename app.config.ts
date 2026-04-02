import { execSync } from "child_process";
import { config } from "@dotenvx/dotenvx";
import { ExpoConfig, ConfigContext } from "expo/config";

config();
const name = process.env.PROJECT_NAME ?? "simple-project-template";
const version = execSync("npx tsx scripts/version.ts", { encoding: "utf-8" }).trim();

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
    output: "static",
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
