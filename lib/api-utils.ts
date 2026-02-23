import type { PaginationInfo } from "./dashboard-types";

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo | null;
}

export function parsePaginated<T>(body: unknown, perPage: number): PaginatedResult<T> {
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
        if (Array.isArray(b[key])) {
          items = b[key] as T[];
          break;
        }
      }
    }
    pagination = {
      currentPage: Number(b.currentPage ?? b.CurrentPage ?? 1),
      totalPages: Number(b.totalPages ?? b.TotalPages ?? 1),
      totalCount: Number(b.totalCount ?? b.TotalCount ?? items.length),
      pageSize: Number(b.pageSize ?? b.PageSize ?? perPage),
      hasPreviousPage: Boolean(b.hasPreviousPage ?? b.HasPreviousPage ?? false),
      hasNextPage: Boolean(b.hasNextPage ?? b.HasNextPage ?? false),
    };
  }
  return { data: items, pagination };
}
