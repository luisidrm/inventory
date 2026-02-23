"use client";

import { useState } from "react";
import type { LocationResponse } from "@/lib/auth-types";
import type { CreateLocationRequest } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} from "./_service/locationsApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import { useAppSelector } from "@/store/store";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<LocationResponse>[] = [
  { key: "name", label: "Nombre" },
  { key: "code", label: "Código" },
  { key: "description", label: "Descripción" },
  { key: "organizationName", label: "Organización" },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm = {
  name: "",
  code: "",
  description: "",
};

export default function LocationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LocationResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<LocationResponse | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const user = useAppSelector((s) => s.auth);
  const organizationId = user?.organizationId ?? 0;

  const { data: result, isLoading } = useGetLocationsQuery({
    page,
    perPage: pageSize,
    ...(organizationId ? { organizationId } : {}),
  });
  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();
  const [deleteLocation] = useDeleteLocationMutation();

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

  const openEdit = (item: LocationResponse) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description ?? "",
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
    if (!form.name.trim()) err.name = "El nombre es requerido";
    if (!form.code.trim()) err.code = "El código es requerido";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      if (editing) {
        await updateLocation({
          id: editing.id,
          body: {
            name: form.name.trim(),
            code: form.code.trim(),
            description: form.description.trim() || undefined,
          },
        }).unwrap();
      } else {
        const payload: CreateLocationRequest = {
          organizationId,
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim() || undefined,
        };
        await createLocation(payload).unwrap();
        setPage(1);
      }
      closeForm();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDelete = (item: LocationResponse) => {
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
      await deleteLocation(deleting.id).unwrap();
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
        title="Ubicaciones"
        titleIcon="warehouse"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nueva ubicación"
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
        emptyIcon="warehouse"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay ubicaciones"}
      />

      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={editing ? "Editar ubicación" : "Nueva ubicación"}
          icon={editing ? "edit" : "warehouse"}
          onSubmit={handleSubmit}
          submitting={formSubmitting}
          submitLabel={editing ? "Guardar" : "Crear"}
          error={formErrors.submit}
        >
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
          title="¿Eliminar ubicación?"
          itemName={deleting?.name}
          error={deleteError}
        />
      )}
    </>
  );
}
