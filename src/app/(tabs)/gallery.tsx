import { useState } from "react";
import { ScrollView, View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBackground } from "@/hooks/use-background";
import { PATTERN_OPTIONS, COLOR_PRESETS, getPatternRenderer } from "@/lib/background-patterns";
import { useAppDispatch } from "@/redux/store";
import { setThemeMode } from "@/redux/state/themeSlice";
import Svg, { Rect as SvgRect } from "react-native-svg";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { Divider } from "@/components/ui/divider";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";
import { HelloWave } from "@/components/hello-wave";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ReadingDino } from "@/components/reading-dino";
import { SleepingDino } from "@/components/sleeping-dino";
import { CodingDino } from "@/components/coding-dino";

function Row({ children, label }: { children: React.ReactNode; label?: string }) {
	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];
	return (
		<View style={styles.row}>
			{children}
			{label && <Text style={[styles.rowLabel, { color: c.textSecondary }]}>{label}</Text>}
		</View>
	);
}

export default function GalleryScreen() {
	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];
	const dark = colorScheme === "dark";
	const bg = useBackground();
	const dispatch = useAppDispatch();
	const [toggle1, setToggle1] = useState(true);
	const [toggle2, setToggle2] = useState(false);
	const [check1, setCheck1] = useState(true);
	const [check2, setCheck2] = useState(false);
	const [check3, setCheck3] = useState(true);
	const [textVal, setTextVal] = useState("");
	const [multiVal, setMultiVal] = useState("");
	const [passVal, setPassVal] = useState("");
	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: (bg.pattern !== "none" || bg.color) ? "transparent" : c.background }}
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
		>
		<View style={styles.inner}>
			<Text style={[styles.pageTitle, { color: c.text }]}>Gallery</Text>
			<Text style={[styles.pageSubtitle, { color: c.textSecondary }]}>
				Components &amp; dinosaurs, by example
			</Text>

			{/* ── Dinosaurs ─────────────────────────────────────── */}
			<LiquidGlass title="Dinosaurs" style={styles.dinoCard}>
				<View style={styles.dinoGrid}>
					<View style={styles.dinoItem}>
						<ReadingDino dark={dark} />
						<Text style={[styles.dinoLabel, { color: c.textSecondary }]}>ReadingDino</Text>
					</View>
					<View style={styles.dinoItem}>
						<SleepingDino dark={dark} />
						<Text style={[styles.dinoLabel, { color: c.textSecondary }]}>SleepingDino</Text>
					</View>
					<View style={styles.dinoItem}>
						<CodingDino dark={dark} />
						<Text style={[styles.dinoLabel, { color: c.textSecondary }]}>CodingDino</Text>
					</View>
				</View>
			</LiquidGlass>

			{/* ── Typography ────────────────────────────────────── */}
			<LiquidGlass title="Typography" style={styles.typeCard}>
				<View style={styles.typeRow}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Title</Text>
					<ThemedText type="title">The quick brown fox</ThemedText>
				</View>
				<Divider />
				<View style={styles.typeRow}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Subtitle</Text>
					<ThemedText type="subtitle">The quick brown fox</ThemedText>
				</View>
				<Divider />
				<View style={styles.typeRow}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Headline</Text>
					<ThemedText type="headline">The quick brown fox</ThemedText>
				</View>
				<Divider />
				<View style={styles.typeRow}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Body</Text>
					<ThemedText type="body">The quick brown fox jumps over the lazy dog.</ThemedText>
				</View>
				<Divider />
				<View style={styles.typeRow}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Caption</Text>
					<ThemedText type="caption" style={{ color: c.textSecondary }}>The quick brown fox jumps over the lazy dog.</ThemedText>
				</View>
			</LiquidGlass>

			{/* ── Buttons ───────────────────────────────────────── */}
			<LiquidGlass title="Buttons" style={styles.typeCard}>
				{(
					[
						["primary",     "Primary"],
						["secondary",   "Secondary"],
						["destructive", "Destructive"],
						["outline",     "Outline"],
					] as const
				).map(([variant, label], i, arr) => (
					<View key={variant}>
						<View style={styles.btnRow}>
							<Text style={[styles.typeLabel, { color: c.textSecondary, width: 84 }]}>{label}</Text>
							<View style={styles.btnSizes}>
								<Button label="Small"  variant={variant} size="sm" />
								<Button label="Medium" variant={variant} size="md" />
							</View>
						</View>
						{i < arr.length - 1 && (
							<Divider />
						)}
					</View>
				))}
			</LiquidGlass>

			{/* ── Toggle ────────────────────────────────────────── */}
			<LiquidGlass title="Toggle" style={styles.card}>
				<View style={styles.toggleRow}>
					<Text style={[styles.toggleLabel, { color: c.text }]}>Enabled</Text>
					<Toggle value={toggle1} onValueChange={setToggle1} />
				</View>
				<View style={styles.toggleRow}>
					<Text style={[styles.toggleLabel, { color: c.text }]}>Disabled</Text>
					<Toggle value={toggle2} onValueChange={setToggle2} />
				</View>
				<View style={styles.toggleRow}>
					<Text style={[styles.toggleLabel, { color: c.textSecondary }]}>Disabled (off)</Text>
					<Toggle value={false} disabled />
				</View>
			</LiquidGlass>

			{/* ── Checkbox ──────────────────────────────────────── */}
			<LiquidGlass title="Checkbox" style={styles.card}>
				<Row label="Checked">
					<Checkbox checked={check1} onValueChange={setCheck1} />
				</Row>
				<Row label="Unchecked">
					<Checkbox checked={check2} onValueChange={setCheck2} />
				</Row>
				<Row label="Checked">
					<Checkbox checked={check3} onValueChange={setCheck3} />
				</Row>
				<Row label="Disabled">
					<Checkbox checked={false} disabled />
				</Row>
			</LiquidGlass>

			{/* ── Logo ─────────────────────────────────────────── */}
			<LiquidGlass title="Logo" style={styles.card}>
				<View style={styles.logoRow}>
					{[16, 24, 36, 48].map((size) => (
						<View key={size} style={styles.logoItem}>
							<Logo size={size} color={c.text} />
							<Text style={[styles.rowLabel, { color: c.textSecondary }]}>{size}px</Text>
						</View>
					))}
				</View>
			</LiquidGlass>

			{/* ── Icons ────────────────────────────────────────── */}
			<LiquidGlass title="Icons" style={styles.card}>
				<View style={styles.iconGrid}>
					{(
						[
							["house.fill", "house.fill"],
							["paperplane.fill", "paperplane.fill"],
							["chevron.right", "chevron.right"],
							["sparkles", "sparkles"],
							["chevron.left.forwardslash.chevron.right", "code"],
							["photo.on.rectangle", "photo.on.rectangle"],
						] as const
					).map(([name, label]) => (
						<View key={name} style={styles.iconItem}>
							<IconSymbol name={name} size={28} color={c.icon} />
							<Text style={[styles.iconLabel, { color: c.textSecondary }]}>{label}</Text>
						</View>
					))}
				</View>
			</LiquidGlass>

			{/* ── HelloWave ────────────────────────────────────── */}
			<LiquidGlass title="HelloWave" style={styles.card}>
				<Row label="Animated SVG waving hand">
					<HelloWave />
				</Row>
			</LiquidGlass>

			{/* ── Collapsible ──────────────────────────────────── */}
			<LiquidGlass title="Collapsible" style={styles.card}>
				<Collapsible title="Expand me">
					<ThemedText type="body">
						Hidden content revealed on tap. Great for FAQs, details, or long descriptions.
					</ThemedText>
				</Collapsible>
				<Collapsible title="Another section">
					<ThemedText type="body">Each collapsible manages its own open/closed state.</ThemedText>
				</Collapsible>
			</LiquidGlass>

			{/* ── Text Inputs ──────────────────────────────────── */}
			<LiquidGlass title="Text Inputs" style={styles.typeCard}>
				<View style={styles.inputGroup}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Single line</Text>
					<TextInput
						value={textVal}
						onChangeText={setTextVal}
						placeholder="Type something…"
						placeholderTextColor={c.textSecondary}
						style={[styles.textInput, { color: c.text, backgroundColor: dark ? "#2c2c2e" : "#f0f0f0" }]}
					/>
				</View>
				<Divider />
				<View style={styles.inputGroup}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Multiline</Text>
					<TextInput
						value={multiVal}
						onChangeText={setMultiVal}
						placeholder="Type multiple lines…"
						placeholderTextColor={c.textSecondary}
						style={[styles.textInput, styles.textArea, { color: c.text, backgroundColor: dark ? "#2c2c2e" : "#f0f0f0" }]}
						multiline
					/>
				</View>
				<Divider />
				<View style={styles.inputGroup}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Password</Text>
					<TextInput
						value={passVal}
						onChangeText={setPassVal}
						placeholder="Password"
						placeholderTextColor={c.textSecondary}
						secureTextEntry
						style={[styles.textInput, { color: c.text, backgroundColor: dark ? "#2c2c2e" : "#f0f0f0" }]}
					/>
				</View>
				<Divider />
				<View style={styles.inputGroup}>
					<Text style={[styles.typeLabel, { color: c.textSecondary }]}>Disabled</Text>
					<TextInput
						value="Cannot edit this"
						editable={false}
						style={[styles.textInput, { color: c.textSecondary, backgroundColor: dark ? "#1c1c1e" : "#e8e8e8" }]}
					/>
				</View>
			</LiquidGlass>

			{/* ── ThemedView ───────────────────────────────────── */}
			<LiquidGlass title="ThemedView" style={styles.card}>
				<ThemedView style={styles.themedViewDemo}>
					<ThemedText type="body">ThemedView adapts its background to the current theme.</ThemedText>
				</ThemedView>
			</LiquidGlass>

			{/* ── LiquidGlass ──────────────────────────────────── */}
			<LiquidGlass title="LiquidGlass" radius={28} style={styles.card}>
				<ThemedText type="headline">You are looking at one right now.</ThemedText>
				<ThemedText type="body">Frosted glass surface with blur, border, and shadow.</ThemedText>
				<View style={styles.glassRow}>
					<LiquidGlass radius={12} padding={10}>
						<ThemedText type="caption">radius 12</ThemedText>
					</LiquidGlass>
					<LiquidGlass radius={24} padding={10}>
						<ThemedText type="caption">radius 24</ThemedText>
					</LiquidGlass>
					<LiquidGlass radius={980} padding={10} style={{ paddingHorizontal: 16 }}>
						<ThemedText type="caption">pill</ThemedText>
					</LiquidGlass>
				</View>
			</LiquidGlass>

			{/* ── Background Color ────────────────────────────── */}
			<LiquidGlass title="Background Color" style={styles.card}>
				<Text style={[styles.typeLabel, { color: c.textSecondary, marginBottom: 8 }]}>Light</Text>
				<View style={styles.bgGrid}>
					{COLOR_PRESETS.filter((p) => !p.dark).map((preset) => {
						const active = bg.color === preset.value;
						const display = preset.value ?? c.background;
						return (
							<View key={preset.label} style={styles.colorItem}>
								<Pressable
									onPress={() => { bg.setColor(preset.value); dispatch(setThemeMode("light")); }}
									style={[
										styles.colorTile,
										{
											backgroundColor: display,
											borderColor: active ? c.accent : c.border,
											borderWidth: active ? 2 : StyleSheet.hairlineWidth,
										},
									]}
								/>
								<Text style={[styles.bgLabel, { color: active ? c.accent : c.textSecondary }]}>
									{preset.label}
								</Text>
							</View>
						);
					})}
				</View>
				<Text style={[styles.typeLabel, { color: c.textSecondary, marginTop: 16, marginBottom: 8 }]}>Dark</Text>
				<View style={styles.bgGrid}>
					{COLOR_PRESETS.filter((p) => p.dark).map((preset) => {
						const active = bg.color === preset.value;
						return (
							<View key={preset.label} style={styles.colorItem}>
								<Pressable
									onPress={() => { bg.setColor(preset.value); dispatch(setThemeMode("dark")); }}
									style={[
										styles.colorTile,
										{
											backgroundColor: preset.value!,
											borderColor: active ? c.accent : "rgba(255,255,255,0.15)",
											borderWidth: active ? 2 : 1,
										},
									]}
								/>
								<Text style={[styles.bgLabel, { color: active ? c.accent : c.textSecondary }]}>
									{preset.label}
								</Text>
							</View>
						);
					})}
				</View>
			</LiquidGlass>

			{/* ── Background Pattern ─────────────────────────── */}
			<LiquidGlass title="Background Pattern" style={styles.card}>
				<View style={styles.bgGrid}>
					{PATTERN_OPTIONS.map((opt) => {
						const active = bg.pattern === opt.key;
						const renderer = getPatternRenderer(opt.key);
						return (
							<Pressable
								key={opt.key}
								onPress={() => bg.setPattern(opt.key)}
								style={[
									styles.bgTile,
									{
										borderColor: active ? c.accent : c.border,
										borderWidth: active ? 2 : StyleSheet.hairlineWidth,
										backgroundColor: bg.color ?? c.background,
									},
								]}
							>
								{renderer && (
									<Svg
										width="100%"
										height="100%"
										style={StyleSheet.absoluteFill}
										pointerEvents="none"
									>
										<SvgRect width="100%" height="100%" fill={bg.color ?? c.background} />
										{renderer(c.accent)}
									</Svg>
								)}
								<Text style={[styles.bgLabel, { color: active ? c.accent : c.textSecondary }]}>
									{opt.label}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</LiquidGlass>

			{/* ── Color Palette ────────────────────────────────── */}
			<LiquidGlass title="Color Palette" style={styles.card}>
				<View style={styles.paletteGrid}>
					{(
						[
							["text", c.text],
							["textSecondary", c.textSecondary],
							["background", c.background],
							["backgroundSecondary", c.backgroundSecondary],
							["accent", c.accent],
							["border", c.border],
							["icon", c.icon],
						] as const
					).map(([name, color]) => (
						<View key={name} style={styles.paletteItem}>
							<View style={[styles.swatch, { backgroundColor: color, borderColor: c.border }]} />
							<Text style={[styles.swatchLabel, { color: c.textSecondary }]}>{name}</Text>
						</View>
					))}
				</View>
			</LiquidGlass>

			<View style={{ height: 80 }} />
		</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		paddingTop: 80,
		paddingBottom: 40,
		paddingHorizontal: 20,
	},
	inner: {
		width: "100%",
		maxWidth: 720,
		gap: 24,
	},
	pageTitle: {
		fontSize: 34,
		fontWeight: "700",
		letterSpacing: -0.5,
	},
	pageSubtitle: {
		fontSize: 15,
		marginTop: 4,
		marginBottom: 8,
	},
	card: {
		gap: 12,
	},
	typeCard: {
		gap: 0,
		overflow: "hidden",
	},
	typeRow: {
		paddingVertical: 14,
		gap: 2,
	},
	typeLabel: {
		fontSize: 10,
		fontWeight: "500",
		letterSpacing: 0.4,
		textTransform: "uppercase",
	},
	btnRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		gap: 8,
	},
	btnSizes: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 8,
	},
	dinoCard: {
		paddingVertical: 20,
	},
	dinoGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-around",
		gap: 16,
	},
	dinoItem: {
		alignItems: "center",
		gap: 6,
	},
	dinoLabel: {
		fontSize: 11,
		fontWeight: "500",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	rowLabel: {
		fontSize: 13,
	},
	logoRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 20,
	},
	logoItem: {
		alignItems: "center",
		gap: 6,
	},
	iconGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 20,
	},
	iconItem: {
		alignItems: "center",
		gap: 4,
		minWidth: 60,
	},
	iconLabel: {
		fontSize: 10,
		textAlign: "center",
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	toggleLabel: {
		fontSize: 15,
		fontWeight: "400",
	},
	glassRow: {
		flexDirection: "row",
		gap: 10,
		flexWrap: "wrap",
	},
	themedViewDemo: {
		borderRadius: 10,
		padding: 14,
	},
	paletteGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	paletteItem: {
		alignItems: "center",
		gap: 4,
		width: 72,
	},
	swatch: {
		width: 44,
		height: 44,
		borderRadius: 10,
		borderWidth: StyleSheet.hairlineWidth,
	},
	swatchLabel: {
		fontSize: 10,
		textAlign: "center",
	},
	bgGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	colorItem: {
		alignItems: "center",
		gap: 4,
	},
	colorTile: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	bgTile: {
		width: 140,
		height: 140,
		borderRadius: 70,
		alignItems: "center",
		justifyContent: "flex-end",
		paddingBottom: 14,
		overflow: "hidden",
	},
	bgLabel: {
		fontSize: 10,
		fontWeight: "500",
		zIndex: 1,
	},
	inputGroup: {
		paddingVertical: 14,
		gap: 8,
	},
	textInput: {
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 15,
	},
	textArea: {
		minHeight: 72,
		textAlignVertical: "top",
	},
});
