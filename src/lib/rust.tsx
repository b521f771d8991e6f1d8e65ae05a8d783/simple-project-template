/**
 * Platform-agnostic Rust interop layer.
 *
 * This module provides a unified TypeScript API over the Rust library
 * (simple_project_template), routing calls to the appropriate backend:
 *
 *   - **Web / Cloudflare Workers** → WASM (wasm-bindgen, loaded via expo-asset)
 *   - **React Native (iOS/Android)** → Native module via Expo Modules bridge
 *     (calls the Rust cdylib/staticlib through a thin native wrapper)
 *   - **Tauri** → direct Rust calls via Tauri commands
 *     (the Rust backend is the Tauri app itself)
 *
 * Usage:
 *   import { initRust, get_1 } from "@/lib/rust";
 *
 *   await initRust();       // call once at app startup
 *   const value = get_1();  // call Rust functions
 *
 * Adding new functions:
 *   1. Add #[wasm_bindgen] + #[no_mangle] pub extern "C" fn in src-rust/lib.rs
 *   2. Run `npm run compile:wasm` to regenerate WASM bindings
 *   3. Add the export at the bottom of this file — types come from the .d.ts
 *   4. For native: expose the same function in the Expo Module / Tauri command
 *
 * The caller should not care which backend is used. All functions have
 * identical signatures regardless of platform.
 */

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import type * as WasmExports from "../wasm/simple_project_template_bg.wasm";

// ── Backend interface ───────────────────────────────────────────
// Every backend must provide the same set of functions.
// Add new Rust exports here as they are added to lib.rs.

interface RustBackend {
	get_1(): number;
}

let backend: RustBackend | null = null;

// ── WASM backend (web, workers) ─────────────────────────────────

async function initWasm(): Promise<RustBackend> {
	const { Asset } = await import("expo-asset");

	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const wasmAsset: number = require("../wasm/simple_project_template_bg.wasm");

	const [{ localUri, uri }] = await Asset.loadAsync(wasmAsset);
	const url = localUri ?? uri;
	if (!url) throw new Error("Failed to resolve WASM asset");
	const response = await fetch(url);
	const bytes = await response.arrayBuffer();

	let wasm: typeof WasmExports;
	const imports = {
		"./simple_project_template_bg.js": {
			__wbindgen_init_externref_table() {
				const table = wasm.__wbindgen_externrefs;
				const offset = table.grow(4);
				table.set(0, undefined);
				table.set(offset + 0, undefined);
				table.set(offset + 1, null);
				table.set(offset + 2, true);
				table.set(offset + 3, false);
			},
		},
	};

	const { instance } = await WebAssembly.instantiate(bytes, imports);
	wasm = instance.exports as typeof WasmExports;
	wasm.__wbindgen_start();

	return {
		get_1: () => wasm.get_1(),
	};
}

// ── Native backend (iOS/Android via Expo Modules) ───────────────
// TODO: Implement Expo Module that wraps the Rust cdylib/staticlib.
//
// The Expo Module should expose the same functions as the WASM backend.
// See: https://docs.expo.dev/modules/overview/
//
// Example Expo Module (Kotlin/Swift) calling Rust via JNI/C FFI:
//   - Android: load libsimple_project_template.so via System.loadLibrary()
//   - iOS: link libsimple_project_template.a, call extern "C" functions
//
// Once implemented, uncomment and update:
//
// async function initNative(): Promise<RustBackend> {
//   const NativeRust = require("../modules/rust-native").default;
//   return {
//     get_1: () => NativeRust.get_1(),
//   };
// }

// ── Tauri backend (desktop via Tauri commands) ──────────────────
// TODO: Implement Tauri commands that call the same Rust functions.
//
// In Tauri, the Rust backend IS the app — expose functions as
// #[tauri::command] and call them via @tauri-apps/api/core invoke().
//
// Once implemented, uncomment and update:
//
// async function initTauri(): Promise<RustBackend> {
//   const { invoke } = await import("@tauri-apps/api/core");
//   return {
//     get_1: () => invoke<number>("get_1"),
//   };
// }

// ── Initialization ──────────────────────────────────────────────

export async function initRust(): Promise<void> {
	if (backend) return;

	if (Platform.OS === "web") {
		backend = await initWasm();
	} else {
		// Native platforms (iOS/Android) — fall back to WASM until
		// the Expo Module native bridge is implemented.
		// Replace with initNative() once available.
		console.warn("Using wasm in a non-browser environment.");
		backend = await initWasm();
	}
}

function assertReady(): RustBackend {
	if (!backend)
		throw new Error("Rust not initialized — call initRust() first");
	return backend;
}

// ── React Provider ──────────────────────────────────────────────
// Wrap your app in <RustProvider> to initialize Rust before rendering.
// Children render only after the backend is ready.

const RustContext = createContext(false);

export function useRustReady() {
	return useContext(RustContext);
}

export function RustProvider({ children }: PropsWithChildren) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		initRust()
			.then(() => setReady(true))
			.catch(console.error)
			.finally(() => SplashScreen.hideAsync());
	}, []);

	if (!ready) return null;

	return (
		<RustContext.Provider value={ready}>
			{children}
		</RustContext.Provider>
	);
}

// ── Exported functions ──────────────────────────────────────────
// Add one line per #[wasm_bindgen] export from src-rust/lib.rs.
// Types are enforced by the RustBackend interface.

export const get_1 = (): number => assertReady().get_1();
