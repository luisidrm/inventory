"use client";

import { useState } from "react";
import type { SupplierResponse, CreateSupplierRequest } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import {
  useGetSuppliersQuery,
  useGetSupplierStatsQuery,
  useGetDeliveryTimelineQuery,
  useGetSupplierCategoryDistributionQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from "./_service/suppliersApi";
import { DeleteModal } from "@/components/DeleteModal";
import { FormModal } from "@/components/FormModal";
import Switch from "@/components/Switch";
import { StatCard, LineChartCard, PieChartCard, theme } from "@/components/dashboard";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<SupplierResponse>[] = [
  { key: "name", label: "Nombre" },
  { key: "contactPerson", label: "Contacto" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Email" },
  { key: "isActive", label: "Estado", type: "boolean", booleanLabels: { true: "Activo", false: "Inactivo" } },
  { key: "createdAt", label: "Creado", type: "date" },
];

const initialForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  isActive: true,
};

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<SupplierResponse | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data: result, isLoading } = useGetSuppliersQuery({ page, perPage: pageSize });
  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

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

  const openEdit = (item: SupplierResponse) => {
    setEditing(item);
    setForm({
      name: item.name,
      contactPerson: item.contactPerson ?? "",
      phone: item.phone ?? "",
      email: item.email ?? "",
      address: item.address ?? "",
      notes: item.notes ?? "",
      isActive: item.isActive,
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
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      const payload: CreateSupplierRequest = {
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await updateSupplier({ id: editing.id, body: payload }).unwrap();
      } else {
        await createSupplier(payload).unwrap();
        setPage(1);
      }
      closeForm();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDelete = (item: SupplierResponse) => {
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
      await deleteSupplier(deleting.id).unwrap();
      closeConfirm();
    } catch {
      setDeleteError("Error al eliminar. Intenta de nuevo.");
    }
  };

  const { data: supplierStatsApi } = useGetSupplierStatsQuery();
  const { data: deliveryApi } = useGetDeliveryTimelineQuery();
  const { data: supplierPieApi } = useGetSupplierCategoryDistributionQuery();

  const supplierStats = supplierStatsApi && typeof supplierStatsApi === "object"
    ? [
        { label: "Total Proveedores", value: String((supplierStatsApi as Record<string, unknown>).totalSuppliers ?? "124"), icon: "group" as const, trend: `+${(supplierStatsApi as Record<string, unknown>).totalSuppliersTrend ?? 12}%`, trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Órdenes Activas", value: String((supplierStatsApi as Record<string, unknown>).activeOrders ?? "48"), icon: "shopping_cart" as const, trend: `+${(supplierStatsApi as Record<string, unknown>).activeOrdersTrend ?? 8}%`, trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Cumplimiento", value: `${(supplierStatsApi as Record<string, unknown>).compliancePercent ?? 94}%`, icon: "check_circle" as const, trend: `+${(supplierStatsApi as Record<string, unknown>).complianceTrend ?? 3}%`, trendUp: true, iconBg: "#FFFBEB", iconColor: "#F59E0B" },
        { label: "Gastos Mes", value: (supplierStatsApi as Record<string, unknown>).monthlyExpenses != null ? `$${(Number((supplierStatsApi as Record<string, unknown>).monthlyExpenses) / 1000).toFixed(1)}k` : "$12.4k", icon: "payment" as const, trend: `+${(supplierStatsApi as Record<string, unknown>).monthlyExpensesTrend ?? 15}%`, trendUp: true, iconBg: "#FDF2F8", iconColor: "#EC4899" },
      ]
    : [
        { label: "Total Proveedores", value: "124", icon: "group" as const, trend: "+12%", trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
        { label: "Órdenes Activas", value: "48", icon: "shopping_cart" as const, trend: "+8%", trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
        { label: "Cumplimiento", value: "94%", icon: "check_circle" as const, trend: "+3%", trendUp: true, iconBg: "#FFFBEB", iconColor: "#F59E0B" },
        { label: "Gastos Mes", value: "$12.4k", icon: "payment" as const, trend: "+15%", trendUp: true, iconBg: "#FDF2F8", iconColor: "#EC4899" },
      ];
  const deliveryData = (deliveryApi && deliveryApi.length > 0) ? deliveryApi : [
    { label: "Lun", value: 45 }, { label: "Mar", value: 70 }, { label: "Mié", value: 55 }, { label: "Jue", value: 90 }, { label: "Vie", value: 65 }, { label: "Sáb", value: 80 },
  ];
  const supplierPie = (supplierPieApi && supplierPieApi.length > 0) ? supplierPieApi : [
    { name: "Electrónica", value: 40 }, { name: "Hogar", value: 30 }, { name: "Textil", value: 20 }, { name: "Otros", value: 10 },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {supplierStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <LineChartCard title="Pedidos y Entregas en el tiempo" subtitle="Últimos 7 días" data={deliveryData} height={300} filled={false} />
          <PieChartCard title="Distribución por Categoría" data={supplierPie} height={300} />
        </div>
      </div>
      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading}
        title="Proveedores"
        titleIcon="local_shipping"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        addLabel="Nuevo proveedor"
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
        emptyIcon="local_shipping"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "Aún no hay proveedores"}
      />

      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={closeForm}
          title={editing ? "Editar proveedor" : "Nuevo proveedor"}
          icon={editing ? "edit" : "local_shipping"}
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
          <div className="modal-field">
            <label htmlFor="contactPerson">Persona de contacto</label>
            <input
              id="contactPerson"
              value={form.contactPerson}
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
              placeholder="Nombre"
            />
          </div>
          <div className="modal-field">
            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Teléfono"
            />
          </div>
          <div className="modal-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@ejemplo.com"
            />
          </div>
          <div className="modal-field field-full">
            <label htmlFor="address">Dirección</label>
            <input
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Dirección"
            />
          </div>
          <div className="modal-field field-full">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notas"
              rows={3}
            />
          </div>
          <div className="modal-field field-full modal-toggle">
            <Switch
              checked={form.isActive}
              onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            />
            <label htmlFor="isActive">Activo</label>
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
          title="¿Eliminar proveedor?"
          itemName={deleting?.name}
          error={deleteError}
        />
      )}
    </>
  );
}
