"use client";

import {
  StatCard,
  LineChartCard,
  ComposedChartCard,
  PieChartCard,
  ListCard,
  theme,
} from "@/components/dashboard";

// ─── KPIs ────────────────────────────────────────────────────────────────────
const DASHBOARD_KPIS = [
  { label: "Total Productos", value: "1,284", icon: "inventory_2", trend: "+12% vs mes pasado", trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
  { label: "Valor Inventario", value: "$45,200", icon: "payments", trend: "+5.4% vs mes pasado", trendUp: true, iconBg: "#F0FDF4", iconColor: theme.success },
  { label: "Stock Bajo", value: "18", icon: "warning", trend: "-2 desde ayer", trendUp: false, iconBg: "#FEF2F2", iconColor: theme.error },
  { label: "Órdenes Semanales", value: "156", icon: "shopping_cart", trend: "+22% vs mes pasado", trendUp: true, iconBg: "#EEF2FF", iconColor: theme.accent },
];

// ─── Gráficos exclusivos del panel (no usados en otras vistas) ─────────────────
const FLOW_DATA = [
  { label: "Lun", value: 45 }, { label: "Mar", value: 52 }, { label: "Mié", value: 48 },
  { label: "Jue", value: 70 }, { label: "Vie", value: 65 }, { label: "Sáb", value: 85 }, { label: "Dom", value: 92 },
];

const CATEGORY_PIE = [
  { name: "Electrónica", value: 40 }, { name: "Hogar", value: 25 }, { name: "Oficina", value: 20 }, { name: "Otros", value: 15 },
];

/** Evolución del valor del inventario (solo dashboard) */
const EVOLUCION_VALOR = [
  { label: "Sep", value: 38 }, { label: "Oct", value: 41 }, { label: "Nov", value: 42 },
  { label: "Dic", value: 44 }, { label: "Ene", value: 43 }, { label: "Feb", value: 45 },
];

/** Estado del stock: en rango / bajo / crítico (solo dashboard) */
const ESTADO_STOCK_PIE = [
  { name: "En rango", value: 72 }, { name: "Bajo", value: 18 }, { name: "Crítico", value: 10 },
];

/** Entradas vs Salidas por día (solo dashboard): barras = entradas, línea = salidas */
const ENTRADAS_SALIDAS = [
  { label: "Lun", value: 120, lineValue: 95 }, { label: "Mar", value: 145, lineValue: 110 },
  { label: "Mié", value: 98, lineValue: 130 }, { label: "Jue", value: 165, lineValue: 140 },
  { label: "Vie", value: 132, lineValue: 125 }, { label: "Sáb", value: 88, lineValue: 70 }, { label: "Dom", value: 55, lineValue: 48 },
];

/** Listas pequeñas (solo dashboard) */
const LISTA_PRODUCTOS_MAS_MOVIDOS: { primary: string; secondary?: string }[] = [
  { primary: "Monitor 24\"", secondary: "340 mov. · Últimos 30 días" },
  { primary: "Teclado MX Keys", secondary: "285 mov." },
  { primary: "Mouse Logitech MX", secondary: "260 mov." },
  { primary: "USB 32GB", secondary: "198 mov." },
  { primary: "Hub USB-C", secondary: "165 mov." },
];

const LISTA_STOCK_BAJO: { primary: string; secondary?: string }[] = [
  { primary: "Pilas AA", secondary: "3 ud · Mín. 10" },
  { primary: "Cable HDMI", secondary: "5 ud · Mín. 12" },
  { primary: "Disco SSD 500GB", secondary: "2 ud · Crítico" },
  { primary: "Memoria 8GB", secondary: "4 ud · Mín. 8" },
  { primary: "Adaptador USB", secondary: "6 ud · Mín. 15" },
];

const LISTA_ULTIMOS_MOVIMIENTOS: { primary: string; secondary?: string }[] = [
  { primary: "Entrada · Monitor 24\"", secondary: "Hace 15 min" },
  { primary: "Salida · Teclado MX", secondary: "Hace 1 h" },
  { primary: "Ajuste · USB 32GB", secondary: "Hace 2 h" },
  { primary: "Entrada · Hub USB-C", secondary: "Hace 3 h" },
  { primary: "Salida · Mouse Logi", secondary: "Hace 4 h" },
];

const LISTA_UBICACIONES_VALOR: { primary: string; secondary?: string }[] = [
  { primary: "Almacén Central", secondary: "$22k" },
  { primary: "Sucursal Norte", secondary: "$12k" },
  { primary: "Sucursal Sur", secondary: "$8k" },
  { primary: "Showroom", secondary: "$3k" },
];

const LISTA_PRODUCTOS_RECIENTES: { primary: string; secondary?: string }[] = [
  { primary: "Monitor 24\"", secondary: "Añadido hace 2 días" },
  { primary: "Webcam HD", secondary: "Añadido hace 5 días" },
  { primary: "Base portátil", secondary: "Añadido hace 1 semana" },
  { primary: "Cargador USB-C", secondary: "Añadido hace 1 semana" },
  { primary: "Funda laptop", secondary: "Añadido hace 2 semanas" },
];

/** Tendencia de alertas (solo dashboard) */
const ALERTAS_SEMANA = [
  { label: "Lun", value: 4 }, { label: "Mar", value: 2 }, { label: "Mié", value: 5 }, { label: "Jue", value: 3 },
  { label: "Vie", value: 1 }, { label: "Sáb", value: 0 }, { label: "Dom", value: 2 },
];

export default function DashboardPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: "100%",
        overflowY: "auto",
        paddingBottom: 32,
        boxSizing: "border-box",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4, color: theme.primaryText }}>
          Panel de Control
        </h1>
        <p style={{ color: theme.secondaryText, fontSize: "0.9rem" }}>
          Bienvenido de nuevo. Resumen general del inventario. Desplázate para ver listas y gráficos.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, width: "100%" }}>
        {DASHBOARD_KPIS.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Primera fila: Flujo + Categorías */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: 16, width: "100%" }}>
        <LineChartCard
          title="Flujo de Inventario"
          subtitle="Entradas vs salidas (últimos 7 días)"
          data={FLOW_DATA}
          height={280}
        />
        <PieChartCard title="Categorías Populares" data={CATEGORY_PIE} height={280} />
      </section>

      {/* Segunda fila: Evolución valor + Estado stock */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: 16, width: "100%" }}>
        <LineChartCard
          title="Evolución del valor del inventario"
          subtitle="Últimos 6 meses (miles $)"
          data={EVOLUCION_VALOR}
          height={280}
          filled={false}
        />
        <PieChartCard
          title="Estado del stock (En rango / Bajo / Crítico)"
          data={ESTADO_STOCK_PIE}
          height={280}
          colors={[theme.success, "#F59E0B", theme.error]}
        />
      </section>

      {/* Listas pequeñas con Ver más — ocupan todo el ancho */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: 16, width: "100%" }}>
        <ListCard
          title="Productos con más movimientos"
          items={LISTA_PRODUCTOS_MAS_MOVIDOS}
          href="/dashboard/movements"
          icon="trending_up"
          maxItems={5}
        />
        <ListCard
          title="Productos con stock bajo"
          items={LISTA_STOCK_BAJO}
          href="/dashboard/inventory"
          icon="warning"
          maxItems={5}
        />
        <ListCard
          title="Últimos movimientos"
          items={LISTA_ULTIMOS_MOVIMIENTOS}
          href="/dashboard/movements"
          icon="swap_horiz"
          maxItems={5}
        />
      </section>

      {/* Entradas vs Salidas + Lista ubicaciones */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: 16, width: "100%" }}>
        <ComposedChartCard
          title="Entradas vs Salidas por día"
          subtitle="Barras: entradas · Línea: salidas"
          data={ENTRADAS_SALIDAS}
          height={280}
          lineName="Salidas"
          barColor={theme.accent}
          lineColor={theme.error}
        />
        <ListCard
          title="Valor por ubicación"
          items={LISTA_UBICACIONES_VALOR}
          href="/dashboard/inventory"
          icon="location_on"
          maxItems={4}
        />
      </section>

      {/* Productos recientes + Alertas */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: 16, width: "100%" }}>
        <ListCard
          title="Productos añadidos recientemente"
          items={LISTA_PRODUCTOS_RECIENTES}
          href="/dashboard/products"
          icon="inventory_2"
          maxItems={5}
        />
        <LineChartCard
          title="Alertas de stock bajo por día"
          subtitle="Última semana"
          data={ALERTAS_SEMANA}
          height={280}
          color={theme.error}
          filled
        />
      </section>
    </div>
  );
}
