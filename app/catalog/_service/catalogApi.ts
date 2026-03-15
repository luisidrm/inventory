import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl } from "@/lib/auth-api";
import type {
  PublicLocation,
  PublicCatalogItem,
} from "@/lib/dashboard-types";


function parseList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const obj = raw as Record<string, unknown> | null;
  if (!obj) return [];
  const inner = obj.result ?? obj.data ?? obj;
  if (Array.isArray(inner)) return inner as T[];
  const nested = inner as Record<string, unknown> | null;
  if (nested && Array.isArray(nested.data)) return nested.data as T[];
  return [];
}

export const catalogApi = createApi({
  reducerPath: "catalogApi",

  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl(),
    prepareHeaders: (headers) => {
      headers.set("ngrok-skip-browser-warning", "true");
      return headers;
    },
  }),

  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,

  endpoints: (builder) => ({
    getPublicLocations: builder.query<PublicLocation[], void>({
      query: () => "/public/locations",
      transformResponse: (raw: unknown) => parseList<PublicLocation>(raw),
    }),

    getPublicCatalog: builder.query<PublicCatalogItem[], number>({
      query: (locationId) => `/public/catalog?locationId=${locationId}`,
      transformResponse: (raw: unknown) => parseList<PublicCatalogItem>(raw),
    }),
  }),
});

export const {
  useGetPublicLocationsQuery,
  useGetPublicCatalogQuery,
  useLazyGetPublicCatalogQuery,
} = catalogApi;
