import { Asset } from "expo-asset";
import type * as WasmExports from "../wasm/simple_project_template_bg.wasm";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wasmAsset: number = require("../wasm/simple_project_template_bg.wasm");

let wasm: typeof WasmExports | null = null;

export async function initWasm(): Promise<void> {
	if (wasm) return;
	const [{ localUri, uri }] = await Asset.loadAsync(wasmAsset);
	const url = localUri ?? uri;
	if (!url) throw new Error("Failed to resolve WASM asset");
	const response = await fetch(url);
	const bytes = await response.arrayBuffer();

	const imports = {
		"./simple_project_template_bg.js": {
			__wbindgen_init_externref_table() {
				const table = wasm!.__wbindgen_externrefs;
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
}

function assertReady(): typeof WasmExports {
	if (!wasm) throw new Error("WASM not initialized — call initWasm() first");
	return wasm;
}

export const get_1 = (): number => assertReady().get_1();
