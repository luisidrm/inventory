"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { removeItem, updateQuantity, clearCart } from "@/store/cartSlice";
import { getApiUrl } from "@/lib/auth-api";
import type { CreateSaleOrderRequest } from "@/lib/dashboard-types";

function formatPrice(v: number) {
  return `$${v.toFixed(2)}`;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

function buildWaMessage(
  items: { name: string; quantity: number; unitPrice: number }[],
  locationName: string,
  folio: string,
  customer: CustomerInfo
): string {
  const lines = items
    .map((i) => `- ${i.name} x ${i.quantity} — ${formatPrice(i.unitPrice)} c/u`)
    .join("\n");
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const parts = [
    `Hola, quiero solicitar el siguiente pedido:`,
    ``,
    lines,
    ``,
    `Total: ${formatPrice(total)}`,
    `Ubicación: ${locationName}`,
    `Ref. orden: ${folio}`,
  ];
  if (customer.name)    parts.push(`Nombre: ${customer.name}`);
  if (customer.phone)   parts.push(`Teléfono: ${customer.phone}`);
  if (customer.address) parts.push(`Dirección de entrega: ${customer.address}`);
  if (customer.notes)   parts.push(`Notas: ${customer.notes}`);
  return parts.join("\n");
}

// ─── Modal de confirmación ────────────────────────────────────────────────────

interface ConfirmModalProps {
  onClose: () => void;
  onConfirm: (customer: CustomerInfo) => Promise<void>;
  submitting: boolean;
  error: string;
}

function ConfirmOrderModal({ onClose, onConfirm, submitting, error }: ConfirmModalProps) {
  const cart = useAppSelector((s) => s.cart);
  const total = cart.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "", phone: "", address: "", notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<CustomerInfo>>({});

  const set = (field: keyof CustomerInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setCustomer((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs: Partial<CustomerInfo> = {};
    if (!customer.name.trim())    errs.name    = "Requerido";
    if (!customer.address.trim()) errs.address = "Requerido";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onConfirm(customer);
  };

  return (
    <div className="order-confirm-overlay" onClick={onClose}>
      <div className="order-confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="order-confirm-modal__header">
          <span className="order-confirm-modal__icon">
            <Icon name="receipt_long" />
          </span>
          <h2 className="order-confirm-modal__title">Confirmar pedido</h2>
          <button type="button" className="order-confirm-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>

        {/* Body */}
        <div className="order-confirm-modal__body">
          <div className="order-confirm-location">
            <Icon name="location_on" />
            {cart.locationName}
          </div>

          {/* Resumen productos */}
          <table className="order-confirm-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="td-right">Cant.</th>
                <th className="td-right">P. Unit.</th>
                <th className="td-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td className="td-right">{item.quantity}</td>
                  <td className="td-right">{formatPrice(item.unitPrice)}</td>
                  <td className="td-right">{formatPrice(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="order-confirm-total">
            <span>Total estimado</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          {/* Datos del cliente */}
          <div className="order-confirm-section-title">
            <Icon name="person" />
            Tus datos de contacto
          </div>

          <div className="order-confirm-fields">
            <div className="order-confirm-field">
              <label>Nombre *</label>
              <input
                type="text"
                value={customer.name}
                onChange={set("name")}
                placeholder="Tu nombre completo"
                disabled={submitting}
              />
              {fieldErrors.name && <span className="order-confirm-field-err">{fieldErrors.name}</span>}
            </div>

            <div className="order-confirm-field">
              <label>Teléfono</label>
              <input
                type="tel"
                value={customer.phone}
                onChange={set("phone")}
                placeholder="Tu número de teléfono"
                disabled={submitting}
              />
            </div>

            <div className="order-confirm-field order-confirm-field--full">
              <label>Dirección de entrega *</label>
              <input
                type="text"
                value={customer.address}
                onChange={set("address")}
                placeholder="Calle, número, colonia, ciudad…"
                disabled={submitting}
              />
              {fieldErrors.address && <span className="order-confirm-field-err">{fieldErrors.address}</span>}
            </div>

            <div className="order-confirm-field order-confirm-field--full">
              <label>Notas adicionales</label>
              <textarea
                value={customer.notes}
                onChange={set("notes")}
                placeholder="Indicaciones especiales, horario de entrega, etc."
                rows={2}
                disabled={submitting}
              />
            </div>
          </div>

          {error && <p className="order-confirm-error">{error}</p>}
        </div>

        {/* Footer */}
        <div className="order-confirm-modal__footer">
          <button
            type="button"
            className="order-confirm-btn order-confirm-btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Volver
          </button>
          <button
            type="button"
            className="order-confirm-btn order-confirm-btn--wa"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Icon name={submitting ? "hourglass_empty" : "chat"} />
            {submitting ? "Registrando…" : "Confirmar y enviar por WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const total = cart.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handleClear = () => dispatch(clearCart());

  const openConfirm = () => {
    setSubmitError("");
    setConfirmOpen(true);
  };

  const handleConfirmAndSend = async (customer: CustomerInfo) => {
    if (!cart.locationId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const customerNote = [
        customer.name    ? `Nombre: ${customer.name}`              : "",
        customer.phone   ? `Teléfono: ${customer.phone}`           : "",
        customer.address ? `Dirección: ${customer.address}`        : "",
        customer.notes   ? `Notas: ${customer.notes}`              : "",
      ].filter(Boolean).join(" | ");

      const body: CreateSaleOrderRequest = {
        locationId: cart.locationId,
        contactId: null,
        notes: customerNote || null,
        discountAmount: 0,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: 0,
        })),
      };

      const res = await fetch(`${getApiUrl()}/sale-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = (await res.json()) as { result?: { folio?: string; id?: number } };
      const order = data.result ?? {};
      const folio = order.folio ?? (order.id ? `#${order.id}` : "nueva");

      if (cart.whatsAppContact) {
        const msg = buildWaMessage(cart.items, cart.locationName, folio, customer);
        const waUrl = `https://wa.me/${cart.whatsAppContact}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }

      dispatch(clearCart());
      setConfirmOpen(false);
      setDrawerOpen(false);
    } catch {
      setSubmitError("No se pudo registrar la orden. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        type="button"
        className="cart-fab"
        onClick={() => setDrawerOpen(true)}
        aria-label={`Carrito (${itemCount} producto${itemCount !== 1 ? "s" : ""})`}
      >
        <Icon name="shopping_cart" />
        {itemCount > 0 && (
          <span className="cart-fab__badge">{itemCount > 99 ? "99+" : itemCount}</span>
        )}
      </button>

      {/* ── Backdrop + Drawer ── */}
      {drawerOpen && (
        <>
          <div className="cart-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden />

          <aside className="cart-drawer" role="dialog" aria-label="Tu pedido">
            {/* Header */}
            <div className="cart-drawer__header">
              <span className="cart-drawer__title">
                <Icon name="shopping_cart" />
                Tu pedido
                {itemCount > 0 && ` (${itemCount})`}
              </span>
              {cart.items.length > 0 && (
                <button type="button" className="cart-drawer__clear" onClick={handleClear}>
                  Vaciar
                </button>
              )}
              <button
                type="button"
                className="cart-drawer__close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar carrito"
              >
                <Icon name="close" />
              </button>
            </div>

            {/* Items */}
            <div className="cart-drawer__body">
              {cart.items.length === 0 ? (
                <div className="cart-drawer__empty">
                  <Icon name="remove_shopping_cart" />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    {item.imagenUrl ? (
                      <img src={item.imagenUrl} alt={item.name} className="cart-item__img" />
                    ) : (
                      <div className="cart-item__img-placeholder">
                        <Icon name="inventory_2" />
                      </div>
                    )}

                    <div className="cart-item__info">
                      <div className="cart-item__name">{item.name}</div>
                      <div className="cart-item__price-unit">{formatPrice(item.unitPrice)} c/u</div>
                      <div className="cart-item__controls">
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))
                          }
                        >
                          −
                        </button>
                        <span className="cart-item__qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          disabled={item.quantity >= item.stockAtLocation}
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span className="cart-item__subtotal">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </span>

                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() => dispatch(removeItem(item.productId))}
                      aria-label={`Quitar ${item.name}`}
                    >
                      <Icon name="delete_outline" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="cart-drawer__footer">
                <div className="cart-drawer__total-row">
                  <span className="cart-drawer__total-label">Total estimado</span>
                  <span className="cart-drawer__total-value">{formatPrice(total)}</span>
                </div>

                {cart.whatsAppContact ? (
                  <button
                    type="button"
                    className="cart-drawer__wa-btn"
                    onClick={openConfirm}
                  >
                    <Icon name="chat" />
                    Enviar pedido por WhatsApp
                  </button>
                ) : (
                  <div className="cart-drawer__wa-disabled">
                    Esta ubicación no tiene WhatsApp configurado.
                    Contacta al negocio directamente.
                  </div>
                )}
              </div>
            )}
          </aside>
        </>
      )}

      {/* ── Modal de confirmación ── */}
      {confirmOpen && (
        <ConfirmOrderModal
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmAndSend}
          submitting={submitting}
          error={submitError}
        />
      )}
    </>
  );
}
