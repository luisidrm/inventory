"use client";

import { useState } from "react";
import type { ProductCategoryResponse } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "./_service/categoriesApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<ProductCategoryResponse>[] = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripción" },
  { key: "color", label: "Color" },
  { key: "icon", label: "Icono" },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm = { name: "", description: "", color: "#6366f1", icon: "category" };

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

  const { data: result, isLoading } = useGetCategoriesQuery({ page, perPage: pageSize });
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const allRows = result?.data ?? [];
  const filteredData = searchTerm.trim()
    ? allRows.filter((r) =>
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : allRows;

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
      icon: item.icon ?? "category",
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
            icon: form.icon.trim() || undefined,
          },
        }).unwrap();
      } else {
        await createCategory({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          color: form.color,
          icon: form.icon.trim() || undefined,
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

  return (
    <>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading}
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
        pagination={result?.pagination ?? undefined}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        emptyIcon="category"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay categorías"}
      />
      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={editing ? "Editar categoría" : "Nueva categoría"}
          icon={editing ? "edit" : "category"}
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
          <div className="modal-field">
            <label htmlFor="icon">Icono (Material)</label>
            <input
              id="icon"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="category"
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
