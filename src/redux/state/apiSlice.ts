import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
	reducerPath: "api",
	baseQuery: fetchBaseQuery({
		baseUrl: "/api",
	}),
	endpoints: (builder) => ({
		getBackendVersion: builder.query<string, void>({
			query: () => ({
				url: "/version",
				method: "GET",
				responseHandler: (response) => response.text(),
			}),
		}),
		getBackendStatus: builder.query<boolean, void>({
			query: () => ({
				url: "/status",
				method: "GET",
				responseHandler: (response) => response.text(),
			}),
			transformResponse: (response: string) => response === "👌",
		}),
		getAppConfig: builder.query<unknown, void>({
			query: () => ({ url: "/app-config.json" }),
		}),
	}),
});

export const {
	useGetBackendVersionQuery,
	useGetBackendStatusQuery,
	useGetAppConfigQuery,
} = apiSlice;
