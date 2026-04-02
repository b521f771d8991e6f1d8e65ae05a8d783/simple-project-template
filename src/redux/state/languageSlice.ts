import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Platform } from "react-native";

const SUPPORTED = ["en", "de", "fr", "es", "it", "pt", "ja", "zh", "ko", "he", "la"];

function detectLanguage(): string {
	try {
		const locales =
			Platform.OS === "web" && typeof navigator !== "undefined"
				? navigator.languages ?? [navigator.language]
				: [];
		for (const locale of locales) {
			const code = locale.split("-")[0].toLowerCase();
			if (SUPPORTED.includes(code)) return code;
		}
	} catch { /* fallback */ }
	return "en";
}

interface LanguageState {
	code: string;
}

const initialState: LanguageState = {
	code: detectLanguage(),
};

export const languageSlice = createSlice({
	name: "language",
	initialState,
	reducers: {
		setLanguage(state, action: PayloadAction<string>) {
			state.code = action.payload;
		},
	},
});

export const { setLanguage } = languageSlice.actions;
