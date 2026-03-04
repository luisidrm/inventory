"use client";

import { useState, useRef, useEffect } from "react";
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
import { useUserPermissionCodes } from "@/lib/useUserPermissionCodes";

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
  const isLoadingMore = useRef(false);

  const user = useAppSelector((s) => s.auth);
  const organizationId = user?.organizationId ?? 0;

  // ─── Permissions ──────────────────────────────────────────────────────────

  const { has: hasPermission } = useUserPermissionCodes();
  const canCreateLocation = hasPermission("location.create");
  const canEditLocation = hasPermission("location.update");
  const canDeleteLocation = hasPermission("location.delete");

  const { data: result, isLoading, isFetching } = useGetLocationsQuery({
    page,
    perPage: pageSize,
    ...(organizationId ? { organizationId } : {}),
  });
  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();
  const [deleteLocation] = useDeleteLocationMutation();

  const [allRows, setAllRows] = useState<LocationResponse[]>([]);

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
  }, [searchTerm, organizationId]);

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
        loading={isLoading && page === 1}
        title="Ubicaciones"
        titleIcon="warehouse"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel={canCreateLocation ? "Nueva ubicación" : undefined}
        onAdd={canCreateLocation ? openCreate : undefined}
        actions={[
          {
            icon: "edit",
            label: "Editar",
            onClick: openEdit,
            hidden: () => !canEditLocation,
          },
          {
            icon: "delete_outline",
            label: "Eliminar",
            onClick: openDelete,
            variant: "danger",
            hidden: () => !canDeleteLocation,
          },
        ]}
        infiniteScroll
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={isFetching && page > 1}
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
