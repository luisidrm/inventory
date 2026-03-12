"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { DataTable } from "@/components/DataTable";
import { StatCard, theme } from "@/components/dashboard";
import type { DataTableColumn, DataTableAction } from "@/components/DataTable";
import {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useConfirmOrderMutation,
  useCancelOrderMutation,
  useGetOrderStatsQuery,
} from "./_service/salesApi";
import type { SaleOrderResponse } from "@/lib/dashboard-types";
import "./sales.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return `$${v.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: string; label: string }> = {
    Draft:     { cls: "sale-status--draft",     icon: "pending",       label: "Borrador" },
    Confirmed: { cls: "sale-status--confirmed", icon: "check_circle",  label: "Confirmada" },
    Cancelled: { cls: "sale-status--cancelled", icon: "cancel",        label: "Cancelada" },
  };
  const d = map[status] ?? { cls: "sale-status--draft", icon: "help", label: status };
  return (
    <span className={`sale-status ${d.cls}`}>
      <Icon name={d.icon} />
      {d.label}
    </span>
  );
}

// ─── Order detail modal ────────────────────────────────────────────────────────

function OrderDetailModal({
  orderId,
  onClose,
  onConfirm,
  onCancel,
}: {
  orderId: number;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
}) {
  const { data: order, isLoading } = useGetOrderByIdQuery(orderId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handle = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
      onClose();
    } catch {
      setErr("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-modal__header">
          <div className="order-modal__icon">
            <Icon name="receipt_long" />
          </div>
          <h2 className="order-modal__title">
            {isLoading ? "Cargando…" : `Orden ${order?.folio ?? `#${orderId}`}`}
          </h2>
          <button type="button" className="order-modal__close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Cargando detalle…
          </div>
        ) : order ? (
          <>
            <div className="order-modal__body">
              {/* Info grid */}
              <div className="order-info-grid">
                <div className="order-info-item">
                  <span className="order-info-item__label">Estado</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="order-info-item">
                  <span className="order-info-item__label">Ubicación</span>
                  <span className="order-info-item__value">{order.locationName}</span>
                </div>
                <div className="order-info-item">
                  <span className="order-info-item__label">Fecha</span>
                  <span className="order-info-item__value">{fmtDate(order.createdAt)}</span>
                </div>
                <div className="order-info-item">
                  <span className="order-info-item__label">Total</span>
                  <span className="order-info-item__value" style={{ fontWeight: 800 }}>
                    {fmt(order.total)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div>
                  <p className="order-items-title">
                    <Icon name="notes" />
                    Notas
                  </p>
                  <div className="order-notes">{order.notes}</div>
                </div>
              )}

              {/* Items table */}
              <div>
                <p className="order-items-title">
                  <Icon name="inventory_2" />
                  Productos ({order.items.length})
                </p>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="td-right">Cant.</th>
                      <th className="td-right">P. Unit.</th>
                      <th className="td-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td className="td-right">{item.quantity}</td>
                        <td className="td-right">{fmt(item.unitPrice)}</td>
                        <td className="td-right">{fmt(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="order-totals">
                <div className="order-totals__row">
                  <span>Subtotal</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="order-totals__row">
                    <span>Descuento</span>
                    <span style={{ color: "#16a34a" }}>−{fmt(order.discountAmount)}</span>
                  </div>
                )}
                <div className="order-totals__row order-totals__row--total">
                  <span>Total</span>
                  <span>{fmt(order.total)}</span>
                </div>
              </div>

              {err && (
                <p style={{ fontSize: "0.8rem", color: "#ef4444", textAlign: "center" }}>
                  {err}
                </p>
              )}
            </div>

            <div className="order-modal__footer">
              <button type="button" className="order-modal-btn order-modal-btn--ghost" onClick={onClose}>
                Cerrar
              </button>
              {order.status === "Draft" && (
                <>
                  <button
                    type="button"
                    className="order-modal-btn order-modal-btn--cancel"
                    disabled={busy}
                    onClick={() => handle(() => onCancel(order.id))}
                  >
                    <Icon name="cancel" />
                    Cancelar orden
                  </button>
                  <button
                    type="button"
                    className="order-modal-btn order-modal-btn--confirm"
                    disabled={busy}
                    onClick={() => handle(() => onConfirm(order.id))}
                  >
                    <Icon name="check_circle" />
                    Confirmar
                  </button>
                </>
              )}
              {order.status === "Confirmed" && (
                <button
                  type="button"
                  className="order-modal-btn order-modal-btn--cancel"
                  disabled={busy}
                  onClick={() => handle(() => onCancel(order.id))}
                >
                  <Icon name="cancel" />
                  Cancelar orden
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            No se pudo cargar el detalle.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: DataTableColumn<SaleOrderResponse>[] = [
  { key: "folio",        label: "Folio",     width: "110px" },
  { key: "locationName", label: "Ubicación" },
  {
    key: "status",
    label: "Estado",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: (row) => String(row.items.length),
    label: "Productos",
    type: "number",
    width: "90px",
  },
  { key: "total",     label: "Total",  type: "currency" },
  { key: "createdAt", label: "Fecha",  type: "date" },
];

const STATUS_FILTERS = [
  { label: "Todas",      value: "" },
  { label: "Borrador",   value: "Draft" },
  { label: "Confirmada", value: "Confirmed" },
  { label: "Cancelada",  value: "Cancelled" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [page, setPage]         = useState(1);
  const [pageSize]              = useState(10);
  const [statusFilter, setStatus] = useState("");
  const [searchTerm, setSearch] = useState("");
  const [allRows, setAllRows]   = useState<SaleOrderResponse[]>([]);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: result, isLoading, isFetching } = useGetOrdersQuery({
    page,
    perPage: pageSize,
    status: statusFilter,
  });
  const { data: stats } = useGetOrderStatsQuery(30);

  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();
  const [cancelOrder,  { isLoading: isCancelling }]  = useCancelOrderMutation();
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!result?.data) return;
    if ((result.pagination?.currentPage ?? 1) !== page) return;
    setAllRows((prev) => {
      if (page === 1) return result.data;
      const ids = new Set(prev.map((r) => r.id));
      return [...prev, ...result.data.filter((r) => !ids.has(r.id))];
    });
  }, [result?.data, result?.pagination?.currentPage, page]);

  // Reset on filter / search change
  useEffect(() => { setPage(1); setAllRows([]); }, [statusFilter, searchTerm]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return allRows;
    const q = searchTerm.toLowerCase();
    return allRows.filter(
      (r) =>
        r.folio.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q)
    );
  }, [allRows, searchTerm]);

  const hasMore = result?.pagination
    ? page < result.pagination.totalPages
    : false;

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const s = stats as Record<string, unknown> | null | undefined;
  const statCards = [
    {
      label: "Órdenes Totales",
      value: String(s?.totalOrders ?? result?.pagination?.totalCount ?? "—"),
      icon: "receipt_long" as const,
      trend: "",
      trendUp: true,
      iconBg: "#EEF2FF",
      iconColor: theme.accent,
    },
    {
      label: "Confirmadas",
      value: String(s?.confirmedCount ?? "—"),
      icon: "check_circle" as const,
      trend: "",
      trendUp: true,
      iconBg: "#F0FDF4",
      iconColor: theme.success,
    },
    {
      label: "Borradores",
      value: String(s?.draftCount ?? "—"),
      icon: "pending" as const,
      trend: "",
      trendUp: true,
      iconBg: "#EEF2FF",
      iconColor: "#6366f1",
    },
    {
      label: "Ingresos (30d)",
      value: s?.revenue != null ? `$${Number(s.revenue).toLocaleString("es")}` : "—",
      icon: "payments" as const,
      trend: "",
      trendUp: true,
      iconBg: "#F0FDF4",
      iconColor: theme.success,
    },
  ];

  const isBusy = isConfirming || isCancelling;

  const actions: DataTableAction<SaleOrderResponse>[] = [
    {
      icon: "visibility",
      label: "Ver detalle",
      onClick: (row) => setDetailId(row.id),
      disabled: () => isBusy,
    },
    {
      icon: processingId !== null && isConfirming ? "hourglass_empty" : "check_circle",
      label: isConfirming ? "Confirmando…" : "Confirmar",
      onClick: async (row) => {
        setProcessingId(row.id);
        try {
          await confirmOrder(row.id).unwrap();
          setPage(1);
          setAllRows([]);
        } finally {
          setProcessingId(null);
        }
      },
      hidden: (row) => row.status !== "Draft",
      disabled: (row) => isBusy && processingId !== row.id,
    },
    {
      icon: processingId !== null && isCancelling ? "hourglass_empty" : "cancel",
      label: isCancelling ? "Cancelando…" : "Cancelar",
      onClick: async (row) => {
        setProcessingId(row.id);
        try {
          await cancelOrder(row.id).unwrap();
          setPage(1);
          setAllRows([]);
        } finally {
          setProcessingId(null);
        }
      },
      variant: "danger",
      hidden: (row) => row.status === "Cancelled",
      disabled: (row) => isBusy && processingId !== row.id,
    },
  ];

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Status filter */}
      <div className="sales-filter">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`sales-filter__chip ${statusFilter === f.value ? "sales-filter__chip--active" : ""}`}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={COLUMNS}
        loading={isLoading && page === 1}
        title="Órdenes de Venta"
        titleIcon="point_of_sale"
        searchTerm={searchTerm}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por folio o ubicación…"
        actions={actions}
        infiniteScroll
        onLoadMore={() => { if (!isFetching && hasMore) setPage((p) => p + 1); }}
        hasMore={hasMore}
        loadingMore={isFetching && page > 1}
        emptyIcon="receipt_long"
        emptyTitle="Sin órdenes"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay órdenes de venta"}
      />

      {/* Detail modal */}
      {detailId !== null && (
        <OrderDetailModal
          orderId={detailId}
          onClose={() => setDetailId(null)}
          onConfirm={async (id) => {
            await confirmOrder(id).unwrap();
            setPage(1);
            setAllRows([]);
          }}
          onCancel={async (id) => {
            await cancelOrder(id).unwrap();
            setPage(1);
            setAllRows([]);
          }}
        />
      )}
    </>
  );
}
