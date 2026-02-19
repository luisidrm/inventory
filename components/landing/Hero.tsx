"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const STATS = [
  { value: "99.9%", label: "Uptime" },
  { value: "50K+", label: "Productos gestionados" },
  { value: "3x", label: "Más eficiencia" },
  { value: "24/7", label: "Soporte" },
];

function scrollToFeatures() {
  const el = document.getElementById("features");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg">
        <div className="hero__grid" />
        <div className="hero__glow hero__glow--1" />
        <div className="hero__glow hero__glow--2" />
      </div>

      <div className="hero__container container">
        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            <span>Multi-almacén, proveedores, movimientos en tiempo real</span>
            <Icon name="arrow_forward" />
          </div>

          <h1 className="hero__title">
            Gestión de inventario
            <span className="hero__title-gradient"> simple y poderosa</span>
            {" "}para tu empresa
          </h1>

          <p className="hero__subtitle">
            Controla productos, proveedores, ubicaciones y movimientos de stock
            desde una sola plataforma. Toma decisiones con datos reales y nunca
            pierdas una venta por falta de inventario.
          </p>

          <div className="hero__actions">
            <Link href="/login" className="btn-primary btn-hero">
              Comenzar Gratis
              <Icon name="rocket_launch" />
            </Link>
            <button type="button" className="btn-outline" onClick={scrollToFeatures}>
              <Icon name="play_circle" />
              Ver Características
            </button>
          </div>

          <div className="hero__trust">
            <div className="hero__trust-check">
              <Icon name="check_circle" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="hero__trust-check">
              <Icon name="check_circle" />
              <span>Setup en 5 minutos</span>
            </div>
            <div className="hero__trust-check">
              <Icon name="check_circle" />
              <span>Soporte incluido</span>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__dashboard">
            <div className="dashboard-header">
              <div className="dashboard-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="dashboard-title">InventoryPro — Dashboard</span>
            </div>
            <div className="dashboard-body">
              <div className="dashboard-sidebar">
                <div className="sidebar-item active">
                  <Icon name="dashboard" />
                  <span>Dashboard</span>
                </div>
                <div className="sidebar-item">
                  <Icon name="inventory" />
                  <span>Productos</span>
                </div>
                <div className="sidebar-item">
                  <Icon name="swap_horiz" />
                  <span>Movimientos</span>
                </div>
                <div className="sidebar-item">
                  <Icon name="local_shipping" />
                  <span>Proveedores</span>
                </div>
                <div className="sidebar-item">
                  <Icon name="warehouse" />
                  <span>Ubicaciones</span>
                </div>
              </div>
              <div className="dashboard-content">
                <div className="stat-cards">
                  <div className="stat-card">
                    <span className="stat-icon stat-icon--purple">
                      <Icon name="inventory_2" />
                    </span>
                    <div>
                      <span className="stat-value">2,847</span>
                      <span className="stat-label">Productos</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon stat-icon--green">
                      <Icon name="trending_up" />
                    </span>
                    <div>
                      <span className="stat-value">+23%</span>
                      <span className="stat-label">Entradas</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon stat-icon--amber">
                      <Icon name="warning" />
                    </span>
                    <div>
                      <span className="stat-value">12</span>
                      <span className="stat-label">Stock bajo</span>
                    </div>
                  </div>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    <div className="bar" style={{ height: "40%" }} />
                    <div className="bar" style={{ height: "65%" }} />
                    <div className="bar" style={{ height: "45%" }} />
                    <div className="bar" style={{ height: "80%" }} />
                    <div className="bar" style={{ height: "55%" }} />
                    <div className="bar" style={{ height: "90%" }} />
                    <div className="bar" style={{ height: "70%" }} />
                    <div className="bar active" style={{ height: "85%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero__float-card hero__float-card--1">
            <Icon name="check_circle" className="fc-icon fc-icon--green" />
            <div>
              <strong>Movimiento #1284</strong>
              <span>Entrada registrada con éxito</span>
            </div>
          </div>

          <div className="hero__float-card hero__float-card--2">
            <Icon name="notifications_active" className="fc-icon fc-icon--amber" />
            <div>
              <strong>Alerta de stock mínimo</strong>
              <span>Teclado Logitech — Quedan 3 uds.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__stats container">
        {STATS.map((stat) => (
          <div key={stat.label} className="hero__stat">
            <span className="hero__stat-value">{stat.value}</span>
            <span className="hero__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
