import { apiSlice } from "@/redux/state/apiSlice";
import { Action, configureStore, isPlain, ThunkAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

function getEntriesWithToJsonSupport(x: any): [string, any][] {
	if ("toJson" in x) {
		return Object.entries(JSON.parse(x.toJson()));
	} else {
		console.assert(isPlain(x));
		return Object.entries(x);
	}
}

function isSerializableWithToJsonSupport(x: any): boolean {
	return isPlain(x) || "toJson" in x;
}

export const store = configureStore({
	reducer: {
		[apiSlice.reducerPath]: apiSlice.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				getEntries: getEntriesWithToJsonSupport,
				isSerializable: isSerializableWithToJsonSupport,
			},
		}).concat(apiSlice.middleware),
	devTools: process.env.NODE_ENV === "development",
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
export type AppThunk<ThunkReturnType = void> = ThunkAction<
	ThunkReturnType,
	AppState,
	unknown,
	Action
>;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();
