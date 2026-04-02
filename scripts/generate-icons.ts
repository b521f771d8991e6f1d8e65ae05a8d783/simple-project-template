/**
 * Generates all Expo app icon PNGs from logo.svg.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { Resvg } from "@resvg/resvg-js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svgRaw = readFileSync(resolve(root, "logo.svg"), "utf-8");

interface IconSpec {
	file: string;
	size: number;
	padding: number;
	fg: string;
	bg: string;
}

const icons: IconSpec[] = [
	// Main app icon — dark logo on white bg
	{ file: "icon.png", size: 1024, padding: 160, fg: "#000000", bg: "#ffffff" },
	// Splash icon
	{ file: "splash-icon.png", size: 1024, padding: 160, fg: "#000000", bg: "#ffffff" },
	// Favicon
	{ file: "favicon.png", size: 48, padding: 4, fg: "#000000", bg: "#ffffff" },
	// Android adaptive icon foreground (centered on transparent)
	{ file: "android-icon-foreground.png", size: 512, padding: 80, fg: "#000000", bg: "#00000000" },
	// Android adaptive icon background
	{ file: "android-icon-background.png", size: 512, padding: 0, fg: "#ffffff", bg: "#ffffff" },
	// Android monochrome
	{ file: "android-icon-monochrome.png", size: 432, padding: 70, fg: "#000000", bg: "#00000000" },
];

for (const icon of icons) {
	// Replace currentColor with the desired foreground color
	const svg = svgRaw.replace(/currentColor/g, icon.fg);

	// Render the SVG at the inner size (icon size minus padding)
	const innerSize = icon.size - icon.padding * 2;
	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: innerSize },
		background: icon.bg,
	});

	const rendered = resvg.render();
	const innerPng = rendered.asPng();

	// If no padding needed, write directly
	if (icon.padding === 0) {
		const out = resolve(root, "src/assets/images", icon.file);
		writeFileSync(out, innerPng);
		console.log(`${icon.file} (${icon.size}x${icon.size})`);
		continue;
	}

	// With padding: render to a canvas with the full size
	// resvg doesn't support canvas compositing, so we re-render with a wrapper SVG
	const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${icon.size}" height="${icon.size}" viewBox="0 0 ${icon.size} ${icon.size}">
  <rect width="${icon.size}" height="${icon.size}" fill="${icon.bg}"/>
  <g transform="translate(${icon.padding}, ${icon.padding})">
    <svg width="${innerSize}" height="${innerSize}" viewBox="0 0 64 64">
      ${svg.replace(/<\/?svg[^>]*>/g, "")}
    </svg>
  </g>
</svg>`;

	const fullResvg = new Resvg(wrappedSvg, {
		fitTo: { mode: "width", value: icon.size },
	});
	const fullPng = fullResvg.render().asPng();
	const out = resolve(root, "src/assets/images", icon.file);
	writeFileSync(out, fullPng);
	console.log(`${icon.file} (${icon.size}x${icon.size})`);
}

console.log("\nDone! All icons generated from logo.svg");
