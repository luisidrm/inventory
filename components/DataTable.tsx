"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import "./data-table.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnType = "text" | "number" | "currency" | "date" | "boolean" | "custom";

export interface DataTableColumn<T = Record<string, unknown>> {
  key: string;           // Soporta dot notation: "address.city"
  label: string;
  type?: ColumnType;     // Default: "text"
  width?: string;
  locale?: string;       // Default: "es-ES"
  currency?: string;     // Default: "USD"
  booleanLabels?: { true: string; false: string }; // Default: Activo / Inactivo
  render?: (row: T) => React.ReactNode; // Renderer custom completo
}

export interface DataTableAction<T = Record<string, unknown>> {
  icon: string;         // Material Icon name
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "danger"; // Default: "default"
  hidden?: (row: T) => boolean;
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
  // Contenido
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  // Cabecera
  title: string;
  titleIcon?: string;
  // Toolbar
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  addLabel?: string;
  addIcon?: string;
  onAdd?: () => void;
  /** Nodo extra en la toolbar (filtros, exports, etc.) */
  toolbarExtra?: React.ReactNode;
  // Acciones por fila
  actions?: DataTableAction<T>[];
  // Paginación
  pagination?: PaginationMeta;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // Empty state
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

// ─── Cell renderer ────────────────────────────────────────────────────────────

function Cell<T extends object>({
  col,
  row,
}: {
  col: DataTableColumn<T>;
  row: T;
}) {
  if (col.render) return <>{col.render(row)}</>;

  const val = getNestedValue(row as object, col.key);

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
  toolbarExtra,
  actions,
  pagination,
  pageSize = 10,
  pageSizeOptions = PAGE_SIZES_DEFAULT,
  onPageChange,
  onPageSizeChange,
  emptyIcon = "table_rows",
  emptyTitle = "Sin registros",
  emptyDesc,
}: DataTableProps<T>) {
  const hasActions = actions && actions.length > 0;
  const hasToolbar = onSearchChange || onAdd || toolbarExtra;

  const rangeStart = pagination
    ? (pagination.currentPage - 1) * pagination.pageSize + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)
    : 0;

  return (
    <div className="dt-card">
      {/* Header */}
      <div className="dt-header">
        <h1 className="dt-header__title">
          {titleIcon && <Icon name={titleIcon} />}
          {title}
        </h1>
      </div>

      {/* Toolbar */}
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
          {onAdd && addLabel && (
            <button type="button" className="dt-btn-add" onClick={onAdd}>
              <Icon name={addIcon} />
              {addLabel}
            </button>
          )}
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="dt-state">
          <div className="dt-state__spinner" />
          <span>Cargando datos...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="dt-state dt-state--empty">
          <div className="dt-state__icon-box">
            <Icon name={emptyIcon} />
          </div>
          <p className="dt-state__title">{emptyTitle}</p>
          {emptyDesc && <p className="dt-state__desc">{emptyDesc}</p>}
          {onAdd && addLabel && (
            <button type="button" className="dt-btn-add" onClick={onAdd}>
              <Icon name={addIcon} />
              {addLabel}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="dt-wrap">
            <table className="dt-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} style={{ width: col.width ?? "auto" }}>
                      {col.label}
                    </th>
                  ))}
                  {hasActions && <th className="dt-th-actions">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 1 ? "dt-row-alt" : ""}>
                    {columns.map((col) => (
                      <td key={col.key}>
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
                              className={`dt-icon-btn${action.variant === "danger" ? " dt-icon-btn--danger" : ""}`}
                              onClick={() => action.onClick(row)}
                              title={action.label}
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

          {/* Pagination */}
          {pagination && (
            <div className="dt-footer">
              <div className="dt-footer__left">
                <span>Filas por página</span>
                <select
                  className="dt-footer-select"
                  value={pageSize}
                  onChange={(e) => {
                    onPageSizeChange?.(Number(e.target.value));
                  }}
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
          )}
        </>
      )}
    </div>
  );
}