import init, { get_1 } from "../wasm/simple_project_template";

let initialized = false;

export async function initWasm(): Promise<void> {
	if (initialized) return;
	await init();
	initialized = true;
}

export { get_1 };
