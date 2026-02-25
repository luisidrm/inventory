"use client";

import { useState } from "react";
import type { UserResponse } from "@/lib/auth-types";
import type { CreateUserRequest } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "./_service/usersApi";
import { useGetLocationsQuery } from "../locations/_service/locationsApi";
import { useGetRolesQuery } from "../roles/_service/rolesApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import { useAppSelector } from "@/store/store";
import "../products/products-modal.css";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  birthDate: "",
  locationId: 0 as number,
  roleId: 0 as number,
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<UserResponse | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const user = useAppSelector((s) => s.auth);
  const organizationId = user?.organizationId ?? 0;
  const isAdmin =
    user?.roleId === 2;

  const { data: result, isLoading } = useGetUsersQuery({
    page,
    perPage: pageSize,
  });
  const { data: locationsResult } = useGetLocationsQuery({
    page: 1,
    perPage: 100,
    organizationId: organizationId || undefined,
  });
  const { data: rolesResult } = useGetRolesQuery({ page: 1, perPage: 100 });

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const locations = locationsResult?.data ?? [];
  const roles = rolesResult?.data ?? [];
  const columns: DataTableColumn<UserResponse>[] = [
    { key: "fullName", label: "Nombre" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Telefono" },
    { key: "gender", label: "Genero" },
    { key: "status", label: "Estado" },
    isAdmin
      ? {
          key: "organization.name",
          label: "Organizacion",
          render: (row) => row.organization?.name ?? "—",
        }
      : {
          key: "location.name",
          label: "Ubicacion",
          render: (row) => row.location?.name ?? "—",
        },
  ];
  const allRows = result?.data ?? [];
  const filteredData = searchTerm.trim()
    ? allRows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        ),
      )
    : allRows;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...initialForm, locationId: 0, roleId: 0 });
    setFormErrors({});
    setFormOpen(true);
  };
  const openEdit = (item: UserResponse) => {
    setEditing(item);
    setForm({
      fullName: item.fullName,
      email: item.email,
      phone: item.phone ?? "",
      password: "",
      birthDate: item.birthDate ?? "",
      locationId: item.locationId ?? 0,
      roleId: item.roleId ?? 0,
    });
    setFormErrors({});
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };
  const validate = (isEdit: boolean) => {
    const err: Record<string, string> = {};
    if (!form.fullName.trim()) err.fullName = "Nombre requerido";
    if (!form.email.trim()) err.email = "Email requerido";
    if (!isEdit && !form.password) err.password = "Contrasena requerida";
    if (!isEdit && form.password.length < 6)
      err.password = "Minimo 6 caracteres";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(!!editing)) return;
    setFormSubmitting(true);
    try {
      if (editing) {
        await updateUser({
          id: editing.id,
          body: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
            birthDate: form.birthDate || undefined,
            locationId: form.locationId || undefined,
            roleId: form.roleId || undefined,
            ...(form.password ? { password: form.password } : {}),
          },
        }).unwrap();
      } else {
        await createUser({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          birthDate: form.birthDate || undefined,
          organizationId,
          locationId: form.locationId || undefined,
          roleId: form.roleId || undefined,
        } as CreateUserRequest).unwrap();
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
  const openDelete = (item: UserResponse) => {
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
      await deleteUser(deleting.id).unwrap();
      closeConfirm();
    } catch {
      setDeleteError("Error al eliminar.");
    }
  };

  return (
    <>
      <DataTable
        data={filteredData}
        columns={columns}
        loading={isLoading}
        title="Usuarios"
        titleIcon="group"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nuevo usuario"
        onAdd={openCreate}
        actions={[
          { icon: "edit", label: "Editar", onClick: openEdit },
          {
            icon: "delete_outline",
            label: "Eliminar",
            onClick: openDelete,
            variant: "danger",
          },
        ]}
        pagination={result?.pagination ?? undefined}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        emptyIcon="group"
        emptyTitle="Sin registros"
        emptyDesc="Aun no hay usuarios"
      />
      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={editing ? "Editar usuario" : "Nuevo usuario"}
          icon={editing ? "edit" : "person_add"}
          onSubmit={handleSubmit}
          submitting={formSubmitting}
          submitLabel={editing ? "Guardar" : "Crear"}
          error={formErrors.submit}
        >
          <div className="modal-field field-full">
            <label htmlFor="fullName">Nombre completo *</label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
            />
            {formErrors.fullName && (
              <p className="form-error">{formErrors.fullName}</p>
            )}
          </div>
          <div className="modal-field">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            {formErrors.email && (
              <p className="form-error">{formErrors.email}</p>
            )}
          </div>
          <div className="modal-field">
            <label htmlFor="phone">Telefono</label>
            <input
              id="phone"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
          {!editing && (
            <div className="modal-field field-full">
              <label htmlFor="password">Contrasena *</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
              {formErrors.password && (
                <p className="form-error">{formErrors.password}</p>
              )}
            </div>
          )}
          <div className="modal-field">
            <label htmlFor="birthDate">Fecha de nacimiento</label>
            <input
              id="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthDate: e.target.value }))
              }
            />
          </div>
          <div className="modal-field">
            <label htmlFor="locationId">Ubicacion</label>
            <select
              id="locationId"
              value={form.locationId}
              onChange={(e) =>
                setForm((f) => ({ ...f, locationId: Number(e.target.value) }))
              }
            >
              <option value={0}>Sin asignar</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label htmlFor="roleId">Rol</label>
            <select
              id="roleId"
              value={form.roleId}
              onChange={(e) =>
                setForm((f) => ({ ...f, roleId: Number(e.target.value) }))
              }
            >
              <option value={0}>Sin asignar</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
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
          title="Eliminar usuario?"
          itemName={deleting?.fullName}
          error={deleteError}
        />
      )}
    </>
  );
}
