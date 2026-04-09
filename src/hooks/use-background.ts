import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setBackgroundPattern, setBackgroundColor, setBackgroundImage, type BackgroundPattern } from "@/redux/state/backgroundSlice";

export function useBackground() {
	const dispatch = useAppDispatch();
	const { pattern, color, image } = useAppSelector((s) => s.background);

	return {
		pattern,
		color,
		image,
		setPattern: (p: BackgroundPattern) => dispatch(setBackgroundPattern(p)),
		setColor: (c: string | null) => dispatch(setBackgroundColor(c)),
		setImage: (uri: string | null) => dispatch(setBackgroundImage(uri)),
	};
}
