import { Icon } from "@/components/ui/Icon";

const FEATURES = [
  {
    icon: "inventory_2",
    title: "Gestión de Productos",
    description:
      "Catálogo completo con categorías, precios, costos e imágenes. Organiza tu inventario por categorías con colores e iconos personalizados.",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.08)",
  },
  {
    icon: "swap_horiz",
    title: "Movimientos de Stock",
    description:
      "Registra entradas, salidas y ajustes en tiempo real. Cada movimiento guarda stock anterior, nuevo, costos y documentos de referencia.",
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.08)",
  },
  {
    icon: "warehouse",
    title: "Multi-almacén",
    description:
      "Gestiona múltiples ubicaciones por organización. Consulta stock por producto y ubicación, y realiza traspasos entre almacenes.",
    color: "#2563eb",
    bgColor: "rgba(37, 99, 235, 0.08)",
  },
  {
    icon: "local_shipping",
    title: "Proveedores",
    description:
      "Directorio completo de proveedores con contacto, teléfono, email y notas. Vincula compras directamente a cada proveedor.",
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.08)",
  },
  {
    icon: "admin_panel_settings",
    title: "Roles y Permisos",
    description:
      "Sistema granular de permisos por módulo. Define qué puede ver, crear, editar o eliminar cada rol dentro de tu organización.",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.08)",
  },
  {
    icon: "notifications_active",
    title: "Alertas de Stock Mínimo",
    description:
      "Configura el stock mínimo por producto y recibe alertas automáticas. Decide si permites stock negativo y personaliza las notificaciones.",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.08)",
  },
];

export function Features() {
  return (
    <section className="features section" id="features">
      <div className="container">
        <div className="features__header">
          <span className="section-label">Características</span>
          <h2 className="section-title">
            Todo lo que necesitas para{" "}
            <span className="gradient-text">gestionar tu inventario</span>
          </h2>
          <p className="section-subtitle">
            Módulos diseñados para cubrir cada aspecto de tu operación, desde el
            catálogo hasta la auditoría.
          </p>
        </div>

        <div className="features__grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div
                className="feature-card__icon"
                style={{ background: feature.bgColor }}
              >
                <span style={{ color: feature.color }}>
                  <Icon name={feature.icon} />
                </span>
              </div>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__desc">{feature.description}</p>
              <a className="feature-card__link" href="#">
                Saber más
                <Icon name="arrow_forward" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
