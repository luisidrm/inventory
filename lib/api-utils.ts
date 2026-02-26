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

/** Extrae datos de gráficos/listas de la respuesta API { statusCode, result }. result o result.data puede ser el array. */
export function parseChartResult<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const obj = raw as Record<string, unknown> | null;
  if (!obj) return [];
  const result = obj.result ?? obj.data ?? obj;
  if (Array.isArray(result)) return result as T[];
  const r = result as Record<string, unknown> | null;
  if (r && Array.isArray(r.data)) return r.data as T[];
  if (r && Array.isArray(r.Data)) return r.Data as T[];
  return [];
}

/** Extrae objeto de resumen/KPIs de la respuesta API { statusCode, result }. */
export function parseSummaryResult<T>(raw: unknown): T | null {
  const obj = raw as Record<string, unknown> | null;
  if (!obj) return null;
  const result = obj.result ?? obj.data ?? obj;
  if (result && typeof result === "object" && !Array.isArray(result)) return result as T;
  return null;
}
