import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setLanguage } from "@/redux/state/languageSlice";

export interface Language {
	code: string;
	flag: string;
	name: string;
}

export const LANGUAGES: Language[] = [
	{ code: "en", flag: "🇬🇧", name: "English" },
	{ code: "de", flag: "🇩🇪", name: "Deutsch" },
	{ code: "fr", flag: "🇫🇷", name: "Français" },
	{ code: "es", flag: "🇪🇸", name: "Español" },
	{ code: "it", flag: "🇮🇹", name: "Italiano" },
	{ code: "pt", flag: "🇵🇹", name: "Português" },
	{ code: "ja", flag: "🇯🇵", name: "日本語" },
	{ code: "zh", flag: "🇨🇳", name: "中文" },
	{ code: "ko", flag: "🇰🇷", name: "한국어" },
	{ code: "he", flag: "🇮🇱", name: "עברית" },
	{ code: "la", flag: "🏛️", name: "Latina" },
];

interface LanguageSelectorProps {
	selected?: string;
	onSelect?: (code: string) => void;
}

export function LanguageSelector({ selected, onSelect }: LanguageSelectorProps) {
	const [open, setOpen] = useState(false);
	const colorScheme = useColorScheme() ?? "light";
	const c = Colors[colorScheme];
	const dispatch = useAppDispatch();
	const reduxLang = useAppSelector((state) => state.language.code);

	const activeLang = selected ?? reduxLang;
	const current = LANGUAGES.find((l) => l.code === activeLang) ?? LANGUAGES[0];

	const handleSelect = (code: string) => {
		dispatch(setLanguage(code));
		onSelect?.(code);
		setOpen(false);
	};

	return (
		<>
			<Pressable onPress={() => setOpen(true)} style={styles.trigger}>
				<Text style={styles.flag}>{current.flag}</Text>
			</Pressable>

			<Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
				<Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
				<View style={[styles.dropdown, { backgroundColor: c.background, borderColor: c.border }]}>
					{LANGUAGES.map((lang) => (
						<Pressable
							key={lang.code}
							onPress={() => handleSelect(lang.code)}
							style={[styles.option, lang.code === activeLang && { backgroundColor: c.accent + "20" }]}
						>
							<Text style={styles.optionFlag}>{lang.flag}</Text>
							<Text style={[styles.optionName, { color: c.text }]}>{lang.name}</Text>
						</Pressable>
					))}
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	trigger: {
		paddingHorizontal: 8,
		justifyContent: "center",
		height: "100%",
	},
	flag: {
		fontSize: 18,
	},
	dropdown: {
		position: "absolute",
		top: 52,
		right: 16,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		paddingVertical: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		minWidth: 160,
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 10,
		gap: 10,
	},
	optionFlag: {
		fontSize: 18,
	},
	optionName: {
		fontSize: 14,
	},
});
