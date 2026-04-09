import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "system" | "light" | "dark";
export type NavPosition = "top" | "bottom";

interface ThemeState {
	mode: ThemeMode;
	navPosition: NavPosition;
}

const initialState: ThemeState = {
	mode: "system",
	navPosition: "top",
};

export const themeSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		setThemeMode(state, action: PayloadAction<ThemeMode>) {
			state.mode = action.payload;
		},
		toggleTheme(state) {
			if (state.mode === "light") {
				state.mode = "dark";
			} else {
				state.mode = "light";
			}
		},
		toggleNavPosition(state) {
			state.navPosition = state.navPosition === "top" ? "bottom" : "top";
		},
	},
});

export const { setThemeMode, toggleTheme, toggleNavPosition } = themeSlice.actions;
