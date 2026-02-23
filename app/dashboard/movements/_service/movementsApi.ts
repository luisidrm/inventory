import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl, getToken } from "@/lib/auth-api";
import { parsePaginated } from "@/lib/api-utils";
import type {
  InventoryMovementResponse,
  CreateInventoryMovementRequest,
  PaginationInfo,
} from "@/lib/dashboard-types";

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo | null;
}

interface GetMovementsArgs {
  page?: number;
  perPage?: number;
  sortOrder?: "asc" | "desc";
}

export const movementsApi = createApi({
  reducerPath: "movementsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl(),
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", "Bearer " + token);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["InventoryMovement", "Inventory"],
  endpoints: (builder) => ({
    getMovements: builder.query<PaginatedResult<InventoryMovementResponse>, GetMovementsArgs>({
      query: (arg) => {
        const page = arg?.page ?? 1;
        const perPage = arg?.perPage ?? 10;
        const sortOrder = arg?.sortOrder ?? "desc";
        return "/inventory-movement?page=" + page + "&perPage=" + perPage + "&sortOrder=" + sortOrder;
      },
      transformResponse: (raw: unknown, _meta, arg) =>
        parsePaginated<InventoryMovementResponse>(raw, arg?.perPage ?? 10),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "InventoryMovement" as const, id })),
              { type: "InventoryMovement", id: "LIST" },
            ]
          : [{ type: "InventoryMovement", id: "LIST" }],
    }),
    createMovement: builder.mutation<InventoryMovementResponse, CreateInventoryMovementRequest>({
      query: (body) => ({ url: "/inventory-movement", method: "POST", body }),
      transformResponse: (raw: InventoryMovementResponse | { data: InventoryMovementResponse }) =>
        "data" in raw ? raw.data : raw,
      invalidatesTags: [
        { type: "InventoryMovement", id: "LIST" },
        { type: "Inventory", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMovementsQuery,
  useCreateMovementMutation,
} = movementsApi;
