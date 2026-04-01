import { useEffect, useState } from "react";
import { initWasm } from "../lib/wasm";

export function useWasm() {
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		initWasm()
			.then(() => setReady(true))
			.catch(setError);
	}, []);

	return { ready, error };
}
