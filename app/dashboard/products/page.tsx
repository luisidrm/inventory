"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ProductResponse, CreateProductRequest } from "@/lib/dashboard-types";
import "./products-modal.css";
import { DataTable } from "@/components/DataTable";
import { StatCard, BarChartCard, PieChartCard, theme } from "@/components/dashboard";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetProductsQuery,
  useGetProductCategoriesQuery,
  useGetProductStatsQuery,
  useGetProductPerformanceQuery,
  useGetProductStockByCategoryQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "./_service/productsApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import Switch from "@/components/Switch";

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: DataTableColumn<ProductResponse>[] = [
  { key: "code",        label: "Código",      width: "100px" },
  { key: "name",        label: "Nombre" },
  { key: "description", label: "Descripción" },
  { key: "precio",      label: "Precio",      type: "currency" },
  { key: "costo",       label: "Costo",       type: "currency" },
  { key: "totalStock", label: "totalStock" , type: "number" },
  { key: "isAvailable", label: "Estado",      type: "boolean" },
  { key: "createdAt",   label: "Creado",      type: "date" },
];

const initialForm = {
  code: "",
  name: "",
  description: "",
  categoryId: "" as number | string,
  precio: "0",
  costo: "0",
  imagenUrl: "",
  isAvailable: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [allRows, setAllRows] = useState<ProductResponse[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProductResponse | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: result, isLoading, isFetching } = useGetProductsQuery({ page, perPage: pageSize });
  const { data: categoriesResult } = useGetProductCategoriesQuery({ perPage: 100 });

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const categories = categoriesResult?.data ?? [];

  // Fuente de datos: al volver a la vista, usar result.data de la caché si allRows está vacío (evita tabla vacía sin refrescar)
  const loadedRows =
    page === 1 && allRows.length === 0
      ? (result?.data ?? [])
      : allRows;

  // Accumulate rows across pages
  useEffect(() => {
    if (!result?.data) return;
    setAllRows((prev) =>
      page === 1 ? result.data : [...prev, ...result.data]
    );
  }, [result?.data, page]);

  // Reset on search change
  useEffect(() => {
    setPage(1);
    setAllRows([]);
  }, [searchTerm]);

  const filteredData = searchTerm.trim()
    ? loadedRows.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : loadedRows;

  const hasMore = result?.pagination
    ? page < result.pagination.totalPages
    : false;

  const handleLoadMore = () => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  };

  // ─── Form handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: ProductResponse) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      categoryId: item.categoryId ?? "",
      precio: String(item.precio),
      costo: String(item.costo),
      imagenUrl: item.imagenUrl ?? "",
      isAvailable: item.isAvailable,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!form.code.trim()) err.code = "El código es requerido";
    if (!form.name.trim()) err.name = "El nombre es requerido";
    const precio = Number(form.precio);
    const costo = Number(form.costo);
    if (Number.isNaN(precio) || precio < 0) err.precio = "Precio inválido";
    if (Number.isNaN(costo)  || costo  < 0) err.costo  = "Costo inválido";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      const payload: CreateProductRequest = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId === "" ? null : Number(form.categoryId),
        precio: Number(form.precio),
        costo: Number(form.costo),
        imagenUrl: form.imagenUrl.trim(),
        isAvailable: form.isAvailable,
      };
      if (editing) {
        await updateProduct({ id: editing.id, body: payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
        // Reset to first page so new item appears
        setPage(1);
        setAllRows([]);
      }
      closeForm();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Delete handlers ───────────────────────────────────────────────────────

  const openDelete = (item: ProductResponse) => {
    setDeleting(item);
    setDeleteError("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setDeleting(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct(deleting.id).unwrap();
      // Remove deleted item from local rows immediately
      setAllRows((prev) => prev.filter((r) => r.id !== deleting.id));
      closeConfirm();
    } catch {
      setDeleteError("Error al eliminar. Intenta de nuevo.");
    }
  };

  // ─── Estadísticas desde API (fallback estático) ─────────────────────────────
  const { data: productStatsApi } = useGetProductStatsQuery();
  const { data: performanceApi } = useGetProductPerformanceQuery();
  const { data: stockByCategoryApi } = useGetProductStockByCategoryQuery();

  const productStats = productStatsApi && typeof productStatsApi === "object"
    ? [
        { label: "Total Productos", value: String((productStatsApi as Record<string, unknown>).totalProducts ?? "1,284"), icon: "inventory_2" as const, trend: `+${(productStatsApi as Record<string, unknown>).totalProductsTrend ?? 12}% vs mes pasado`, trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Valor Inventario", value: (productStatsApi as Record<string, unknown>).inventoryValue != null ? `$${Number((productStatsApi as Record<string, unknown>).inventoryValue).toLocaleString("es")}` : "$45,200", icon: "payment" as const, trend: `+${(productStatsApi as Record<string, unknown>).inventoryValueTrend ?? 4}% vs mes pasado`, trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Stock Crítico", value: String((productStatsApi as Record<string, unknown>).criticalStockCount ?? "18"), icon: "warning" as const, trend: "↓2% vs mes pasado", trendUp: false, iconBg: "#FEF2F2", iconColor: theme.error },
        { label: "Movimientos Hoy", value: String((productStatsApi as Record<string, unknown>).movementsToday ?? "142"), icon: "swap_horiz" as const, trend: `+${(productStatsApi as Record<string, unknown>).movementsTodayTrend ?? 8}% vs mes pasado`, trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
      ]
    : [
        { label: "Total Productos", value: "1,284", icon: "inventory_2" as const, trend: "+12% vs mes pasado", trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Valor Inventario", value: "$45,200", icon: "payment" as const, trend: "+4% vs mes pasado", trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Stock Crítico", value: "18", icon: "warning" as const, trend: "↓2% vs mes pasado", trendUp: false, iconBg: "#FEF2F2", iconColor: theme.error },
        { label: "Movimientos Hoy", value: "142", icon: "swap_horiz" as const, trend: "+8% vs mes pasado", trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
      ];
  const performanceData = (performanceApi && performanceApi.length > 0) ? performanceApi : [
    { label: "Lun", value: 45 }, { label: "Mar", value: 52 }, { label: "Mié", value: 38 }, { label: "Jue", value: 65 }, { label: "Vie", value: 48 }, { label: "Sáb", value: 80 }, { label: "Dom", value: 72 },
  ];
  const stockByCategory = (stockByCategoryApi && stockByCategoryApi.length > 0) ? stockByCategoryApi : [
    { name: "Higiene", value: 40 }, { name: "Alimentos", value: 25 }, { name: "Limpieza", value: 20 }, { name: "Otros", value: 15 },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {productStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <BarChartCard title="Rendimiento de Inventario" subtitle="Unidades por día" data={performanceData} height={300} />
          <PieChartCard title="Stock por Categoría" data={stockByCategory} height={300} />
        </div>
      </div>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading && page === 1}
        title="Productos"
        titleIcon="inventory_2"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nuevo Producto"
        onAdd={openCreate}
        actions={[
          { icon: "edit",           label: "Editar",   onClick: openEdit },
          { icon: "delete_outline", label: "Eliminar", onClick: openDelete, variant: "danger" },
        ]}
        infiniteScroll
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={isFetching && page > 1}
        emptyIcon="inventory_2"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay productos"}
      />

      {/* ── Form modal ── */}
      <FormModal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Editar Producto" : "Nuevo Producto"}
        icon={editing ? "edit" : "inventory_2"}
        onSubmit={handleSubmit}
        submitting={formSubmitting}
        submitLabel={editing ? "Guardar" : "Crear"}
        error={formErrors.submit}
      >
        <div className="modal-field">
          <label htmlFor="code">Código *</label>
          <input
            id="code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Código"
          />
          {formErrors.code && <p className="form-error">{formErrors.code}</p>}
        </div>

        <div className="modal-field">
          <label htmlFor="name">Nombre *</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nombre"
          />
          {formErrors.name && <p className="form-error">{formErrors.name}</p>}
        </div>

        <div className="modal-field field-full">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descripción"
            rows={3}
          />
        </div>

        <div className="modal-field">
          <label htmlFor="categoryId">Categoría</label>
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                categoryId: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="modal-field">
          <label htmlFor="precio">Precio *</label>
          <input
            id="precio"
            type="number"
            step="0.01"
            min="0"
            value={form.precio}
            onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
          />
          {formErrors.precio && <p className="form-error">{formErrors.precio}</p>}
        </div>

        <div className="modal-field">
          <label htmlFor="costo">Costo *</label>
          <input
            id="costo"
            type="number"
            step="0.01"
            min="0"
            value={form.costo}
            onChange={(e) => setForm((f) => ({ ...f, costo: e.target.value }))}
          />
          {formErrors.costo && <p className="form-error">{formErrors.costo}</p>}
        </div>

        <div className="modal-field field-full">
          <label htmlFor="imagenUrl">URL de imagen</label>
          <input
            id="imagenUrl"
            type="url"
            value={form.imagenUrl}
            onChange={(e) => setForm((f) => ({ ...f, imagenUrl: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div className="modal-field field-full modal-toggle">
          <Switch
            checked={form.isAvailable}
            onChange={(checked) => setForm((f) => ({ ...f, isAvailable: checked }))}
          />
          <label htmlFor="isAvailable">Disponible</label>
        </div>
      </FormModal>

      {/* ── Delete modal ── */}
      <DeleteModal
        open={confirmOpen && !!deleting}
        onClose={closeConfirm}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        itemName={deleting?.name}
        error={deleteError}
      />
    </>
  );
}