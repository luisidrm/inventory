"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { InventoryMovementResponse, CreateInventoryMovementRequest, CreateProductRequest, ProductResponse } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import { useGetMovementsQuery, useGetMovementStatsQuery, useGetFlowWithCumulativeQuery, useGetDistributionByTypeQuery, useCreateMovementMutation } from "./_service/movementsApi";
import { useGetProductsQuery, useCreateProductMutation, useGetProductCategoriesQuery, useUploadProductImageMutation } from "../products/_service/productsApi";
import { useGetLocationsQuery } from "../locations/_service/locationsApi";
import { FormModal } from "@/components/FormModal";
import { StatCard, ComposedChartCard, PieChartCard, theme } from "@/components/dashboard";
import { Icon } from "@/components/ui/Icon";
import Switch from "@/components/Switch";
import "../products/products-modal.css";
import { useUserPermissionCodes } from "@/lib/useUserPermissionCodes";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  "0": "Entrada",
  "1": "Salida",
  "2": "Ajuste",
  "3": "Transferencia",
};

const MOVEMENT_TYPES = [
  { value: 0, label: "Entrada" },
  { value: 1, label: "Salida" },
  { value: 2, label: "Ajuste" },
  { value: 3, label: "Transferencia" },
];

const INVENTORY_MOVEMENT_REASONS = [
  "Compra",
  "Devolucion",
  "Entrada",
  "Venta",
  "Daño",
  "Uso Interno",
  "Vencimiento",
  "ConteoInventario",
  "Correccion",
  "Merma",
  "Transferencia",
  "Muestra",
  "Donacion",
  "Otro",
] as const;

// ─── Image Uploader (mismo que en productos) ───────────────────────────────────

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

const initialForm = {
  productId: "" as number | string,
  locationId: "" as number | string,
  type: 0 as number,
  quantity: "0",
  reason: "",
  referenceDocument: "",
};

const initialNewProduct = {
  code: "",
  name: "",
  description: "",
  categoryId: "" as number | string,
  precio: "0",
  costo: "0",
  imagenUrl: "",
  isForSale: false,
};

