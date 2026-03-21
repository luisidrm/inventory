"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  useGetGroupedSettingsQuery,
  useGetMySubscriptionQuery,
  useUpdateGroupedSettingsMutation,
} from "./_service/settingsApi";
import "../products/products-modal.css";
import "./settings.css";
import Switch from "@/components/Switch";
import { formatPlanLimit } from "@/lib/plan-utils";
import type { MySubscriptionDto, SubscriptionStatus } from "@/lib/dashboard-types";

type SettingsTab = "general" | "subscription";

function formatSubscriptionDate(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function subscriptionStatusBadge(status: SubscriptionStatus): { className: string; label: string } {
  switch (status) {
    case "active":
      return { className: "sub-badge sub-badge--active", label: "Activa" };
    case "pending":
      return { className: "sub-badge sub-badge--pending", label: "Pendiente de aprobación" };
    case "expired":
      return { className: "sub-badge sub-badge--expired", label: "Vencida" };
    case "cancelled":
      return { className: "sub-badge sub-badge--cancelled", label: "Cancelada" };
    default:
      return { className: "sub-badge sub-badge--pending", label: "Pendiente de aprobación" };
  }
}

function billingCycleLabel(cycle: MySubscriptionDto["billingCycle"]): string {
  return cycle === "annual" ? "Anual" : "Mensual";
}

function SubscriptionPanel({
  subscription,
  isLoading,
  isError,
  onRetry,
}: {
  subscription: MySubscriptionDto | null | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="settings-subscription-state">
        <div className="dt-state__spinner" style={{ margin: "0 auto 16px" }} />
        <span>Cargando suscripción…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="settings-subscription-state">
        <Icon name="error_outline" />
        <p>No se pudo cargar la suscripción.</p>
        <button type="button" className="settings-subscription-retry" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="settings-subscription-state">
        <Icon name="info_outline" />
        <p>No hay información de suscripción disponible.</p>
      </div>
    );
  }

  const sub = subscription;
  const badge = subscriptionStatusBadge(sub.status);
  const daysLow = sub.daysRemaining >= 0 && sub.daysRemaining < 15;
  const daysNegative = sub.daysRemaining < 0;

  return (
    <>
      {sub.status === "pending" ? (
        <div className="settings-subscription-banner settings-subscription-banner--info" role="status">
          <Icon name="hourglass_empty" />
          <span>
            Tu solicitud de suscripción está siendo revisada. Te notificaremos cuando sea aprobada.
          </span>
        </div>
      ) : null}

      {sub.status === "expired" ? (
        <div className="settings-subscription-banner settings-subscription-banner--warning" role="alert">
          <Icon name="warning_amber" />
          <span>
            Tu suscripción ha vencido. Tu organización está inactiva. Contacta al administrador para renovar.
          </span>
        </div>
      ) : null}

      <section className="settings-subscription-card">
        <div className="settings-subscription-card__head">
          <h2 className="settings-subscription-card__plan">{sub.planName}</h2>
          <span className={badge.className}>{badge.label}</span>
        </div>

        <div className="settings-subscription-grid">
          <div className="settings-subscription-field">
            <label>Ciclo de facturación</label>
            <p>{billingCycleLabel(sub.billingCycle)}</p>
          </div>
          <div className="settings-subscription-field">
            <label>Fecha de inicio</label>
            <p>{formatSubscriptionDate(sub.startDate)}</p>
          </div>
          <div className="settings-subscription-field">
            <label>Fecha de vencimiento</label>
            <p>{formatSubscriptionDate(sub.endDate)}</p>
          </div>
          <div className="settings-subscription-field">
            <label>Días restantes</label>
            <p
              className={
                daysNegative
                  ? "settings-subscription-days--expired"
                  : daysLow
                    ? "settings-subscription-days--warn"
                    : undefined
              }
            >
              {sub.daysRemaining} días
            </p>
          </div>
          <div className="settings-subscription-field settings-subscription-field--limits">
            <label>Límites del plan</label>
            <div className="settings-subscription-limits">
              <span>Productos: {formatPlanLimit(sub.productsLimit)}</span>
              <span>Usuarios: {formatPlanLimit(sub.usersLimit)}</span>
              <span>Ubicaciones: {formatPlanLimit(sub.locationsLimit)}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saved, setSaved] = useState(false);
  const [inventory, setInventory] = useState({
    roundingDecimals: 2,
    priceRoundingDecimals: 2,
    allowNegativeStock: false,
    defaultUnitOfMeasure: "unit",
    defaultMinimumStock: 0,
  });
  const [company, setCompany] = useState({ name: "", taxId: "" });
  const [notifications, setNotifications] = useState({
    alertOnLowStock: true,
    lowStockRecipients: "",
  });

  const { data, isLoading, refetch } = useGetGroupedSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateGroupedSettingsMutation();
  const {
    data: subscription,
    isLoading: subLoading,
    isError: subError,
    refetch: refetchSub,
  } = useGetMySubscriptionQuery(undefined, { skip: activeTab !== "subscription" });

  useEffect(() => {
    if (!data) return;
    if (data.inventory) {
      setInventory({
        roundingDecimals: data.inventory.roundingDecimals ?? 2,
        priceRoundingDecimals: data.inventory.priceRoundingDecimals ?? 2,
        allowNegativeStock: data.inventory.allowNegativeStock ?? false,
        defaultUnitOfMeasure: data.inventory.defaultUnitOfMeasure ?? "unit",
        defaultMinimumStock: data.inventory.defaultMinimumStock ?? 0,
      });
    }
    if (data.company) setCompany(data.company);
    if (data.notifications) setNotifications(data.notifications);
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSettings({
        inventory,
        company,
        notifications,
      }).unwrap();
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error handled by mutation
    }
  };

  const generalLoading = activeTab === "general" && isLoading;

  return (
    <div className="dt-card">
      <div className="dt-header">
        <h1 className="dt-header__title">
          <Icon name="settings" />
          Configuracion
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
          Ajustes generales del sistema
        </p>
      </div>

      <div className="settings-tabs" role="tablist" aria-label="Secciones de configuración">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "general"}
          className={`settings-tab ${activeTab === "general" ? "settings-tab--active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "subscription"}
          className={`settings-tab ${activeTab === "subscription" ? "settings-tab--active" : ""}`}
          onClick={() => setActiveTab("subscription")}
        >
          Suscripción
        </button>
      </div>

      {activeTab === "general" ? (
        generalLoading ? (
          <div className="settings-subscription-state" style={{ marginTop: 24 }}>
            <div className="dt-state__spinner" style={{ margin: "0 auto 16px" }} />
            <span>Cargando configuracion...</span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "row", gap: 24, padding: 24, flexWrap: "wrap" }}>
              <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, flex: "1 1 280px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(79,110,247,0.12)",
                      color: "#4f6ef7",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="inventory" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>Inventario</h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Control de stock y unidades</p>
                  </div>
                </div>
                <div className="modal-form-grid">
                  <div className="modal-field">
                    <label>Decimales de redondeo</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={inventory.roundingDecimals}
                      onChange={(e) =>
                        setInventory((s) => ({ ...s, roundingDecimals: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="modal-field">
                    <label>Decimales de precio</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={inventory.priceRoundingDecimals}
                      onChange={(e) =>
                        setInventory((s) => ({ ...s, priceRoundingDecimals: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="modal-field field-full">
                    <label>Unidad de medida por defecto</label>
                    <input
                      type="text"
                      value={inventory.defaultUnitOfMeasure}
                      onChange={(e) =>
                        setInventory((s) => ({ ...s, defaultUnitOfMeasure: e.target.value }))
                      }
                    />
                  </div>
                  <div className="modal-field">
                    <label>Stock mínimo (global)</label>
                    <input
                      type="number"
                      min={0}
                      value={inventory.defaultMinimumStock ?? 0}
                      onChange={(e) =>
                        setInventory((s) => ({ ...s, defaultMinimumStock: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="modal-field field-full modal-toggle">
                    <Switch
                      checked={inventory.allowNegativeStock}
                      onChange={(checked) =>
                        setInventory((s) => ({ ...s, allowNegativeStock: checked }))
                      }
                    />
                    <label>Permitir stock negativo</label>
                  </div>
                </div>
              </section>

              <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, flex: "1 1 280px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(16,185,129,0.12)",
                      color: "#10b981",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="business" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>Empresa</h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Datos fiscales</p>
                  </div>
                </div>
                <div className="modal-form-grid">
                  <div className="modal-field field-full">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => setCompany((s) => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div className="modal-field field-full">
                    <label>Tax ID / RIF</label>
                    <input
                      type="text"
                      value={company.taxId}
                      onChange={(e) => setCompany((s) => ({ ...s, taxId: e.target.value }))}
                    />
                  </div>
                </div>
              </section>

              <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, flex: "1 1 280px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(245,158,11,0.12)",
                      color: "#f59e0b",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="notifications" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>Notificaciones</h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Alertas y destinatarios</p>
                  </div>
                </div>
                <div className="modal-form-grid">
                  <div className="modal-field field-full modal-toggle">
                    <Switch
                      checked={notifications.alertOnLowStock}
                      onChange={(checked) =>
                        setNotifications((s) => ({ ...s, alertOnLowStock: checked }))
                      }
                    />
                    <label>Alertar por stock bajo</label>
                  </div>
                  <div className="modal-field field-full">
                    <label>Destinatarios (emails separados por coma)</label>
                    <input
                      type="text"
                      value={notifications.lowStockRecipients}
                      onChange={(e) =>
                        setNotifications((s) => ({ ...s, lowStockRecipients: e.target.value }))
                      }
                      placeholder="email1, email2..."
                    />
                  </div>
                </div>
              </section>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8, margin: 20 }}>
              {saved && (
                <span style={{ color: "#10b981", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="check_circle" />
                  Guardado
                </span>
              )}
              <button
                type="button"
                className="modal-btn modal-btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        )
      ) : (
        <div style={{ paddingTop: 16 }}>
          <SubscriptionPanel
            subscription={subscription}
            isLoading={subLoading}
            isError={subError}
            onRetry={() => void refetchSub()}
          />
        </div>
      )}
    </div>
  );
}
