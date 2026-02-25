"use client";

import { useState } from "react";
import type { InventoryMovementResponse, CreateInventoryMovementRequest } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import { useGetMovementsQuery, useCreateMovementMutation } from "./_service/movementsApi";
import { useGetProductsQuery } from "../products/_service/productsApi";
import { useGetLocationsQuery } from "../locations/_service/locationsApi";
import { FormModal } from "@/components/FormModal";
import { StatCard, ComposedChartCard, PieChartCard, theme } from "@/components/dashboard";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<InventoryMovementResponse>[] = [
  { key: "id", label: "ID", width: "60px" },
  { key: "productId", label: "Producto ID" },
  { key: "type", label: "Tipo" },
  { key: "quantity", label: "Cantidad", type: "number" },
  { key: "previousStock", label: "Stock anterior", type: "number" },
  { key: "newStock", label: "Stock nuevo", type: "number" },
  { key: "locationName", label: "Ubicación" },
  { key: "reason", label: "Razón" },
  { key: "createdAt", label: "Fecha", type: "date" },
];

const MOVEMENT_TYPES = [
  { value: 0, label: "Entrada" },
  { value: 1, label: "Salida" },
  { value: 2, label: "Ajuste" },
  { value: 3, label: "Transferencia" },
];

const initialForm = {
  productId: "" as number | string,
  locationId: "" as number | string,
  type: 0 as number,
  quantity: "0",
  unitCost: "",
  unitPrice: "",
  reason: "",
  referenceDocument: "",
};

export default function MovementsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: result, isLoading } = useGetMovementsQuery({ page, perPage: pageSize });
  const { data: productsResult } = useGetProductsQuery({ page: 1, perPage: 100 });
  const { data: locationsResult } = useGetLocationsQuery({ page: 1, perPage: 100 });
  const [createMovement] = useCreateMovementMutation();

  const products = productsResult?.data ?? [];
  const locations = locationsResult?.data ?? [];
  const allRows = result?.data ?? [];
  const filteredData = searchTerm.trim()
    ? allRows.filter((r) =>
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : allRows;

  const openCreate = () => {
    setForm(initialForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const validate = () => {
    const err: Record<string, string> = {};
    if (form.productId === "" || form.productId === null) err.productId = "Producto requerido";
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
      const payload: CreateInventoryMovementRequest = {
        productId: Number(form.productId),
        locationId: Number(form.locationId),
        type: form.type,
        quantity: Number(form.quantity),
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        reason: form.reason.trim() || undefined,
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

  const movementStats = [
    { label: "Total Movimientos", value: "1,284", icon: "sync_alt", trend: "+12% vs mes ant.", trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
    { label: "Entradas (Stock)", value: "842", icon: "add_circle_outline", trend: "+5% hoy", trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
    { label: "Salidas (Stock)", value: "442", icon: "remove_circle_outline", trend: "-2% hoy", trendUp: false, iconBg: "#FEF2F2", iconColor: theme.error },
    { label: "Ajustes Manuales", value: "12", icon: "tune", trend: "Estable", trendUp: true, iconBg: "#F5F3FF", iconColor: theme.accent },
  ];
  const flowWithCumulative = [
    { label: "Lun", value: 45, lineValue: 45 },
    { label: "Mar", value: 52, lineValue: 97 },
    { label: "Mié", value: 38, lineValue: 135 },
    { label: "Jue", value: 65, lineValue: 200 },
    { label: "Vie", value: 48, lineValue: 248 },
    { label: "Sáb", value: 72, lineValue: 320 },
    { label: "Dom", value: 58, lineValue: 378 },
  ];
  const typePie = [
    { name: "Entradas", value: 65 }, { name: "Salidas", value: 30 }, { name: "Ajustes", value: 5 },
  ];

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
        columns={COLUMNS}
        loading={isLoading}
        title="Movimientos de inventario"
        titleIcon="swap_horiz"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nuevo movimiento"
        onAdd={openCreate}
        pagination={result?.pagination ?? undefined}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        emptyIcon="swap_horiz"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay movimientos"}
      />

      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title="Nuevo movimiento"
          icon="swap_horiz"
          onSubmit={handleSubmit}
          submitting={formSubmitting}
          submitLabel="Registrar"
          error={formErrors.submit}
        >
          <div className="modal-field field-full">
            <label htmlFor="productId">Producto *</label>
            <select
              id="productId"
              value={form.productId}
              onChange={(e) =>
                setForm((f) => ({ ...f, productId: e.target.value === "" ? "" : Number(e.target.value) }))
              }
            >
              <option value="">Seleccionar</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
            {formErrors.productId && <p className="form-error">{formErrors.productId}</p>}
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
          <div className="modal-field">
            <label htmlFor="unitCost">Costo unitario</label>
            <input
              id="unitCost"
              type="number"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="unitPrice">Precio unitario</label>
            <input
              id="unitPrice"
              type="number"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            />
          </div>
          <div className="modal-field field-full">
            <label htmlFor="reason">Razón</label>
            <textarea
              id="reason"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={2}
            />
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
