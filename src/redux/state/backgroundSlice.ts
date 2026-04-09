import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Appearance } from "react-native";

export type BackgroundPattern =
	| "none" | "dots" | "grid" | "waves" | "diagonal" | "circuit"
	| "confetti" | "hexagons" | "aurora" | "bubbles"
	| "carbon" | "blueprint" | "radar" | "mesh";

interface BackgroundState {
	pattern: BackgroundPattern;
	/** null = use theme default */
	color: string | null;
	/** URI of an image background; takes priority over color + pattern when set */
	image: string | null;
}

const isDark = Appearance.getColorScheme() === "dark";
const initialState: BackgroundState = isDark
	? { pattern: "circuit", color: "#4a4a52", image: null }
	: { pattern: "circuit", color: "#f5f5f7", image: null };

export const backgroundSlice = createSlice({
	name: "background",
	initialState,
	reducers: {
		setBackgroundPattern(state, action: PayloadAction<BackgroundPattern>) {
			state.pattern = action.payload;
		},
		setBackgroundColor(state, action: PayloadAction<string | null>) {
			state.color = action.payload;
		},
		setBackgroundImage(state, action: PayloadAction<string | null>) {
			state.image = action.payload;
		},
	},
});

export const { setBackgroundPattern, setBackgroundColor, setBackgroundImage } = backgroundSlice.actions;
