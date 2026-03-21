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
import type { MySubscriptionDto, SubscriptionStatus } from "@/lib/dashboard-types";

type SettingsTab = "general" | "subscription";

function formatSubscriptionDate(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function subscriptionStatusBadge(status: SubscriptionStatus): { className: string; label: string } {
  const base =
    "inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide ring-1";
  switch (status) {
    case "active":
      return {
        className: `${base} bg-emerald-100 text-emerald-800 ring-emerald-200/70`,
        label: "Activa",
      };
    case "pending":
      return {
        className: `${base} bg-amber-100 text-amber-950 ring-amber-200/80`,
        label: "Pendiente de aprobación",
      };
    case "expired":
      return {
        className: `${base} bg-red-100 text-red-900 ring-red-200/70`,
        label: "Vencida",
      };
    case "cancelled":
      return {
        className: `${base} bg-slate-200/80 text-slate-700 ring-slate-300/80`,
        label: "Cancelada",
      };
    default:
      return {
        className: `${base} bg-amber-100 text-amber-950 ring-amber-200/80`,
        label: "Pendiente de aprobación",
      };
  }
}

function planHeaderSurfaceClass(planName: string): string {
  const n = planName.toLowerCase();
  if (n.includes("enterprise")) return "bg-violet-50/90";
  if (n.includes("pro")) return "bg-indigo-50/80";
  if (n.includes("free")) return "bg-slate-50/95";
  return "bg-slate-50/90";
}

function formatLimitStat(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value === -1) return "∞";
  return String(value);
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
      <div className="flex max-w-2xl flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/90 bg-white px-8 py-14 text-center text-slate-500 shadow-sm">
        <div className="dt-state__spinner" />
        <span className="text-sm font-medium">Cargando suscripción…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex max-w-2xl flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/90 bg-white px-8 py-14 text-center text-slate-600 shadow-sm">
        <div className="text-4xl leading-none text-slate-400" aria-hidden>
          <Icon name="error_outline" />
        </div>
        <p className="text-sm">No se pudo cargar la suscripción.</p>
        <button
          type="button"
          className="mt-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={onRetry}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex max-w-2xl flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/90 bg-white px-8 py-14 text-center text-slate-600 shadow-sm">
        <div className="text-4xl leading-none text-slate-400" aria-hidden>
          <Icon name="info_outline" />
        </div>
        <p className="text-sm">No hay información de suscripción disponible.</p>
      </div>
    );
  }

  const sub = subscription;
  const badge = subscriptionStatusBadge(sub.status);
  const daysLow = sub.daysRemaining >= 0 && sub.daysRemaining < 15;
  const daysNegative = sub.daysRemaining < 0;

  return (
    <article className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/5">
      <header
        className={`flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${planHeaderSurfaceClass(sub.planName)}`}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{sub.planName}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ciclo de facturación:{" "}
            <span className="font-medium text-slate-800">{billingCycleLabel(sub.billingCycle)}</span>
          </p>
        </div>
        <div className="flex sm:justify-end">
          <span className={badge.className}>{badge.label}</span>
        </div>
      </header>

      <div className="grid gap-0 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="space-y-6 px-6 py-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vigencia</h3>
            <div className="mt-4 space-y-5 border-t border-slate-100 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Fecha de inicio</p>
                <p className="mt-1 text-base font-medium text-slate-900">{formatSubscriptionDate(sub.startDate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Fecha de vencimiento</p>
                <p className="mt-1 text-base font-medium text-slate-900">{formatSubscriptionDate(sub.endDate)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Días restantes</p>
                <p
                  className={`mt-1 text-lg font-semibold tabular-nums ${
                    daysNegative ? "text-red-600" : daysLow ? "text-orange-600" : "text-slate-900"
                  }`}
                >
                  {sub.daysRemaining} días
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Límites del plan</h3>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3.5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl text-slate-600 shadow-sm ring-1 ring-slate-200/60">
                <Icon name="inventory" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Productos</p>
                <p className="text-2xl font-bold leading-tight tabular-nums text-slate-900">
                  {formatLimitStat(sub.productsLimit)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3.5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl text-slate-600 shadow-sm ring-1 ring-slate-200/60">
                <Icon name="people" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Usuarios</p>
                <p className="text-2xl font-bold leading-tight tabular-nums text-slate-900">
                  {formatLimitStat(sub.usersLimit)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3.5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl text-slate-600 shadow-sm ring-1 ring-slate-200/60">
                <Icon name="place" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Ubicaciones</p>
                <p className="text-2xl font-bold leading-tight tabular-nums text-slate-900">
                  {formatLimitStat(sub.locationsLimit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sub.status === "pending" ? (
        <footer
          className="flex items-start gap-3 border-t border-amber-200/80 bg-amber-50 px-6 py-4 text-sm leading-relaxed text-amber-950"
          role="status"
        >
          <span className="shrink-0 text-xl leading-none text-amber-700" aria-hidden>
            <Icon name="hourglass_empty" />
          </span>
          <span>
            Tu solicitud de suscripción está siendo revisada. Te notificaremos cuando sea aprobada.
          </span>
        </footer>
      ) : null}

      {sub.status === "expired" ? (
        <footer
          className="flex items-start gap-3 border-t border-red-200/80 bg-red-50 px-6 py-4 text-sm leading-relaxed text-red-950"
          role="alert"
        >
          <span className="shrink-0 text-xl leading-none text-red-700" aria-hidden>
            <Icon name="warning_amber" />
          </span>
          <span>
            Tu suscripción ha vencido. Tu organización está inactiva. Contacta al administrador para renovar.
          </span>
        </footer>
      ) : null}
    </article>
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
        <div className="px-6 pb-10 pt-4 lg:px-8">
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
