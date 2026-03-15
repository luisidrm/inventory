import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl, getToken } from "@/lib/auth-api";
import {
  parsePaginated,
  parseChartResult,
  parseSummaryResult,
  type PaginatedResult,
} from "@/lib/api-utils";
import type {
  ProductResponse,
  ProductCategoryResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from "../../../../lib/dashboard-types";

interface GetProductsArgs {
  page?: number;
  perPage?: number;
  sortOrder?: "asc" | "desc";
}

interface GetCategoriesArgs {
  page?: number;
  perPage?: number;
}

interface UpdateProductArgs {
  id: number;
  body: UpdateProductRequest;
}

// ─── API slice ────────────────────────────────────────────────────────────────

export const productsApi = createApi({
  reducerPath: "productsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl(),
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      headers.set("ngrok-skip-browser-warning", "true");
      return headers;
    },
  }),

  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,

  tagTypes: ["Product", "ProductCategory"],

  endpoints: (builder) => ({

    // GET /product
    getProducts: builder.query<PaginatedResult<ProductResponse>, GetProductsArgs>({
      query: ({ page = 1, perPage = 10, sortOrder = "desc" } = {}) =>
        `/product?page=${page}&perPage=${perPage}&sortOrder=${sortOrder}`,
      transformResponse: (raw: unknown, _meta, arg) =>
        parsePaginated<ProductResponse>(raw, arg.perPage ?? 10),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Product" as const, id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),

    // POST /product
    createProduct: builder.mutation<ProductResponse, CreateProductRequest>({
      query: (body) => ({
        url: "/product",
        method: "POST",
        body,
      }),
      transformResponse: (raw: ProductResponse | { data?: ProductResponse; result?: ProductResponse }) => {
        const obj = raw as Record<string, unknown>;
        if (obj && typeof obj === "object" && (obj.data != null || obj.result != null)) {
          return (obj.data ?? obj.result) as ProductResponse;
        }
        return raw as ProductResponse;
      },
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    // PUT /product?id=
    updateProduct: builder.mutation<void, UpdateProductArgs>({
      query: ({ id, body }) => ({
        url: `/product?id=${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    // DELETE /product?id=
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `/product?id=${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    // GET /product-category
    getProductCategories: builder.query<PaginatedResult<ProductCategoryResponse>, GetCategoriesArgs>({
      query: ({ page = 1, perPage = 100 } = {}) =>
        `/product-category?page=${page}&perPage=${perPage}`,
      transformResponse: (raw: unknown, _meta, arg) =>
        parsePaginated<ProductCategoryResponse>(raw, arg.perPage ?? 100),
      providesTags: [{ type: "ProductCategory", id: "LIST" }],
    }),

    // GET /product/stats (KPIs)
    getProductStats: builder.query<Record<string, unknown> | null, { from?: string; to?: string } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg?.from) params.set("from", arg.from);
        if (arg?.to) params.set("to", arg.to);
        const q = params.toString();
        return `/product/stats${q ? `?${q}` : ""}`;
      },
      transformResponse: parseSummaryResult<Record<string, unknown>>,
    }),
    // GET /product/performance (barras)
    getProductPerformance: builder.query<{ label: string; value: number; date?: string }[], { days?: number; from?: string; to?: string } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        params.set("days", String(arg?.days ?? 7));
        if (arg?.from) params.set("from", arg.from);
        if (arg?.to) params.set("to", arg.to);
        return `/product/performance?${params.toString()}`;
      },
      transformResponse: (raw: unknown) => parseChartResult<{ label: string; value: number; date?: string }>(raw),
    }),
    // GET /product/stock-by-category (dona)
    getProductStockByCategory: builder.query<{ name: string; value: number }[], void>({
      query: () => "/product/stock-by-category",
      transformResponse: (raw: unknown) => parseChartResult<{ name: string; value: number }>(raw),
    }),

    // POST /product/image (multipart/form-data, campo "file")
    uploadProductImage: builder.mutation<string, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: "/product/image",
          method: "POST",
          body,
          formData: true,
        };
      },
      transformResponse: (raw: { result?: { imagenUrl?: string } }) =>
        raw?.result?.imagenUrl ?? "",
    }),
  }),
});

// ─── Exported hooks ───────────────────────────────────────────────────────────

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductCategoriesQuery,
  useGetProductStatsQuery,
  useGetProductPerformanceQuery,
  useGetProductStockByCategoryQuery,
  useUploadProductImageMutation,
} = productsApi;