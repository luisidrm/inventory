import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl, getToken } from "@/lib/auth-api";
import type {
  ProductResponse,
  ProductCategoryResponse,
  PaginationInfo,
  CreateProductRequest,
  UpdateProductRequest,
} from "../../../../lib/dashboard-types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo | null;
}

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

// ─── Parser (same logic as before) ───────────────────────────────────────────

function parsePaginated<T>(body: unknown, perPage: number): PaginatedResult<T> {
  let items: T[] = [];
  let pagination: PaginationInfo | null = null;

  if (Array.isArray(body)) {
    items = body as T[];
  } else if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;

    if (Array.isArray(b.data)) {
      items = b.data as T[];
    } else {
      for (const key of Object.keys(b)) {
        if (Array.isArray(b[key])) { items = b[key] as T[]; break; }
      }
    }

    pagination = {
      currentPage:     Number(b.currentPage     ?? b.CurrentPage     ?? 1),
      totalPages:      Number(b.totalPages      ?? b.TotalPages      ?? 1),
      totalCount:      Number(b.totalCount      ?? b.TotalCount      ?? items.length),
      pageSize:        Number(b.pageSize        ?? b.PageSize        ?? perPage),
      hasPreviousPage: Boolean(b.hasPreviousPage ?? b.HasPreviousPage ?? false),
      hasNextPage:     Boolean(b.hasNextPage     ?? b.HasNextPage     ?? false),
    };
  }

  return { data: items, pagination };
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
      return headers;
    },
  }),

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
      transformResponse: (raw: ProductResponse | { data: ProductResponse }) =>
        "data" in raw ? raw.data : raw,
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

  }),
});

// ─── Exported hooks ───────────────────────────────────────────────────────────

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductCategoriesQuery,
} = productsApi;