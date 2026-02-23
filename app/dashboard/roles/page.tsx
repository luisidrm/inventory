"use client";

import { useState } from "react";
import type { RoleResponse } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "./_service/rolesApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<RoleResponse>[] = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripcion" },
  { key: "isSystem", label: "Sistema", type: "boolean", booleanLabels: { true: "Si", false: "No" } },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm = { name: "", description: "" };

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<RoleResponse | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const { data: result, isLoading } = useGetRolesQuery({ page, perPage: pageSize });
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const allRows = result?.data ?? [];
  const filteredData = searchTerm.trim() ? allRows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(searchTerm.toLowerCase()))) : allRows;

  const openCreate = () => { setEditing(null); setForm(initialForm); setFormErrors({}); setFormOpen(true); };
  const openEdit = (item: RoleResponse) => { setEditing(item); setForm({ name: item.name, description: item.description ?? "" }); setFormErrors({}); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const validate = () => { const err: Record<string, string> = {}; if (!form.name.trim()) err.name = "Nombre requerido"; setFormErrors(err); return Object.keys(err).length === 0; };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      if (editing) await updateRole({ id: editing.id, body: { name: form.name.trim(), description: form.description.trim() || undefined, permissionIds: editing.permissionIds ?? [] } }).unwrap();
      else { await createRole({ name: form.name.trim(), description: form.description.trim() || undefined, permissionIds: [] }).unwrap(); setPage(1); }
      closeForm();
    } catch (err) { setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" }); }
    finally { setFormSubmitting(false); }
  };
  const openDelete = (item: RoleResponse) => { if (item.isSystem) return; setDeleting(item); setDeleteError(""); setConfirmOpen(true); };
  const closeConfirm = () => { setConfirmOpen(false); setDeleting(null); setDeleteError(""); };
  const handleDelete = async () => { if (!deleting) return; try { await deleteRole(deleting.id).unwrap(); closeConfirm(); } catch { setDeleteError("Error al eliminar."); } };

  return (
    <>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading}
        title="Roles"
        titleIcon="admin_panel_settings"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nuevo rol"
        onAdd={openCreate}
        actions={[{ icon: "edit", label: "Editar", onClick: openEdit }, { icon: "delete_outline", label: "Eliminar", onClick: openDelete, variant: "danger", hidden: (row) => row.isSystem }]}
        pagination={result?.pagination ?? undefined}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        emptyIcon="admin_panel_settings"
        emptyTitle="Sin registros"
        emptyDesc="Aun no hay roles"
      />
      {formOpen && (
        <FormModal open={formOpen} onClose={closeForm} title={editing ? "Editar rol" : "Nuevo rol"} icon={editing ? "edit" : "admin_panel_settings"} onSubmit={handleSubmit} submitting={formSubmitting} submitLabel={editing ? "Guardar" : "Crear"} error={formErrors.submit}>
          <div className="modal-field field-full"><label htmlFor="name">Nombre *</label><input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre del rol" />{formErrors.name && <p className="form-error">{formErrors.name}</p>}</div>
          <div className="modal-field field-full"><label htmlFor="description">Descripcion</label><textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} /></div>
          {formErrors.submit && <p className="form-error" style={{ marginTop: 12 }}>{formErrors.submit}</p>}
        </FormModal>
      )}
      {confirmOpen && deleting && <DeleteModal open={confirmOpen && !!deleting} onClose={closeConfirm} onConfirm={handleDelete} title="Eliminar rol?" itemName={deleting?.name} error={deleteError} />}
    </>
  );
}
