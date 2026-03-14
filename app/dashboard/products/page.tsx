"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ProductResponse, CreateProductRequest, ProductTipo } from "@/lib/dashboard-types";
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
  useUploadProductImageMutation,
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
  { key: "totalStock",  label: "Stock",       type: "number" },
  { key: "isAvailable", label: "Disponible",  type: "boolean" },
  { key: "isForSale",   label: "En Venta",    type: "boolean" },
  { key: "createdAt",   label: "Creado",      type: "date" },
];

const PRODUCT_TIPO_OPTIONS: { value: ProductTipo; label: string }[] = [
  { value: "inventariable", label: "Inventariable" },
  { value: "elaborado", label: "Elaborado" },
];

const initialForm = {
  tipo: "inventariable" as ProductTipo,
  code: "",
  name: "",
  description: "",
  categoryId: "" as number | string,
  precio: "0",
  costo: "0",
  imagenUrl: "",
  isAvailable: true,
  isForSale: false,
};

// ─── Image Uploader ───────────────────────────────────────────────────────────

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploadImage, { isLoading }] = useUploadProductImageMutation();
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError("");
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Formato no soportado. Usa JPEG, PNG, GIF o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("El archivo supera el límite de 5 MB.");
      return;
    }
    try {
      const url = await uploadImage(file).unwrap();
      if (url) onChange(url);
    } catch {
      setUploadError("Error al subir la imagen. Intenta de nuevo.");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const hasImage = Boolean(value);

  return (
    <div className="img-uploader">
      <div
        className={[
          "img-uploader__dropzone",
          hasImage ? "img-uploader__dropzone--has-img" : "",
          dragOver ? "img-uploader__dropzone--dragover" : "",
        ].join(" ")}
        onClick={() => !isLoading && !hasImage && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {isLoading ? (
          <div className="img-uploader__loading">
            <div className="img-uploader__spinner" />
            <span className="img-uploader__loading-text">Subiendo imagen…</span>
          </div>
        ) : hasImage ? (
          <>
            <img src={value} alt="Preview" className="img-uploader__preview" />
            <div className="img-uploader__overlay">
              <button
                type="button"
                className="img-uploader__overlay-btn img-uploader__overlay-btn--change"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                <Icon name="upload" />
                Cambiar
              </button>
              <button
                type="button"
                className="img-uploader__overlay-btn img-uploader__overlay-btn--remove"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
              >
                <Icon name="delete" />
                Quitar
              </button>
            </div>
          </>
        ) : (
          <div className="img-uploader__placeholder">
            <div className="img-uploader__placeholder-icon">
              <Icon name="add_photo_alternate" />
            </div>
            <span className="img-uploader__placeholder-text">
              Haz clic o arrastra una imagen aquí
            </span>
            <span className="img-uploader__placeholder-hint">
              JPEG, PNG, GIF, WebP · máx. 5 MB
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="img-uploader__hidden-input"
        onChange={onInputChange}
      />

      {uploadError && (
        <span className="img-uploader__upload-error">
          <Icon name="error_outline" />
          {uploadError}
        </span>
      )}

      <button
        type="button"
        className="img-uploader__url-toggle"
        onClick={() => setShowUrlInput((v) => !v)}
      >
        <Icon name={showUrlInput ? "expand_less" : "link"} />
        {showUrlInput ? "Ocultar URL" : "O ingresa una URL"}
      </button>

      {showUrlInput && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontFamily: "inherit",
            boxSizing: "border-box",
            color: "#1e293b",
          }}
        />
      )}
    </div>
  );
}

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

  const [confirmCostHigherOpen, setConfirmCostHigherOpen] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: result, isLoading, isFetching } = useGetProductsQuery({ page, perPage: pageSize });
  const { data: categoriesResult } = useGetProductCategoriesQuery({ perPage: 100 });

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const categories = categoriesResult?.data ?? [];

  
  const loadedRows =
    page === 1 && allRows.length === 0
      ? (result?.data ?? [])
      : allRows;

  // Accumulate rows across pages
  useEffect(() => {
    if (!result?.data) return;
    const resultPage = result.pagination?.currentPage ?? 1;
    if (resultPage !== page) return;
    setAllRows((prev) => {
      if (page === 1) return result.data;
      const existingIds = new Set(prev.map((r) => r.id));
      const newItems = result.data.filter((item) => !existingIds.has(item.id));
      return [...prev, ...newItems];
    });
  }, [result?.data, result?.pagination?.currentPage, page]);

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
      tipo: item.tipo ?? "inventariable",
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      categoryId: item.categoryId ?? "",
      precio: String(item.precio),
      costo: String(item.costo),
      imagenUrl: item.imagenUrl ?? "",
      isAvailable: item.isAvailable,
      isForSale: item.isForSale ?? false,
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

  const performSubmit = async () => {
    const payload: CreateProductRequest = {
      tipo: form.tipo,
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId === "" ? null : Number(form.categoryId),
      precio: Number(form.precio),
      costo: Number(form.costo),
      imagenUrl: form.imagenUrl.trim(),
      isAvailable: form.isAvailable,
      isForSale: form.isForSale,
    };
    if (editing) {
      await updateProduct({ id: editing.id, body: payload }).unwrap();
    } else {
      await createProduct(payload).unwrap();
      setPage(1);
      setAllRows([]);
    }
    closeForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const costo = Number(form.costo);
    const precio = Number(form.precio);
    if (costo > precio) {
      setConfirmCostHigherOpen(true);
      return;
    }
    setFormSubmitting(true);
    try {
      await performSubmit();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmCostHigher = async () => {
    setConfirmCostHigherOpen(false);
    setFormSubmitting(true);
    try {
      await performSubmit();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
      setFormOpen(true);
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
        addButtonDataTutorial="tutorial-products-add"
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
        <div className="modal-field field-full">
          <label htmlFor="tipo">Tipo de producto</label>
          <select
            id="tipo"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as ProductTipo }))}
          >
            {PRODUCT_TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

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
          <label>Imagen del producto</label>
          <ImageUploader
            value={form.imagenUrl}
            onChange={(url) => setForm((f) => ({ ...f, imagenUrl: url }))}
          />
        </div>

        <div className="modal-field field-full modal-toggle">
          <Switch
            checked={form.isAvailable}
            onChange={(checked) => setForm((f) => ({ ...f, isAvailable: checked }))}
          />
          <label>Disponible</label>
        </div>

        <div className="modal-field field-full modal-toggle">
          <Switch
            checked={form.isForSale}
            onChange={(checked) => setForm((f) => ({ ...f, isForSale: checked }))}
          />
          <label>En venta (visible en catálogo público)</label>
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

      {/* ── Confirmar costo mayor que precio ── */}
      {confirmCostHigherOpen && (
        <div className="modal-overlay" onClick={() => setConfirmCostHigherOpen(false)}>
          <div className="modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon confirm-icon--warning">
              <Icon name="warning_amber" />
            </div>
            <h3 className="confirm-title">¿Estás seguro?</h3>
            <p className="confirm-msg">
              El costo es mayor que el precio de venta (por ejemplo en un remate). ¿Deseas guardar así?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn--cancel"
                onClick={() => setConfirmCostHigherOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="confirm-btn confirm-btn--primary"
                onClick={handleConfirmCostHigher}
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}