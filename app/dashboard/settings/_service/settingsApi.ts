import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl, getToken } from "@/lib/auth-api";
import type { GroupedSettingsResponse, UpdateGroupedSettingsRequest } from "@/lib/dashboard-types";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl(),
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Setting"],
  endpoints: (builder) => ({
    getGroupedSettings: builder.query<GroupedSettingsResponse, void>({
      query: () => "/setting/grouped",
      transformResponse: (raw: GroupedSettingsResponse | { data: GroupedSettingsResponse }) =>
        raw && typeof raw === "object" && "data" in raw ? (raw as { data: GroupedSettingsResponse }).data : (raw as GroupedSettingsResponse),
      providesTags: ["Setting"],
    }),
    updateGroupedSettings: builder.mutation<void, UpdateGroupedSettingsRequest>({
      query: (body) => ({ url: "/setting/grouped", method: "PUT", body }),
      invalidatesTags: ["Setting"],
    }),
  }),
});

export const {
  useGetGroupedSettingsQuery,
  useUpdateGroupedSettingsMutation,
} = settingsApi;
