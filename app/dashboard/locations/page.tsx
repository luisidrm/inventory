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
  useUploadLocationImageMutation,
} from "./_service/locationsApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector } from "@/store/store";
import "../products/products-modal.css";
import { useUserPermissionCodes } from "@/lib/useUserPermissionCodes";
import { CUBA_PROVINCES, getMunicipalitiesByProvince } from "@/lib/cuba-locations";

function formatAddress(loc: { street?: string | null; municipality?: string | null; province?: string | null }): string {
  const parts = [loc.street, loc.municipality, loc.province].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

const COLUMNS: DataTableColumn<LocationResponse>[] = [
  {
    key: "photoUrl",
    label: "Foto",
    width: "64px",
    render: (row) =>
      row.photoUrl ? (
        <img src={row.photoUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 20 }}>
          <Icon name="location_on" />
        </div>
      ),
  },
  { key: "name", label: "Nombre" },
  { key: "code", label: "Código", width: "110px" },
  {
    key: "address",
    label: "Dirección",
    width: "200px",
    render: (row) => <span style={{ fontSize: "0.875rem" }}>{formatAddress(row)}</span>,
  },
  { key: "description", label: "Descripción" },
  { key: "organizationName", label: "Organización" },
  { key: "whatsAppContact", label: "WhatsApp", width: "150px" },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm = {
  name: "",
  code: "",
  description: "",
  whatsAppContact: "",
  photoUrl: "",
  province: "",
  municipality: "",
  street: "",
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
  const [deleteBlockedByApi, setDeleteBlockedByApi] = useState(false);
  const isLoadingMore = useRef(false);
  const filtersChanged = useRef(false);

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
  const [uploadLocationImage, { isLoading: uploadingImage }] = useUploadLocationImageMutation();

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
    if (!filtersChanged.current) { filtersChanged.current = true; return; }
    setPage(1);
    setAllRows([]);
  }, [searchTerm, organizationId]);

  const loadedRows =
    page === 1 && allRows.length === 0 ? (result?.data ?? []) : allRows;

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
      whatsAppContact: item.whatsAppContact ?? "",
      photoUrl: item.photoUrl ?? "",
      province: item.province ?? "",
      municipality: item.municipality ?? "",
      street: item.street ?? "",
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
      const wa = form.whatsAppContact.replace(/\D/g, "").trim() || undefined;
      const common = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        whatsAppContact: wa,
        photoUrl: form.photoUrl.trim() || undefined,
        province: form.province.trim() || undefined,
        municipality: form.municipality.trim() || undefined,
        street: form.street.trim() || undefined,
      };

      if (editing) {
        await updateLocation({ id: editing.id, body: common }).unwrap();
      } else {
        await createLocation({ organizationId, ...common }).unwrap();
        setPage(1);
      }
      closeForm();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((prev) => ({ ...prev, photoUrl: "Máximo 5 MB (JPEG, PNG, GIF o WebP)" }));
      return;
    }
    e.target.value = "";
    try {
      const photoUrl = await uploadLocationImage(file).unwrap();
      setForm((f) => ({ ...f, photoUrl }));
      setFormErrors((prev) => ({ ...prev, photoUrl: "" }));
    } catch {
      setFormErrors((prev) => ({ ...prev, photoUrl: "Error al subir la imagen" }));
    }
  };

  const openDelete = (item: LocationResponse) => {
    setDeleting(item);
    setDeleteError("");
    setDeleteBlockedByApi(false);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setDeleting(null);
    setDeleteError("");
    setDeleteBlockedByApi(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteError("");
    try {
      await deleteLocation(deleting.id).unwrap();
      closeConfirm();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const data = (err as { data?: { message?: string; Message?: string } })?.data;
      const msg = data?.message ?? data?.Message ?? "";
      const isInUse =
        status === 400 ||
        (typeof msg === "string" &&
          (msg.includes("en uso") || msg.includes("ventas") || msg.includes("devoluciones") || msg.includes("LocationInUse")));
      if (isInUse) {
        setDeleteBlockedByApi(true);
        setDeleteError("No se puede eliminar esta ubicación porque tiene ventas o devoluciones asociadas.");
      } else {
        setDeleteError("Error al eliminar. Intenta de nuevo.");
      }
    }
  };

  return (
    <>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={allRows.length === 0 && (isLoading || isFetching)}
        title="Ubicaciones"
        titleIcon="warehouse"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nueva ubicación"
        onAdd={openCreate}
        addDisabled={!canCreateLocation}
        actions={[
          { icon: "edit", label: "Editar", onClick: openEdit, disabled: () => !canEditLocation },
          { icon: "delete_outline", label: "Eliminar", onClick: openDelete, variant: "danger", disabled: () => !canDeleteLocation },
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
          <div className="modal-field field-full">
            <label>Foto de la ubicación</label>
            <input type="hidden" value={form.photoUrl} readOnly />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleUploadPhoto}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {form.photoUrl ? (
                <>
                  <img src={form.photoUrl} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
                  <div>
                    <button type="button" className="modal-btn modal-btn--secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                      {uploadingImage ? "Subiendo…" : "Cambiar foto"}
                    </button>
                    <button type="button" className="modal-btn" style={{ marginLeft: 8 }} onClick={() => setForm((f) => ({ ...f, photoUrl: "" }))}>
                      Quitar
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="modal-btn modal-btn--secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? "Subiendo…" : "Subir foto"}
                </button>
              )}
            </div>
            <p style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 4 }}>JPEG, PNG, GIF o WebP. Máx. 5 MB.</p>
            {formErrors.photoUrl && <p className="form-error">{formErrors.photoUrl}</p>}
          </div>
          <div className="modal-field">
            <label htmlFor="street">Calle / Dirección</label>
            <input
              id="street"
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              placeholder="Calle Mayor 1"
            />
          </div>
          <div className="modal-field">
            <label htmlFor="province">Provincia</label>
            <select
              id="province"
              value={form.province}
              onChange={(e) => {
                const province = e.target.value;
                const municipalities = getMunicipalitiesByProvince(province);
                const currentMunicipality = form.municipality;
                const keepMunicipality = currentMunicipality && municipalities.includes(currentMunicipality);
                setForm((f) => ({
                  ...f,
                  province,
                  municipality: keepMunicipality ? currentMunicipality : "",
                }));
              }}
            >
              <option value="">Seleccione provincia</option>
              {CUBA_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label htmlFor="municipality">Municipio</label>
            <select
              id="municipality"
              value={form.province ? (getMunicipalitiesByProvince(form.province).includes(form.municipality) ? form.municipality : "") : ""}
              onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))}
              disabled={!form.province}
            >
              <option value="">Seleccione municipio</option>
              {getMunicipalitiesByProvince(form.province).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="modal-field field-full">
            <label htmlFor="whatsAppContact">WhatsApp de contacto</label>
            <input
              id="whatsAppContact"
              type="tel"
              value={form.whatsAppContact}
              onChange={(e) => setForm((f) => ({ ...f, whatsAppContact: e.target.value }))}
              placeholder="5215512345678"
            />
            <p style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 4 }}>
              Código de país + número, sin <code>+</code> ni espacios.&nbsp;
              Ej: <strong>5215512345678</strong> (México). Se usa para el enlace de pedidos por WhatsApp.
            </p>
            {formErrors.whatsAppContact && (
              <p className="form-error">{formErrors.whatsAppContact}</p>
            )}
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
          onConfirm={deleteBlockedByApi ? closeConfirm : handleDelete}
          title={deleteBlockedByApi ? "No se puede eliminar" : "¿Eliminar ubicación?"}
          itemName={deleting?.name}
          description={
            deleteBlockedByApi
              ? deleteError
              : "Al eliminar esta ubicación: los usuarios asignados quedarán sin ubicación; se eliminarán todos los movimientos de inventario y todo el stock de esta ubicación. ¿Deseas continuar?"
          }
          error={deleteBlockedByApi ? "" : deleteError}
          confirmLabel={deleteBlockedByApi ? "Entendido" : "Eliminar"}
          singleAction={deleteBlockedByApi}
        />
      )}
    </>
  );
}
