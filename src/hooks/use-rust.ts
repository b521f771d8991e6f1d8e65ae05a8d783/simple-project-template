import { useEffect, useState } from "react";
import { initRust } from "../lib/rust";

export function useRust() {
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		initRust()
			.then(() => setReady(true))
			.catch(setError);
	}, []);

	return { ready, error };
}
