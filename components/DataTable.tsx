"use client";

import { useRef, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import "./data-table.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnType = "text" | "number" | "currency" | "date" | "boolean" | "custom";

export interface DataTableColumn<T = Record<string, unknown>> {
  key: string | ((row: T) => string | number);
  label: string;
  type?: ColumnType;
  width?: string;
  locale?: string;
  currency?: string;
  booleanLabels?: { true: string; false: string };
  render?: (row: T) => React.ReactNode;
}

export interface DataTableAction<T = Record<string, unknown>> {
  icon: string;
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  title: string;
  titleIcon?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  addLabel?: string;
  addIcon?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
  addButtonDataTutorial?: string;
  toolbarExtra?: React.ReactNode;
  actions?: DataTableAction<T>[];
  pagination?: PaginationMeta;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDesc?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue(row: object, key: string): unknown {
  return key
    .split(".")
    .reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], row);
}

function resolveValue<T extends object>(
  row: T,
  key: string | ((row: T) => string | number)
): unknown {
  if (typeof key === "function") return key(row);
  return getNestedValue(row, key);
}

function resolveColKey<T>(col: DataTableColumn<T>, index: number): string {
  if (typeof col.key === "string") return col.key;
  return `col-${index}`;
}

function formatDate(iso: string, locale = "es-ES") {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(n: number, locale = "es-ES", currency = "USD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function getPageNumbers(current: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > total) { end = total; start = Math.max(1, end - maxVisible + 1); }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

function Cell<T extends object>({ col, row }: { col: DataTableColumn<T>; row: T }) {
  if (col.render) return <>{col.render(row)}</>;

  const val = resolveValue(row, col.key);

  switch (col.type) {
    case "boolean": {
      const labels = col.booleanLabels ?? { true: "Activo", false: "Inactivo" };
      return (
        <span className={`dt-tag ${val ? "dt-tag--green" : "dt-tag--red"}`}>
          {val ? labels.true : labels.false}
        </span>
      );
    }
    case "date":
      return <span>{formatDate(String(val ?? ""), col.locale)}</span>;
    case "currency":
      return (
        <span className="dt-cell-mono">
          {formatCurrency(Number(val ?? 0), col.locale, col.currency)}
        </span>
      );
    default:
      return (
        <span className="dt-cell-clamp">
          {val != null ? String(val) : "—"}
        </span>
      );
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZES_DEFAULT = [5, 10, 25, 50];

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  title,
  titleIcon,
  searchTerm = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  addLabel,
  addIcon = "add",
  onAdd,
  addDisabled = false,
  addButtonDataTutorial,
  toolbarExtra,
  actions,
  pagination,
  pageSize = 10,
  pageSizeOptions = PAGE_SIZES_DEFAULT,
  onPageChange,
  onPageSizeChange,
  infiniteScroll,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  emptyIcon = "table_rows",
  emptyTitle = "Sin registros",
  emptyDesc,
}: DataTableProps<T>) {
  const hasActions = actions && actions.length > 0;
  const hasToolbar = onSearchChange || addLabel || toolbarExtra;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infiniteScroll || !onLoadMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [infiniteScroll, onLoadMore, hasMore, loadingMore]);

  const rangeStart = pagination ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)
    : 0;

  return (
    <div className="dt-card">

      {/* ── Header ── */}
      <div className="dt-header">
        <h1 className="dt-header__title">
          {titleIcon && <Icon name={titleIcon} />}
          {title}
        </h1>
      </div>

      {/* ── Toolbar ── */}
      {hasToolbar && (
        <div className="dt-toolbar">
          {onSearchChange && (
            <div className="dt-toolbar__search">
              <Icon name="search" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {toolbarExtra}
          <div className="dt-toolbar__spacer" />
          {addLabel && (
            <button
              type="button"
              className="dt-btn-add"
              disabled={addDisabled}
              onClick={() => !addDisabled && onAdd?.()}
              data-tutorial={addButtonDataTutorial}
              title={addDisabled ? "Sin permiso para crear" : undefined}
            >
              <Icon name={addIcon} />
              {addLabel}
            </button>
          )}
        </div>
      )}

      {/* ── Loading (initial) ── */}
      {loading ? (
        <div className="dt-state">
          <div className="dt-state__spinner" />
          <span>Cargando datos...</span>
        </div>

      /* ── Empty ── */
      ) : data.length === 0 ? (
        <div className="dt-state dt-state--empty">
          <div className="dt-state__icon-box">
            <Icon name={emptyIcon} />
          </div>
          <p className="dt-state__title">{emptyTitle}</p>
          {emptyDesc && <p className="dt-state__desc">{emptyDesc}</p>}
          {addLabel && (
            <button
              type="button"
              className="dt-btn-add"
              disabled={addDisabled}
              onClick={() => !addDisabled && onAdd?.()}
              title={addDisabled ? "Sin permiso para crear" : undefined}
            >
              <Icon name={addIcon} />
              {addLabel}
            </button>
          )}
        </div>

      /* ── Table ── */
      ) : (
        <>
          <div className="dt-wrap">
            <table className="dt-table">
              <thead>
                <tr>
                  {columns.map((col, colIdx) => (
                    <th
                      key={resolveColKey(col, colIdx)}
                      style={{ width: col.width ?? "auto" }}
                    >
                      {col.label}
                    </th>
                  ))}
                  {hasActions && <th className="dt-th-actions">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 1 ? "dt-row-alt" : ""}>
                    {columns.map((col, colIdx) => (
                      <td key={resolveColKey(col, colIdx)}>
                        <Cell col={col} row={row} />
                      </td>
                    ))}
                    {hasActions && (
                      <td className="dt-td-actions">
                        {actions!.map((action) => {
                          if (action.hidden?.(row)) return null;
                          return (
                            <button
                              key={action.label}
                              type="button"
                              className={`dt-icon-btn${action.variant === "danger" ? " dt-icon-btn--danger" : ""}${action.disabled?.(row) ? " dt-icon-btn--disabled" : ""}`}
                              onClick={() => { if (!action.disabled?.(row)) action.onClick(row); }}
                              title={action.label}
                              disabled={action.disabled?.(row)}
                            >
                              <Icon name={action.icon} />
                            </button>
                          );
                        })}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Infinite scroll footer ── */}
          {infiniteScroll ? (
            <>
              {loadingMore && (
                <div className="dt-load-more">
                  <div className="dt-state__spinner" />
                  <span>Cargando más...</span>
                </div>
              )}
              {!hasMore && data.length > 0 && (
                <div className="dt-end-msg">— Fin de los registros —</div>
              )}
              {/* Sentinel always last so it's truly at the bottom */}
              <div ref={sentinelRef} style={{ height: "20px", width: "100%" }} />
            </>

          /* ── Traditional pagination footer ── */
          ) : pagination ? (
            <div className="dt-footer">
              <div className="dt-footer__left">
                <span>Filas por página</span>
                <select
                  className="dt-footer-select"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="dt-footer__center">
                <button
                  type="button"
                  className="dt-pg-btn"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => onPageChange?.(pagination.currentPage - 1)}
                >
                  <Icon name="chevron_left" />
                  Anterior
                </button>
                {getPageNumbers(pagination.currentPage, pagination.totalPages).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`dt-pg-num${p === pagination.currentPage ? " dt-pg-num--on" : ""}`}
                    onClick={() => onPageChange?.(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="dt-pg-btn"
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange?.(pagination.currentPage + 1)}
                >
                  Próximo
                  <Icon name="chevron_right" />
                </button>
              </div>
              <div className="dt-footer__right">
                Mostrando {rangeStart}–{rangeEnd} de {pagination.totalCount} registros
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}