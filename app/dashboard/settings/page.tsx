"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useGetGroupedSettingsQuery, useUpdateGroupedSettingsMutation } from "./_service/settingsApi";
import "../products/products-modal.css";
import Switch from "@/components/Switch";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [inventory, setInventory] = useState({
    roundingDecimals: 2,
    priceRoundingDecimals: 2,
    allowNegativeStock: false,
    defaultUnitOfMeasure: "unit",
  });
  const [company, setCompany] = useState({ name: "", taxId: "" });
  const [notifications, setNotifications] = useState({
    alertOnLowStock: true,
    lowStockRecipients: "",
  });

  const { data, isLoading } = useGetGroupedSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateGroupedSettingsMutation();

  useEffect(() => {
    if (data?.inventory) setInventory(data.inventory);
    if (data?.company) setCompany(data.company);
    if (data?.notifications) setNotifications(data.notifications);
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSettings({
        inventory,
        company,
        notifications,
      }).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="dt-card">
        <div className="dt-state">
          <div className="dt-state__spinner" />
          <span>Cargando configuracion...</span>
        </div>
      </div>
    );
  }

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

      <div style={{ display: "flex", flexDirection: "row", gap: 24, padding: 24 }}>
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
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

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
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

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8 , margin: 20}}>
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
    </div>
  );
}
