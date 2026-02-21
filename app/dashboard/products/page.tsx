"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
} from "@/lib/products-api";
import type {
  ProductResponse,
  PaginationInfo,
  TableColumn,
  CreateProductRequest,
} from "@/lib/dashboard-types";
import "./products-table.css";
import "./products-modal.css";

const COLUMNS: TableColumn[] = [
  { key: "code", label: "Código", width: "100px" },
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripción" },
  { key: "precio", label: "Precio", type: "currency" },
  { key: "costo", label: "Costo", type: "currency" },
  { key: "isAvailable", label: "Estado", type: "boolean" },
  { key: "createdAt", label: "Creado", type: "date" },
];

const PAGE_SIZES = [5, 10, 25, 50];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function getValue(row: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], row);
}

const initialForm = {
  code: "",
  name: "",
  description: "",
  categoryId: "" as number | string,
  precio: "0",
  costo: "0",
  imagenUrl: "",
  isAvailable: true,
};

export default function ProductsPage() {
  const [data, setData] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<{ value: number; label: string }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProductResponse | null>(null);

  const loadCategories = useCallback(async () => {
    const res = await getProductCategories(1, 100);
    setCategories(res.data.map((c) => ({ value: c.id, label: c.name })));
  }, []);

  const loadData = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await getProducts(p, pageSize, "desc");
        setData(res.data);
        setPagination(res.pagination);
      } catch {
        setData([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadData(page);
  }, [page, loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (item: ProductResponse) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      categoryId: item.categoryId ?? "",
      precio: String(item.precio),
      costo: String(item.costo),
      imagenUrl: item.imagenUrl ?? "",
      isAvailable: item.isAvailable,
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
    if (!form.code.trim()) err.code = "El código es requerido";
    if (!form.name.trim()) err.name = "El nombre es requerido";
    const precio = Number(form.precio);
    const costo = Number(form.costo);
    if (Number.isNaN(precio) || precio < 0) err.precio = "Precio inválido";
    if (Number.isNaN(costo) || costo < 0) err.costo = "Costo inválido";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormSubmitting(true);
    try {
      const payload: CreateProductRequest = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId === "" ? null : Number(form.categoryId),
        precio: Number(form.precio),
        costo: Number(form.costo),
        imagenUrl: form.imagenUrl.trim(),
        isAvailable: !!form.isAvailable,
      };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      closeForm();
      loadData(editing ? page : 1);
      if (!editing) setPage(1);
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDelete = (item: ProductResponse) => {
    setDeleting(item);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct(deleting.id);
      setConfirmOpen(false);
      setDeleting(null);
      loadData(pagination?.currentPage ?? 1);
    } catch {
      setFormErrors({ submit: "Error al eliminar" });
    }
  };

  const rangeStart = pagination
    ? (pagination.currentPage - 1) * pagination.pageSize + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)
    : 0;

  const getPageNumbers = (): number[] => {
    if (!pagination) return [];
    const total = pagination.totalPages;
    const current = pagination.currentPage;
    const maxVisible = 5;
    if (total <= maxVisible)
      return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > total) {
      end = total;
      start = end - maxVisible + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <>
      <div className="table-card">
        <div className="card-header">
          <h1 className="card-header__title">
            <Icon name="inventory_2" />
            Productos
          </h1>
        </div>

        <div className="card-toolbar">
          <div className="card-toolbar__search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="card-toolbar__spacer" />
          <button type="button" className="btn-add" onClick={openCreate}>
            <Icon name="add" />
            Nuevo Producto
          </button>
        </div>

        {loading ? (
          <div className="state-msg">
            <div className="state-msg__spinner" />
            <span>Cargando datos...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="state-msg state-msg--empty">
            <div className="state-msg__icon-box">
              <Icon name="inventory_2" />
            </div>
            <p className="state-msg__title">Sin registros</p>
            <p className="state-msg__desc">Aún no hay productos</p>
            <button type="button" className="btn-add" onClick={openCreate}>
              <Icon name="add" />
              Crear primero
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="products-table">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col.key} style={{ width: col.width ?? "auto" }}>
                        {col.label}
                      </th>
                    ))}
                    <th className="th-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 1 ? "row-alt" : ""}>
                      {COLUMNS.map((col) => (
                        <td key={col.key}>
                          {col.type === "boolean" && (
                            <span
                              className={`tag ${getValue(row, col.key) ? "tag--green" : "tag--red"}`}
                            >
                              {getValue(row, col.key) ? "Activo" : "Inactivo"}
                            </span>
                          )}
                          {col.type === "date" && (
                            <span>
                              {formatDate(String(getValue(row, col.key) ?? ""))}
                            </span>
                          )}
                          {col.type === "currency" && (
                            <span className="cell-mono">
                              {formatCurrency(Number(getValue(row, col.key) ?? 0))}
                            </span>
                          )}
                          {(!col.type || col.type === "text" || col.type === "number") && (
                            <span className="cell-clamp">
                              {getValue(row, col.key) != null
                                ? String(getValue(row, col.key))
                                : "—"}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="td-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => openEdit(row)}
                          title="Editar"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => openDelete(row)}
                          title="Eliminar"
                        >
                          <Icon name="delete_outline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <div className="card-footer">
                <div className="card-footer__left">
                  <span>Filas por página</span>
                  <select
                    className="footer-select"
                    value={pagination.pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="card-footer__center">
                  <button
                    type="button"
                    className="pg-btn"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <Icon name="chevron_left" />
                    Anterior
                  </button>
                  {getPageNumbers().map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pg-num ${p === pagination.currentPage ? "pg-num--on" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pg-btn"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próximo
                    <Icon name="chevron_right" />
                  </button>
                </div>
                <div className="card-footer__right">
                  Mostrando {rangeStart}–{rangeEnd} de {pagination.totalCount} registros
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header__icon">
                <Icon name={editing ? "edit" : "inventory_2"} />
              </div>
              <h2 className="modal-header__title">
                {editing ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button type="button" className="modal-close" onClick={closeForm} aria-label="Cerrar">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="modal-form-grid">
                <div className="modal-field">
                  <label htmlFor="code">Código *</label>
                  <input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="Código"
                  />
                  {formErrors.code && (
                    <p className="form-error">{formErrors.code}</p>
                  )}
                </div>
                <div className="modal-field">
                  <label htmlFor="name">Nombre *</label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre"
                  />
                  {formErrors.name && (
                    <p className="form-error">{formErrors.name}</p>
                  )}
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
                  <label htmlFor="categoryId">Categoría</label>
                  <select
                    id="categoryId"
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        categoryId: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label htmlFor="precio">Precio *</label>
                  <input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio}
                    onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                  />
                  {formErrors.precio && (
                    <p className="form-error">{formErrors.precio}</p>
                  )}
                </div>
                <div className="modal-field">
                  <label htmlFor="costo">Costo *</label>
                  <input
                    id="costo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.costo}
                    onChange={(e) => setForm((f) => ({ ...f, costo: e.target.value }))}
                  />
                  {formErrors.costo && (
                    <p className="form-error">{formErrors.costo}</p>
                  )}
                </div>
                <div className="modal-field field-full">
                  <label htmlFor="imagenUrl">URL de imagen</label>
                  <input
                    id="imagenUrl"
                    type="url"
                    value={form.imagenUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imagenUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="modal-field field-full modal-toggle">
                  <input
                    id="isAvailable"
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isAvailable: e.target.checked }))
                    }
                  />
                  <label htmlFor="isAvailable">Disponible</label>
                </div>
              </div>
              {formErrors.submit && (
                <p className="form-error" style={{ marginTop: 12 }}>
                  {formErrors.submit}
                </p>
              )}
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn--ghost" onClick={closeForm}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn--primary"
                  disabled={formSubmitting}
                >
                  {editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmOpen && deleting && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div
            className="modal-box confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">
              <Icon name="delete_outline" />
            </div>
            <h3 className="confirm-title">¿Eliminar producto?</h3>
            <p className="confirm-msg">
              Se eliminará &quot;{deleting.name}&quot; permanentemente.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn--cancel"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="confirm-btn confirm-btn--danger"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