export default function MovementsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [productMode, setProductMode] = useState<"existing" | "new">("existing");
  const [newProductForm, setNewProductForm] = useState(initialNewProduct);
  const isLoadingMore = useRef(false);

  const { data: result, isLoading, isFetching } = useGetMovementsQuery({ page, perPage: pageSize });
  const { data: productsResult } = useGetProductsQuery({ page: 1, perPage: 100 });
  const { data: locationsResult } = useGetLocationsQuery({ page: 1, perPage: 100 });
  const { data: categoriesResult } = useGetProductCategoriesQuery({ perPage: 100 });
  const [createMovement] = useCreateMovementMutation();
  const [createProduct] = useCreateProductMutation();

  const products = productsResult?.data ?? [];
  const locations = locationsResult?.data ?? [];
  const categories = categoriesResult?.data ?? [];
  const [allRows, setAllRows] = useState<InventoryMovementResponse[]>([]);

  // ─── Permissions ──────────────────────────────────────────────────────────

  const { has: hasPermission } = useUserPermissionCodes();
  const canCreateMovement = hasPermission("inventorymovement.create");

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
    ? allRows.filter((r) =>
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(searchTerm.toLowerCase()))
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

  const columns: DataTableColumn<InventoryMovementResponse>[] = useMemo(
    () => [
      { key: "id", label: "ID", width: "60px" },
      {
        key: "productId",
        label: "Producto",
        render: (row) => {
          if (row.productName) return row.productName;
          const p = products.find((x: ProductResponse) => x.id === row.productId);
          return p ? (p.code ? `${p.code} - ${p.name}` : p.name) : String(row.productId);
        },
      },
      {
        key: "type",
        label: "Tipo",
        render: (row) => MOVEMENT_TYPE_LABELS[String(row.type)] ?? row.type,
      },
      { key: "quantity", label: "Cantidad", type: "number" },
      { key: "previousStock", label: "Stock anterior", type: "number" },
      { key: "newStock", label: "Stock nuevo", type: "number" },
      { key: "locationName", label: "Ubicación" },
      { key: "reason", label: "Razón" },
      { key: "createdAt", label: "Fecha", type: "date" },
    ],
    [products]
  );

  const openCreate = (type: 0 | 1 = 0) => {
    setForm({ ...initialForm, type });
    setFormErrors({});
    setProductSearch("");
    setProductDropdownOpen(false);
    setProductMode("existing");
    setNewProductForm(initialNewProduct);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const validate = () => {
    const err: Record<string, string> = {};
    if (productMode === "existing") {
      if (form.productId === "" || form.productId === null) err.productId = "Producto requerido";
    } else {
      if (!newProductForm.code.trim()) err.newProductCode = "Código requerido";
      if (!newProductForm.name.trim()) err.newProductName = "Nombre requerido";
      const precio = Number(newProductForm.precio);
      const costo = Number(newProductForm.costo);
      if (Number.isNaN(precio) || precio < 0) err.newProductPrecio = "Precio inválido";
      if (Number.isNaN(costo) || costo < 0) err.newProductCosto = "Costo inválido";
    }
    if (form.locationId === "" || form.locationId === null) err.locationId = "Ubicación requerida";
    const q = Number(form.quantity);
    if (Number.isNaN(q) || q <= 0) err.quantity = "Cantidad inválida";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      let productId: number;

      if (productMode === "new") {
        // 1) Orden: primero crear producto y esperar respuesta correcta (mismo token/organización).
        const productPayload: CreateProductRequest = {
          code: newProductForm.code.trim(),
          name: newProductForm.name.trim(),
          description: newProductForm.description.trim(),
          categoryId: newProductForm.categoryId === "" ? null : Number(newProductForm.categoryId),
          precio: Number(newProductForm.precio) || 0,
          costo: Number(newProductForm.costo) || 0,
          imagenUrl: newProductForm.imagenUrl.trim(),
          isAvailable: true,
          isForSale: newProductForm.isForSale,
        };
        const createdProduct = await createProduct(productPayload).unwrap();
        // 2) productId del movimiento = id exacto devuelto por el endpoint de creación (ej. response.data.id).
        productId = Number(createdProduct.id);
        if (Number.isNaN(productId) || productId <= 0) {
          setFormErrors({ submit: "El producto se creó pero no se pudo obtener su ID. Cree el movimiento manualmente." });
          setFormSubmitting(false);
          return;
        }
      } else {
        productId = Number(form.productId);
      }

      // 3) Crear movimiento después de tener productId válido (mismo contexto/token que la creación del producto).
      const payload: CreateInventoryMovementRequest = {
        productId,
        locationId: Number(form.locationId),
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
        referenceDocument: form.referenceDocument.trim() || undefined,
      };
      await createMovement(payload).unwrap();
      setPage(1);
      closeForm();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const { data: movementStatsApi } = useGetMovementStatsQuery();
  const { data: flowCumulativeApi } = useGetFlowWithCumulativeQuery();
  const { data: typePieApi } = useGetDistributionByTypeQuery();

  const movementStats = movementStatsApi && typeof movementStatsApi === "object"
    ? [
        { label: "Total Movimientos", value: String(movementStatsApi.totalMovements ?? "1,284"), icon: "sync_alt" as const, trend: `+${movementStatsApi.totalMovementsTrend ?? 12}% vs mes ant.`, trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Entradas (Stock)", value: String(movementStatsApi.entriesCount ?? 842), icon: "add_circle_outline" as const, trend: `+${movementStatsApi.entriesTrend ?? 5}% hoy`, trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Salidas (Stock)", value: String(movementStatsApi.exitsCount ?? 442), icon: "remove_circle_outline" as const, trend: `${(movementStatsApi.exitsTrend as number ?? -2) >= 0 ? "+" : ""}${movementStatsApi.exitsTrend ?? -2}% hoy`, trendUp: (movementStatsApi.exitsTrend as number ?? 0) >= 0, iconBg: "#FEF2F2", iconColor: theme.error },
        { label: "Ajustes Manuales", value: String(movementStatsApi.adjustmentsCount ?? 12), icon: "tune" as const, trend: String(movementStatsApi.adjustmentsLabel ?? "Estable"), trendUp: true, iconBg: "#F5F3FF", iconColor: theme.accent },
      ]
    : [
        { label: "Total Movimientos", value: "1,284", icon: "sync_alt" as const, trend: "+12% vs mes ant.", trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Entradas (Stock)", value: "842", icon: "add_circle_outline" as const, trend: "+5% hoy", trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Salidas (Stock)", value: "442", icon: "remove_circle_outline" as const, trend: "-2% hoy", trendUp: false, iconBg: "#FEF2F2", iconColor: theme.error },
        { label: "Ajustes Manuales", value: "12", icon: "tune" as const, trend: "Estable", trendUp: true, iconBg: "#F5F3FF", iconColor: theme.accent },
      ];
  const flowWithCumulative = (flowCumulativeApi && flowCumulativeApi.length > 0) ? flowCumulativeApi : [
    { label: "Lun", value: 45, lineValue: 45 },
    { label: "Mar", value: 52, lineValue: 97 },
    { label: "Mié", value: 38, lineValue: 135 },
    { label: "Jue", value: 65, lineValue: 200 },
    { label: "Vie", value: 48, lineValue: 248 },
    { label: "Sáb", value: 72, lineValue: 320 },
    { label: "Dom", value: 58, lineValue: 378 },
  ];
  const typePie = (typePieApi && typePieApi.length > 0) ? typePieApi : [
    { name: "Entradas", value: 65 }, { name: "Salidas", value: 30 }, { name: "Ajustes", value: 5 },
  ];

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        String(p.code ?? "").toLowerCase().includes(term) ||
        String(p.name ?? "").toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const selectedProduct = useMemo(
    () => (form.productId ? products.find((p) => p.id === Number(form.productId)) : null),
    [products, form.productId]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const movementToolbar = canCreateMovement ? (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        className="dt-btn-add"
        onClick={() => openCreate(0)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Icon name="add_circle_outline" />
        Registrar entrada
      </button>
      <button
        type="button"
        className="dt-btn-add"
        onClick={() => openCreate(1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#FEF2F2",
          color: "#B91C1C",
        }}
      >
        <Icon name="remove_circle_outline" />
        Registrar salida
      </button>
    </div>
  ) : undefined;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {movementStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <ComposedChartCard title="Movimientos por día y acumulado" subtitle="Barras: cantidad diaria · Línea: acumulado" data={flowWithCumulative} height={220} lineName="Acumulado" />
          <PieChartCard title="Distribución por Tipo" data={typePie} height={220} />
        </div>
      </div>
      <DataTable
        data={filteredData}
        columns={columns}
        loading={isLoading && page === 1}
        title="Movimientos de inventario"
        titleIcon="swap_horiz"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        toolbarExtra={movementToolbar}
        infiniteScroll
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={isFetching && page > 1}
        emptyIcon="swap_horiz"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay movimientos"}
      />

      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={form.type === 1 ? "Registrar salida" : "Registrar entrada"}
          icon={form.type === 1 ? "remove_circle_outline" : "add_circle_outline"}
          onSubmit={handleSubmit}
          submitting={formSubmitting}
          submitLabel="Registrar"
          error={formErrors.submit}
        >
          <div className="modal-field field-full">
            <label>Producto</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setProductMode("existing")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${productMode === "existing" ? theme.accent : theme.divider}`,
                  background: productMode === "existing" ? "#EEF2FF" : theme.surface,
                  color: productMode === "existing" ? theme.accent : theme.secondaryText,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Producto existente
              </button>
              {form.type===0&&<button
                type="button"
                onClick={() => setProductMode("new")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${productMode === "new" ? theme.accent : theme.divider}`,
                  background: productMode === "new" ? "#EEF2FF" : theme.surface,
                  color: productMode === "new" ? theme.accent : theme.secondaryText,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Crear producto nuevo
              </button>}
            </div>
            {productMode === "existing" ? (
              <div ref={productDropdownRef}>
                <input
                  id="productSearch"
                  type="text"
                  autoComplete="off"
                  placeholder="Escribe para buscar por código o nombre..."
                  value={productDropdownOpen ? productSearch : (selectedProduct ? `${selectedProduct.code} - ${selectedProduct.name}` : productSearch)}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductDropdownOpen(true);
                    if (form.productId) setForm((f) => ({ ...f, productId: "" }));
                  }}
                  onFocus={() => {
                    setProductDropdownOpen(true);
                    if (selectedProduct && !productSearch) setProductSearch(`${selectedProduct.code} - ${selectedProduct.name}`);
                  }}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${theme.divider}` }}
                />
                {productDropdownOpen && (
                  <ul
                    className="modal-product-dropdown"
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      marginTop: 4,
                      maxHeight: 220,
                      overflowY: "auto",
                      border: `1px solid ${theme.divider}`,
                      borderRadius: 8,
                      background: theme.surface,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {filteredProducts.length === 0 ? (
                      <li style={{ padding: "12px 14px", color: theme.secondaryText, fontSize: 14 }}>Sin coincidencias</li>
                    ) : (
                      filteredProducts.map((p: ProductResponse) => (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={form.productId === p.id}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: 14,
                            color: theme.primaryText,
                            borderBottom: `1px solid ${theme.divider}`,
                            background: form.productId === p.id ? "#EEF2FF" : "transparent",
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setForm((f) => ({ ...f, productId: p.id }));
                            setProductSearch("");
                            setProductDropdownOpen(false);
                          }}
                        >
                          {p.code} - {p.name}
                        </li>
                      ))
                    )}
                  </ul>
                )}
                {formErrors.productId && <p className="form-error">{formErrors.productId}</p>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="modal-field">
                  <label htmlFor="newProductCode">Código *</label>
                  <input
                    id="newProductCode"
                    value={newProductForm.code}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="Código del producto"
                  />
                  {formErrors.newProductCode && <p className="form-error">{formErrors.newProductCode}</p>}
                </div>
                <div className="modal-field">
                  <label htmlFor="newProductName">Nombre *</label>
                  <input
                    id="newProductName"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre del producto"
                  />
                  {formErrors.newProductName && <p className="form-error">{formErrors.newProductName}</p>}
                </div>
                <div className="modal-field field-full">
                  <label htmlFor="newProductDescription">Descripción</label>
                  <textarea
                    id="newProductDescription"
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción (opcional)"
                    rows={2}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="newProductCategoryId">Categoría</label>
                  <select
                    id="newProductCategoryId"
                    value={newProductForm.categoryId}
                    onChange={(e) =>
                      setNewProductForm((f) => ({
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
                  <label htmlFor="newProductPrecio">Precio *</label>
                  <input
                    id="newProductPrecio"
                    type="number"
                    min={0}
                    step="0.01"
                    value={newProductForm.precio}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, precio: e.target.value }))}
                    placeholder="0.00"
                  />
                  {formErrors.newProductPrecio && <p className="form-error">{formErrors.newProductPrecio}</p>}
                </div>
                <div className="modal-field">
                  <label htmlFor="newProductCosto">Costo *</label>
                  <input
                    id="newProductCosto"
                    type="number"
                    min={0}
                    step="0.01"
                    value={newProductForm.costo}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, costo: e.target.value }))}
                    placeholder="0.00"
                  />
                  {formErrors.newProductCosto && <p className="form-error">{formErrors.newProductCosto}</p>}
                </div>
                <div className="modal-field field-full">
                  <label>Imagen del producto</label>
                  <ImageUploader
                    value={newProductForm.imagenUrl}
                    onChange={(url: string) => setNewProductForm((f) => ({ ...f, imagenUrl: url }))}
                  />
                </div>
                <div className="modal-field field-full modal-toggle">
                  <Switch
                    checked={newProductForm.isForSale}
                    onChange={(checked) => setNewProductForm((f) => ({ ...f, isForSale: checked }))}
                  />
                  <label>En venta (visible en catálogo público)</label>
                </div>
              </div>
            )}
          </div>
          <div className="modal-field">
            <label htmlFor="locationId">Ubicación *</label>
            <select
              id="locationId"
              value={form.locationId}
              onChange={(e) =>
                setForm((f) => ({ ...f, locationId: e.target.value === "" ? "" : Number(e.target.value) }))
              }
            >
              <option value="">Seleccionar</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
            {formErrors.locationId && <p className="form-error">{formErrors.locationId}</p>}
          </div>
          <div className="modal-field">
            <label htmlFor="type">Tipo *</label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: Number(e.target.value) }))}
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label htmlFor="quantity">Cantidad *</label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            {formErrors.quantity && <p className="form-error">{formErrors.quantity}</p>}
          </div>
          <div className="modal-field field-full">
            <label htmlFor="reason">Razón</label>
            <select
              id="reason"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            >
              <option value="">Seleccione razón</option>
              {INVENTORY_MOVEMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field field-full">
            <label htmlFor="referenceDocument">Documento de referencia</label>
            <input
              id="referenceDocument"
              value={form.referenceDocument}
              onChange={(e) => setForm((f) => ({ ...f, referenceDocument: e.target.value }))}
            />
          </div>
          {formErrors.submit && (
            <p className="form-error" style={{ marginTop: 12 }}>
              {formErrors.submit}
            </p>
          )}
        </FormModal>
      )}
    </>
  );
}
