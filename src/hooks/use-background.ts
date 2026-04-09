import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setBackgroundPattern, setBackgroundColor, type BackgroundPattern } from "@/redux/state/backgroundSlice";

export function useBackground() {
	const dispatch = useAppDispatch();
	const { pattern, color } = useAppSelector((s) => s.background);

	return {
		pattern,
		color,
		setPattern: (p: BackgroundPattern) => dispatch(setBackgroundPattern(p)),
		setColor: (c: string | null) => dispatch(setBackgroundColor(c)),
	};
}
