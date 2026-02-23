import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl, getToken } from "@/lib/auth-api";
import { parsePaginated } from "@/lib/api-utils";
import type {
  InventoryResponse,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  PaginationInfo,
} from "@/lib/dashboard-types";

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo | null;
}

interface GetInventoryArgs {
  page?: number;
  perPage?: number;
  sortOrder?: "asc" | "desc";
}

interface UpdateInventoryArgs {
  id: number;
  body: UpdateInventoryRequest;
}

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl(),
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Inventory"],
  endpoints: (builder) => ({
    getInventories: builder.query<PaginatedResult<InventoryResponse>, GetInventoryArgs>({
      query: ({ page = 1, perPage = 10, sortOrder = "desc" } = {}) =>
        `/inventory?page=${page}&perPage=${perPage}&sortOrder=${sortOrder}`,
      transformResponse: (raw: unknown, _meta, arg) =>
        parsePaginated<InventoryResponse>(raw, arg.perPage ?? 10),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Inventory" as const, id })),
              { type: "Inventory", id: "LIST" },
            ]
          : [{ type: "Inventory", id: "LIST" }],
    }),
    createInventory: builder.mutation<InventoryResponse, CreateInventoryRequest>({
      query: (body) => ({ url: "/inventory", method: "POST", body }),
      transformResponse: (raw: InventoryResponse | { data: InventoryResponse }) =>
        "data" in raw ? raw.data : raw,
      invalidatesTags: [{ type: "Inventory", id: "LIST" }],
    }),
    updateInventory: builder.mutation<void, UpdateInventoryArgs>({
      query: ({ id, body }) => ({ url: `/inventory?id=${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Inventory", id }, { type: "Inventory", id: "LIST" }],
    }),
    deleteInventory: builder.mutation<void, number>({
      query: (id) => ({ url: `/inventory?id=${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Inventory", id }, { type: "Inventory", id: "LIST" }],
    }),
  }),
});

export const {
  useGetInventoriesQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} = inventoryApi;
