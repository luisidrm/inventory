"use client";

import { useState } from "react";
import type { InventoryResponse, CreateInventoryRequest } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetInventoriesQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} from "./_service/inventoryApi";
import { useGetProductsQuery } from "../products/_service/productsApi";
import { useGetLocationsQuery } from "../locations/_service/locationsApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<InventoryResponse>[] = [
  { key: "productId", label: "Producto ID", width: "100px" },
  { key: "currentStock", label: "Stock actual", type: "number" },
  { key: "minimumStock", label: "Stock mínimo", type: "number" },
  { key: "unitOfMeasure", label: "Unidad" },
  { key: "locationId", label: "Ubicación ID", width: "100px" },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm = {
  productId: "" as number | string,
  locationId: "" as number | string,
  currentStock: "0",
  minimumStock: "0",
  unitOfMeasure: "unit",
};

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<InventoryResponse | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data: result, isLoading } = useGetInventoriesQuery({ page, perPage: pageSize });
  const { data: productsResult } = useGetProductsQuery({ page: 1, perPage: 100 });
  const { data: locationsResult } = useGetLocationsQuery({ page: 1, perPage: 100 });

  const [createInventory] = useCreateInventoryMutation();
  const [updateInventory] = useUpdateInventoryMutation();
  const [deleteInventory] = useDeleteInventoryMutation();

  const products = productsResult?.data ?? [];
  const locations = locationsResult?.data ?? [];
  const allRows = result?.data ?? [];
  const filteredData = searchTerm.trim()
    ? allRows.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : allRows;

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: InventoryResponse) => {
    setEditing(item);
    setForm({
      productId: item.productId,
      locationId: item.locationId,
      currentStock: String(item.currentStock),
      minimumStock: String(item.minimumStock),
      unitOfMeasure: item.unitOfMeasure ?? "unit",
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
    if (form.productId === "" || form.productId === null) err.productId = "Producto requerido";
    if (form.locationId === "" || form.locationId === null) err.locationId = "Ubicación requerida";
    const current = Number(form.currentStock);
    const minimum = Number(form.minimumStock);
    if (Number.isNaN(current) || current < 0) err.currentStock = "Stock inválido";
    if (Number.isNaN(minimum) || minimum < 0) err.minimumStock = "Stock mínimo inválido";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      const payload: CreateInventoryRequest = {
        productId: Number(form.productId),
        locationId: Number(form.locationId),
        currentStock: Number(form.currentStock),
        minimumStock: Number(form.minimumStock),
        unitOfMeasure: form.unitOfMeasure.trim() || undefined,
      };
      if (editing) {
        await updateInventory({ id: editing.id, body: payload }).unwrap();
      } else {
        await createInventory(payload).unwrap();
        setPage(1);
      }
      closeForm();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDelete = (item: InventoryResponse) => {
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
      await deleteInventory(deleting.id).unwrap();
      closeConfirm();
    } catch {
      setDeleteError("Error al eliminar. Intenta de nuevo.");
    }
  };

  return (
    <>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading}
        title="Inventario"
        titleIcon="inventory"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nuevo inventario"
        onAdd={openCreate}
        actions={[
          { icon: "edit", label: "Editar", onClick: openEdit },
          { icon: "delete_outline", label: "Eliminar", onClick: openDelete, variant: "danger" },
        ]}
        pagination={result?.pagination ?? undefined}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        emptyIcon="inventory"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay inventario"}
      />

      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={editing ? "Editar inventario" : "Nuevo inventario"}
          icon={editing ? "edit" : "inventory"}
          onSubmit={handleSubmit}
          submitting={formSubmitting}
          submitLabel={editing ? "Guardar" : "Crear"}
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
            <label htmlFor="currentStock">Stock actual *</label>
            <input
              id="currentStock"
              type="number"
              min={0}
              value={form.currentStock}
              onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))}
            />
            {formErrors.currentStock && <p className="form-error">{formErrors.currentStock}</p>}
          </div>
          <div className="modal-field">
            <label htmlFor="minimumStock">Stock mínimo *</label>
            <input
              id="minimumStock"
              type="number"
              min={0}
              value={form.minimumStock}
              onChange={(e) => setForm((f) => ({ ...f, minimumStock: e.target.value }))}
            />
            {formErrors.minimumStock && <p className="form-error">{formErrors.minimumStock}</p>}
          </div>
          <div className="modal-field field-full">
            <label htmlFor="unitOfMeasure">Unidad de medida</label>
            <input
              id="unitOfMeasure"
              value={form.unitOfMeasure}
              onChange={(e) => setForm((f) => ({ ...f, unitOfMeasure: e.target.value }))}
              placeholder="unit"
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
          title="¿Eliminar inventario?"
          itemName={"Registro #" + (deleting?.id ?? "")}
          error={deleteError}
        />
      )}
    </>
  );
}
