"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { RoleResponse } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
} from "./_service/rolesApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import { PERMISSIONS } from "@/lib/utils";
import "../products/products-modal.css";
import "./roles-modal.css";

const COLUMNS: DataTableColumn<RoleResponse>[] = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripcion" },
  {
    key: "isSystem",
    label: "Sistema",
    type: "boolean",
    booleanLabels: { true: "Si", false: "No" },
  },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm: { name: string; description: string; permissions: number[] } = {
  name: "",
  description: "",
  permissions: [],
};

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
  const isLoadingMore = useRef(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const { data: permissions, isLoading: loadingPermissions } =
    useGetPermissionsQuery();
  const permissionList = useMemo(() => {
    const raw = permissions as { result?: { id: number; code: string; name: string }[] } | undefined;
    const fromApi = raw?.result ?? [];
    return fromApi.length > 0 ? fromApi : PERMISSIONS;
  }, [permissions]);
  const {
    data: result,
    isLoading,
    isFetching,
  } = useGetRolesQuery({ page, perPage: pageSize });
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [allRows, setAllRows] = useState<RoleResponse[]>([]);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false);
      }
    }
    if (selectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectorOpen]);

  const filteredData = searchTerm.trim()
    ? allRows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        ),
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
  const openEdit = (item: RoleResponse) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description ?? "", permissions: item.permissionIds ?? [] });
    setFormErrors({});
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };
  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = "Nombre requerido";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      if (editing)
        await updateRole({
          id: editing.id,
          body: {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            permissionIds: form.permissions,
          },
        }).unwrap();
      else {
        await createRole({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          permissionIds: form.permissions,
        }).unwrap();
        setPage(1);
      }
      closeForm();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setFormSubmitting(false);
    }
  };
  const openDelete = (item: RoleResponse) => {
    if (item.isSystem) return;
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
      await deleteRole(deleting.id).unwrap();
      closeConfirm();
    } catch {
      setDeleteError("Error al eliminar.");
    }
  };

  const getPermissionName = (id: number) =>
    PERMISSIONS.find((p) => p.id === id)?.name ??
    `Permiso #${id}`;

  const availablePermissions = useMemo(
    () => permissionList.filter((p) => !form.permissions.includes(p.id)),
    [permissionList, form.permissions],
  );

  return (
    <>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading && page === 1}
        title="Roles"
        titleIcon="admin_panel_settings"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nuevo rol"
        onAdd={openCreate}
        actions={[
          { icon: "edit", label: "Editar", onClick: openEdit },
          {
            icon: "delete_outline",
            label: "Eliminar",
            onClick: openDelete,
            variant: "danger",
            hidden: (row) => row.isSystem,
          },
        ]}
        infiniteScroll
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={isFetching && page > 1}
        emptyIcon="admin_panel_settings"
        emptyTitle="Sin registros"
        emptyDesc="Aun no hay roles"
      />
      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={editing ? "Editar rol" : "Nuevo rol"}
          icon={editing ? "edit" : "admin_panel_settings"}
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
              placeholder="Nombre del rol"
            />
            {formErrors.name && <p className="form-error">{formErrors.name}</p>}
          </div>
          <div className="modal-field field-full">
            <label htmlFor="description">Descripcion</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="modal-field field-full">
            <label>Permisos</label>
            <div className="roles-permissions-wrap">
              <div className="roles-chips">
                {form.permissions.length === 0 && (
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    Sin permisos asignados
                  </span>
                )}
                {form.permissions.map((permId) => (
                  <span key={permId} className="roles-chip">
                    {getPermissionName(permId)}
                    <button
                      type="button"
                      className="roles-chip-remove"
                      aria-label="Quitar permiso"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          permissions: f.permissions.filter((id) => id !== permId),
                        }))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {loadingPermissions ? (
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Cargando permisos...</p>
              ) : (
                <div className="roles-selector" ref={selectorRef}>
                  <button
                    type="button"
                    className={`roles-selector-trigger ${selectorOpen ? "open" : ""}`}
                    onClick={() => setSelectorOpen((o) => !o)}
                  >
                    <span>Agregar permisos</span>
                    <span>{selectorOpen ? "▲" : "▼"}</span>
                  </button>
                  {selectorOpen && (
                    <div className="roles-selector-dropdown">
                      {availablePermissions.length === 0 ? (
                        <div className="roles-selector-empty">
                          Todos los permisos ya están asignados
                        </div>
                      ) : (
                        availablePermissions.map((perm) => (
                          <button
                            key={perm.id}
                            type="button"
                            className="roles-option"
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                permissions: [...f.permissions, perm.id],
                              }));
                            }}
                          >
                            {getPermissionName(perm.id)}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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
          title="Eliminar rol?"
          itemName={deleting?.name}
          error={deleteError}
        />
      )}
    </>
  );
}
