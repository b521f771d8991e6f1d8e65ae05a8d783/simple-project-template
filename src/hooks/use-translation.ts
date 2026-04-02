import { useAppSelector } from "@/redux/store";
import { t } from "@/lib/translations";

export function useTranslation() {
	const lang = useAppSelector((state) => state.language.code);
	return (key: string) => t(key, lang);
}
