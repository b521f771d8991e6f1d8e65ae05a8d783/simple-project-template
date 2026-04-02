import { Image } from "expo-image";

interface LogoProps {
	size?: number;
	color?: string;
}

const logoSource = require("../../logo.svg");

export function Logo({ size = 28, color }: LogoProps) {
	return (
		<Image
			source={logoSource}
			style={{ width: size, height: size }}
			contentFit="contain"
			tintColor={color}
		/>
	);
}
