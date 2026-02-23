import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl, getToken } from "@/lib/auth-api";
import { parsePaginated } from "@/lib/api-utils";
import type {
  SupplierResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  PaginationInfo,
} from "@/lib/dashboard-types";

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo | null;
}

interface GetSuppliersArgs {
  page?: number;
  perPage?: number;
  sortOrder?: "asc" | "desc";
}

interface UpdateSupplierArgs {
  id: number;
  body: UpdateSupplierRequest;
}

export const suppliersApi = createApi({
  reducerPath: "suppliersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl(),
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", "Bearer " + token);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Supplier"],
  endpoints: (builder) => ({
    getSuppliers: builder.query<PaginatedResult<SupplierResponse>, GetSuppliersArgs>({
      query: (arg) => {
        const page = arg?.page ?? 1;
        const perPage = arg?.perPage ?? 10;
        const sortOrder = arg?.sortOrder ?? "desc";
        return "/supplier?page=" + page + "&perPage=" + perPage + "&sortOrder=" + sortOrder;
      },
      transformResponse: (raw: unknown, _meta, arg) =>
        parsePaginated<SupplierResponse>(raw, arg?.perPage ?? 10),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Supplier" as const, id })),
              { type: "Supplier", id: "LIST" },
            ]
          : [{ type: "Supplier", id: "LIST" }],
    }),
    createSupplier: builder.mutation<SupplierResponse, CreateSupplierRequest>({
      query: (body) => ({ url: "/supplier", method: "POST", body }),
      transformResponse: (raw: SupplierResponse | { data: SupplierResponse }) =>
        "data" in raw ? raw.data : raw,
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),
    updateSupplier: builder.mutation<void, UpdateSupplierArgs>({
      query: ({ id, body }) => ({ url: "/supplier?id=" + id, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Supplier", id }, { type: "Supplier", id: "LIST" }],
    }),
    deleteSupplier: builder.mutation<void, number>({
      query: (id) => ({ url: "/supplier?id=" + id, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Supplier", id }, { type: "Supplier", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi;
