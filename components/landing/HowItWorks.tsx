import { Icon } from "@/components/ui/Icon";

const STEPS = [
  {
    number: "01",
    icon: "person_add",
    title: "Regístrate",
    description:
      "Crea tu cuenta en segundos con email o Google. Sin tarjeta de crédito, sin compromisos.",
  },
  {
    number: "02",
    icon: "business",
    title: "Configura tu organización",
    description:
      "Crea tu empresa, agrega ubicaciones (almacenes, bodegas, tiendas) y define roles para tu equipo.",
  },
  {
    number: "03",
    icon: "category",
    title: "Carga tu catálogo",
    description:
      "Agrega categorías, productos con precios y costos, y vincula proveedores. Todo organizado desde el inicio.",
  },
  {
    number: "04",
    icon: "trending_up",
    title: "Gestiona y crece",
    description:
      "Registra movimientos de stock, recibe alertas de mínimos y toma decisiones con reportes en tiempo real.",
  },
];

const BENEFITS = [
  { icon: "speed", value: "80%", label: "Menos errores de conteo manual" },
  { icon: "schedule", value: "5hrs", label: "Ahorro semanal en gestión" },
  { icon: "trending_down", value: "30%", label: "Menos exceso de inventario" },
  { icon: "visibility", value: "100%", label: "Visibilidad en tiempo real" },
];

export function HowItWorks() {
  return (
    <>
      <section className="how-it-works section" id="how-it-works">
        <div className="container">
          <div className="how-it-works__header">
            <span className="section-label">Cómo Funciona</span>
            <h2 className="section-title">
              Empieza en <span className="gradient-text">4 simples pasos</span>
            </h2>
            <p className="section-subtitle">
              De cero a productividad en minutos. Sin instalación, sin
              configuraciones complejas.
            </p>
          </div>

          <div className="how-it-works__steps">
            {STEPS.map((step) => (
              <div key={step.number} className="step-card">
                <div className="step-card__number">{step.number}</div>
                <div className="step-card__icon">
                  <Icon name={step.icon} />
                </div>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.description}</p>
              </div>
            ))}
            <div className="steps-connector" />
          </div>
        </div>
      </section>

      <section className="benefits section" id="benefits">
        <div className="container">
          <div className="benefits__header">
            <span className="section-label">Beneficios</span>
            <h2 className="section-title">
              Resultados que{" "}
              <span className="gradient-text">hablan por sí solos</span>
            </h2>
            <p className="section-subtitle">
              Empresas que migran a InventoryPro ven mejoras inmediatas en su
              operación diaria.
            </p>
          </div>

          <div className="benefits__grid">
            {BENEFITS.map((benefit) => (
              <div key={benefit.label} className="benefit-card">
                <div className="benefit-card__icon">
                  <Icon name={benefit.icon} />
                </div>
                <span className="benefit-card__value">{benefit.value}</span>
                <span className="benefit-card__label">{benefit.label}</span>
              </div>
            ))}
          </div>

          <div className="testimonial">
            <div className="testimonial__content">
              <Icon name="format_quote" className="testimonial__quote" />
              <p className="testimonial__text">
                &quot;Antes manejábamos el inventario en Excel y siempre teníamos
                errores de conteo. Con InventoryPro, ahora cada movimiento queda
                registrado, sabemos exactamente qué hay en cada almacén y las
                alertas de stock mínimo nos han salvado más de una vez.&quot;
              </p>
              <div className="testimonial__author">
                <div className="testimonial__avatar">MR</div>
                <div>
                  <strong>María Rodríguez</strong>
                  <span>
                    Gerente de Operaciones, LogiTech Solutions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
