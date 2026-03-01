"use client";

import { useState, useRef, useEffect } from "react";
import type { ProductCategoryResponse } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetCategoriesQuery,
  useGetCategoryStatsQuery,
  useGetItemDistributionQuery,
  useGetStorageUsageQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "./_service/categoriesApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import { StatCard, BarChartCard, PieChartCard, theme } from "@/components/dashboard";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<ProductCategoryResponse>[] = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripción" },
  {
    key: "color",
    label: "Color",
    render: (row) => {
      const color = row.color ?? "#6366f1";
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: color,
              border: "1px solid rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
            title={color}
          />
        </span>
      );
    },
  },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm = { name: "", description: "", color: "#6366f1" };

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategoryResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProductCategoryResponse | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const isLoadingMore = useRef(false);

  const { data: result, isLoading, isFetching } = useGetCategoriesQuery({ page, perPage: pageSize });
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [allRows, setAllRows] = useState<ProductCategoryResponse[]>([]);

  // Acumular resultados de páginas (infinite scroll) con deduplicación por id
  useEffect(() => {
    if (!result?.data) return;
    setAllRows((prev) => {
      if (page === 1) return result.data;
      const existingIds = new Set(prev.map((r) => r.id));
      const fresh = result.data.filter((r) => !existingIds.has(r.id));
      return [...prev, ...fresh];
    });
  }, [result?.data, page]);

  // Reset guard cuando termina el fetch
  useEffect(() => {
    if (!isFetching) {
      isLoadingMore.current = false;
    }
  }, [isFetching]);

  // Reset al cambiar búsqueda
  useEffect(() => {
    setPage(1);
    setAllRows([]);
  }, [searchTerm]);

  const filteredData = searchTerm.trim()
    ? allRows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(searchTerm.toLowerCase())
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

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: ProductCategoryResponse) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      color: item.color ?? "#6366f1",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = "El nombre es requerido";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      if (editing) {
        await updateCategory({
          id: editing.id,
          body: {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            color: form.color,
          },
        }).unwrap();
      } else {
        await createCategory({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          color: form.color,
        }).unwrap();
        setPage(1);
      }
      closeForm();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDelete = (item: ProductCategoryResponse) => {
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
      await deleteCategory(deleting.id).unwrap();
      closeConfirm();
    } catch {
      setDeleteError("Error al eliminar. Intenta de nuevo.");
    }
  };

  const { data: categoryStatsApi } = useGetCategoryStatsQuery();
  const { data: distributionApi } = useGetItemDistributionQuery();
  const { data: storageApi } = useGetStorageUsageQuery();

  const categoryStats = categoryStatsApi && typeof categoryStatsApi === "object"
    ? [
        { label: "Total Categorías", value: String((categoryStatsApi as Record<string, unknown>).totalCategories ?? "24"), icon: "category" as const, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Más Activa", value: String((categoryStatsApi as Record<string, unknown>).mostActiveCategoryName ?? "Comida"), icon: "trending_up" as const, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Última Edición", value: String((categoryStatsApi as Record<string, unknown>).lastEditedAgo ?? "2h"), icon: "schedule" as const, iconBg: "#FFFBEB", iconColor: "#F59E0B" },
        { label: "Items Totales", value: String((categoryStatsApi as Record<string, unknown>).totalItems ?? "1,240"), icon: "bar_chart" as const, iconBg: "#ECFEFF", iconColor: "#06B6D4" },
      ]
    : [
        { label: "Total Categorías", value: "24", icon: "category" as const, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Más Activa", value: "Comida", icon: "trending_up" as const, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Última Edición", value: "2h ago", icon: "schedule" as const, iconBg: "#FFFBEB", iconColor: "#F59E0B" },
        { label: "Items Totales", value: "1,240", icon: "bar_chart" as const, iconBg: "#ECFEFF", iconColor: "#06B6D4" },
      ];
  const distributionData = (distributionApi && distributionApi.length > 0) ? distributionApi : [
    { label: "Liq", value: 45 }, { label: "Sol", value: 32 }, { label: "Tec", value: 67 }, { label: "Ase", value: 23 }, { label: "Com", value: 89 }, { label: "Per", value: 12 }, { label: "Mis", value: 54 },
  ];
  const storagePie = (storageApi && storageApi.length > 0) ? storageApi : [
    { name: "Comida", value: 40 }, { name: "Tecno", value: 25 }, { name: "Aseo", value: 20 }, { name: "Otros", value: 15 },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {categoryStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <BarChartCard title="Distribución de Items" subtitle="Por categoría" data={distributionData} height={300} horizontal />
          <PieChartCard title="Uso de Almacenamiento" data={storagePie} height={300} />
        </div>
      </div>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading && page === 1}
        title="Categorías"
        titleIcon="category"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nueva categoría"
        onAdd={openCreate}
        actions={[
          { icon: "edit", label: "Editar", onClick: openEdit },
          { icon: "delete_outline", label: "Eliminar", onClick: openDelete, variant: "danger" },
        ]}
        infiniteScroll
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={isFetching && page > 1}
        emptyIcon="category"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay categorías"}
      />
      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={editing ? "Editar categoría" : "Nueva categoría"}
          onSubmit={handleSubmit}
          submitting={formSubmitting}
          submitLabel={editing ? "Guardar" : "Crear"}
          error={formErrors.submit}
        >
          <div className="modal-field field-full">
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
            <label htmlFor="color">Color</label>
            <input
              id="color"
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            />
          </div>
          {formErrors.submit && (
            <p className="form-error" style={{ marginTop: 12 }}>
              {formErrors.submit}
            </p>
          )}
        </FormModal>
      )}
      {confirmOpen && deleting && (
        <DeleteModal
          open={confirmOpen && !!deleting}
          onClose={closeConfirm}
          onConfirm={handleDelete}
          title="¿Eliminar categoría?"
          itemName={deleting?.name}
          error={deleteError}
        />
      )}
    </>
  );
}
