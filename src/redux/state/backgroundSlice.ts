import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BackgroundPattern =
	| "none" | "dots" | "grid" | "waves" | "diagonal" | "circuit"
	| "confetti" | "hexagons" | "aurora" | "bubbles"
	| "carbon" | "blueprint" | "radar" | "mesh";

interface BackgroundState {
	pattern: BackgroundPattern;
	/** null = use theme default */
	color: string | null;
}

const initialState: BackgroundState = {
	pattern: "none",
	color: null,
};

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
	},
});

export const { setBackgroundPattern, setBackgroundColor } = backgroundSlice.actions;
