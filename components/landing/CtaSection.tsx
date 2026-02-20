import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const PLANS = [
  {
    name: "Starter",
    price: "Gratis",
    period: "para siempre",
    description: "Perfecto para emprendedores",
    features: [
      "Hasta 100 productos",
      "1 ubicación",
      "1 usuario",
      "Movimientos de stock",
      "Alertas de stock mínimo",
      "Soporte por email",
    ],
    highlighted: false,
    cta: "Comenzar Gratis",
  },
  {
    name: "Profesional",
    price: "$29",
    period: "/mes",
    description: "Para negocios en crecimiento",
    features: [
      "Productos ilimitados",
      "Multi-almacén",
      "Hasta 10 usuarios con roles",
      "Proveedores y categorías",
      "Reportes y auditoría",
      "Login con Google",
      "Configuración avanzada",
      "Soporte prioritario",
    ],
    highlighted: true,
    cta: "Iniciar Prueba Gratis",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "a medida",
    description: "Para operaciones a gran escala",
    features: [
      "Todo de Profesional",
      "Usuarios ilimitados",
      "Multi-organización",
      "API para integraciones",
      "Onboarding dedicado",
      "SLA garantizado",
    ],
    highlighted: false,
    cta: "Contactar Ventas",
  },
];

export function CtaSection() {
  return (
    <>
      <section className="pricing section" id="cta">
        <div className="container">
          <div className="pricing__header">
            <span className="section-label">Precios</span>
            <h2 className="section-title">
              Un plan para cada{" "}
              <span className="gradient-text">etapa de tu negocio</span>
            </h2>
            <p className="section-subtitle">
              Sin contratos. Sin sorpresas. Cancela cuando quieras.
            </p>
          </div>

          <div className="pricing__grid">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`pricing-card ${plan.highlighted ? "highlighted" : ""}`}
              >
                {plan.highlighted && (
                  <div className="pricing-card__badge">Más Popular</div>
                )}
                <h3 className="pricing-card__name">{plan.name}</h3>
                <p className="pricing-card__desc">{plan.description}</p>
                <div className="pricing-card__price">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <ul className="pricing-card__features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Icon name="check_circle" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`pricing-card__btn ${plan.highlighted ? "primary" : ""}`}
                >
                  {plan.cta}
                  <Icon name="arrow_forward" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta section">
        <div className="container">
          <div className="final-cta__box">
            <div className="final-cta__glow" />
            <h2 className="final-cta__title">
              ¿Listo para transformar tu{" "}
              <span className="gradient-text">gestión de inventario?</span>
            </h2>
            <p className="final-cta__desc">
              Únete a cientos de empresas que ya optimizaron sus operaciones con
              Strova. Empieza gratis hoy, sin compromiso.
            </p>
            <div className="final-cta__actions">
              <Link href="/login" className="btn-primary btn-large">
                Crear Cuenta Gratis
                <Icon name="rocket_launch" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
