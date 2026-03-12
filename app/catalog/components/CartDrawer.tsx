"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { removeItem, updateQuantity, clearCart } from "@/store/cartSlice";
import { getToken, getApiUrl } from "@/lib/auth-api";
import type { CreateSaleOrderRequest } from "@/lib/dashboard-types";

function formatPrice(v: number) {
  return `$${v.toFixed(2)}`;
}

function buildWaMessage(
  items: { name: string; quantity: number; unitPrice: number }[],
  locationName: string,
  folio?: string | null
): string {
  const lines = items
    .map((i) => `- ${i.name} x ${i.quantity} — ${formatPrice(i.unitPrice)} c/u`)
    .join("\n");
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  let msg = `Hola, quiero solicitar:\n\n${lines}\n\nTotal: ${formatPrice(total)}\nUbicación: ${locationName}`;
  if (folio) msg += `\nRef. orden: ${folio}`;
  return msg;
}

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart);
  const [open, setOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [orderFolio, setOrderFolio] = useState<string | null>(null);
  const [orderError, setOrderError] = useState("");

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const total = cart.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const isLoggedIn = Boolean(getToken());

  const waMessage = buildWaMessage(cart.items, cart.locationName, orderFolio);
  const waLink = cart.whatsAppContact
    ? `https://wa.me/${cart.whatsAppContact}?text=${encodeURIComponent(waMessage)}`
    : null;

  const handleRegister = async () => {
    if (!cart.locationId) return;
    setRegistering(true);
    setOrderError("");
    try {
      const token = getToken();
      const body: CreateSaleOrderRequest = {
        locationId: cart.locationId,
        contactId: null,
        notes: null,
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as { result?: { folio?: string; id?: number } };
      const order = data.result ?? {};
      setOrderFolio(order.folio ?? (order.id ? `#${order.id}` : "nueva"));
    } catch {
      setOrderError("No se pudo registrar la orden. Intenta de nuevo.");
    } finally {
      setRegistering(false);
    }
  };

  const handleClear = () => {
    dispatch(clearCart());
    setOrderFolio(null);
    setOrderError("");
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        type="button"
        className="cart-fab"
        onClick={() => setOpen(true)}
        aria-label={`Carrito (${itemCount} producto${itemCount !== 1 ? "s" : ""})`}
      >
        <Icon name="shopping_cart" />
        {itemCount > 0 && (
          <span className="cart-fab__badge">{itemCount > 99 ? "99+" : itemCount}</span>
        )}
      </button>

      {/* ── Backdrop + Drawer ── */}
      {open && (
        <>
          <div
            className="cart-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <aside className="cart-drawer" role="dialog" aria-label="Tu pedido">
            {/* Header */}
            <div className="cart-drawer__header">
              <span className="cart-drawer__title">
                <Icon name="shopping_cart" />
                Tu pedido
                {itemCount > 0 && ` (${itemCount})`}
              </span>
              {cart.items.length > 0 && (
                <button
                  type="button"
                  className="cart-drawer__clear"
                  onClick={handleClear}
                >
                  Vaciar
                </button>
              )}
              <button
                type="button"
                className="cart-drawer__close"
                onClick={() => setOpen(false)}
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
                      <img
                        src={item.imagenUrl}
                        alt={item.name}
                        className="cart-item__img"
                      />
                    ) : (
                      <div className="cart-item__img-placeholder">
                        <Icon name="inventory_2" />
                      </div>
                    )}

                    <div className="cart-item__info">
                      <div className="cart-item__name">{item.name}</div>
                      <div className="cart-item__price-unit">
                        {formatPrice(item.unitPrice)} c/u
                      </div>
                      <div className="cart-item__controls">
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity - 1,
                              })
                            )
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
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity + 1,
                              })
                            )
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
                  <span className="cart-drawer__total-value">
                    {formatPrice(total)}
                  </span>
                </div>

                {/* WhatsApp */}
                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cart-drawer__wa-btn"
                  >
                    <Icon name="chat" />
                    Enviar pedido por WhatsApp
                  </a>
                ) : (
                  <div className="cart-drawer__wa-disabled">
                    Esta ubicación no tiene WhatsApp configurado.
                    Contacta al negocio directamente.
                  </div>
                )}

                {/* Register in app */}
                {isLoggedIn && !orderFolio && (
                  <>
                    <button
                      type="button"
                      className="cart-drawer__register-btn"
                      onClick={handleRegister}
                      disabled={registering}
                    >
                      <Icon name={registering ? "hourglass_empty" : "receipt_long"} />
                      {registering ? "Registrando…" : "Registrar orden en la app"}
                    </button>
                    {orderError && (
                      <p className="cart-drawer__order-err">{orderError}</p>
                    )}
                  </>
                )}

                {orderFolio && (
                  <div className="cart-drawer__order-ok">
                    <Icon name="check_circle" />
                    Orden {orderFolio} registrada exitosamente
                  </div>
                )}
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
