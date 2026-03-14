"use client";

import { useState, useRef, useEffect } from "react";
import type { InventoryResponse } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetInventoriesQuery,
  useGetInventoryStatsQuery,
  useGetInventoryFlowQuery,
  useGetStockByLocationQuery,
} from "./_service/inventoryApi";
import { StatCard, LineChartCard, BarChartCard, theme } from "@/components/dashboard";

const COLUMNS: DataTableColumn<InventoryResponse>[] = [
  { key: "productName", label: "Producto", width: "180px" },
  { key: "currentStock", label: "Stock actual", type: "number" },
  { key: "unitOfMeasure", label: "Unidad" },
  { key: "locationName", label: "Ubicación", width: "180px" },
  { key: "createdAt", label: "Creado", type: "date" },
];

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const isLoadingMore = useRef(false);

  const { data: result, isLoading, isFetching } = useGetInventoriesQuery({ page, perPage: pageSize });
  const [allRows, setAllRows] = useState<InventoryResponse[]>([]);

  useEffect(() => {
    if (!result?.data) return;
    setAllRows((prev) => {
      if (page === 1) return result.data;
      const existingIds = new Set(prev.map((r) => r.id));
      const fresh = result.data.filter((r) => !existingIds.has(r.id));
      return [...prev, ...fresh];
    });
  }, [result?.data, page]);

  useEffect(() => {
    if (!isFetching) {
      isLoadingMore.current = false;
    }
  }, [isFetching]);

  useEffect(() => {
    setPage(1);
    setAllRows([]);
  }, [searchTerm]);

  const filteredData = searchTerm.trim()
    ? allRows.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : allRows;

  const hasMore = result?.pagination
    ? page < result.pagination.totalPages
    : false;

  const handleLoadMore = () => {
    if (isLoadingMore.current || !hasMore) return;
    isLoadingMore.current = true;
    setPage((p) => p + 1);
  };

  const { data: inventoryStatsApi } = useGetInventoryStatsQuery();
  const { data: flowApi } = useGetInventoryFlowQuery();
  const { data: stockByLocationApi } = useGetStockByLocationQuery();

  const inventoryStats = inventoryStatsApi && typeof inventoryStatsApi === "object"
    ? [
        { label: "Valor Total", value: typeof inventoryStatsApi.totalValue === "number" ? `$${inventoryStatsApi.totalValue.toLocaleString("es")}` : "$45,280.00", icon: "payment" as const, trend: `+${inventoryStatsApi.totalValueTrend ?? 12}% vs mes pasado`, trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Stock Bajo", value: String(inventoryStatsApi.lowStockCount ?? 12), icon: "warning" as const, trend: `${inventoryStatsApi.lowStockNewToday ?? 3} nuevos hoy`, trendUp: true, iconBg: "#FEF2F2", iconColor: theme.error },
        { label: "Movimientos", value: String(inventoryStatsApi.movementsCount ?? 142), icon: "swap_vert" as const, trend: `${(inventoryStatsApi.movementsTrend as number ?? -5) >= 0 ? "+" : ""}${inventoryStatsApi.movementsTrend ?? -5}% vs ayer`, trendUp: (inventoryStatsApi.movementsTrend as number ?? 0) >= 0, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Productos", value: String(inventoryStatsApi.productsCount ?? 854), icon: "inventory" as const, trend: `+${inventoryStatsApi.productsNewCount ?? 8} nuevos`, trendUp: true, iconBg: "#F1F5F9", iconColor: theme.primary },
      ]
    : [
        { label: "Valor Total", value: "$45,280.00", icon: "payment" as const, trend: "+12% vs mes pasado", trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Stock Bajo", value: "12", icon: "warning" as const, trend: "3 nuevos hoy", trendUp: true, iconBg: "#FEF2F2", iconColor: theme.error },
        { label: "Movimientos", value: "142", icon: "swap_vert" as const, trend: "-5% vs ayer", trendUp: false, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Productos", value: "854", icon: "inventory" as const, trend: "+8 nuevos", trendUp: true, iconBg: "#F1F5F9", iconColor: theme.primary },
      ];
  const flowData = (flowApi && flowApi.length > 0) ? flowApi : [
    { label: "Lun", value: 45 }, { label: "Mar", value: 52 }, { label: "Mié", value: 48 }, { label: "Jue", value: 70 }, { label: "Vie", value: 65 }, { label: "Sáb", value: 85 }, { label: "Dom", value: 92 },
  ];
  const stockByLocation = (stockByLocationApi && stockByLocationApi.length > 0) ? stockByLocationApi : [
    { label: "Almacén A", value: 420 }, { label: "Almacén B", value: 280 }, { label: "Sucursal Centro", value: 195 }, { label: "Sucursal Norte", value: 120 }, { label: "Showroom", value: 85 },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {inventoryStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <LineChartCard title="Flujo de Inventario (7 días)" data={flowData} height={340} />
          <BarChartCard title="Stock por Ubicación" subtitle="Unidades por ubicación" data={stockByLocation} height={340} />
        </div>
      </div>
      <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: 8, marginTop: 0 }}>
        Vista informativa del stock por producto y ubicación. Para registrar entradas o salidas, usa la sección <strong>Movimientos</strong>.
      </p>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading && page === 1}
        title="Inventario"
        titleIcon="inventory"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        emptyIcon="inventory"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Stock por producto y ubicación. Las entradas y salidas se registran en Movimientos."}
        infiniteScroll
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={isFetching && page > 1}
      />
    </>
  );
}
