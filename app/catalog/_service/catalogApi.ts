import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl } from "@/lib/auth-api";
import type {
  PublicLocation,
  PublicCatalogItem,
  PaginationMeta,
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

function normalizeLocations(raw: unknown): PublicLocation[] {
  const base = parseList<any>(raw);

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayKey = days[new Date().getDay()];

  return base.map((loc) => {
    const businessHours = loc.businessHours as
      | Record<string, { open: string; close: string } | null>
      | undefined;
    const today = businessHours?.[todayKey] ?? null;

    const coordinates = loc.coordinates as
      | { lat?: number; lng?: number }
      | undefined;

    const latitude =
      loc.latitude ?? loc.lat ?? coordinates?.lat ?? null;
    const longitude =
      loc.longitude ?? loc.lng ?? coordinates?.lng ?? null;

    const todayOpen = today?.open ?? null;
    const todayClose = today?.close ?? null;

    return {
      ...loc,
      businessHours,
      coordinates,
      latitude,
      longitude,
      lat: latitude,
      lng: longitude,
      todayOpen,
      todayClose,
      isOpenNow: loc.isOpenNow ?? null,
    } as PublicLocation;
  });
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
      transformResponse: (raw: unknown) => normalizeLocations(raw),
    }),

    getPublicCatalog: builder.query<PublicCatalogItem[], number>({
      query: (locationId) => `/public/catalog?locationId=${locationId}`,
      transformResponse: (raw: unknown) => parseList<PublicCatalogItem>(raw),
    }),

    getAllPublicProducts: builder.query<
      { data: PublicCatalogItem[]; pagination: PaginationMeta },
      { page: number; pageSize: number }
    >({
      query: ({ page, pageSize }) =>
        `/public/catalog?all=true&page=${page}&pageSize=${pageSize}`,
    }),
  }),
});

export const {
  useGetPublicLocationsQuery,
  useGetPublicCatalogQuery,
  useLazyGetPublicCatalogQuery,
  useGetAllPublicProductsQuery,
} = catalogApi;
