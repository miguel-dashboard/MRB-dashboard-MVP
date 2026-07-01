import { useMemo, useState } from "react"
import "./index.css"

const API_ENDPOINT = "http://localhost:3001/api/recruit/applicants"
const WHATSAPP_NUMBER = "56978701650"
const WHATSAPP_MESSAGE =  
  "Hola, quiero postular con mi vehículo a operaciones disponibles de MR&B Recruit. ¿Me pueden orientar?"
const operations = [
  {
    name: "Chilexpress",
    detail:
      "Distribución, reparto urbano y apoyo operacional con foco en cumplimiento y cobertura.",
  },
  {
    name: "Brightcell",
    detail:
      "Servicios logísticos que requieren orden, comunicación y trazabilidad de cada asignación.",
  },
  {
    name: "Viña Concha y Toro",
    detail:
      "Apoyo para cargas planificadas, rutas coordinadas y transporte con estándares de cliente.",
  },
  {
    name: "Otros clientes",
    detail:
      "Nuevos requerimientos según temporada, zona, tipo de vehículo y disponibilidad operativa.",
  },
]

const vehicles = [
  {
    name: "Camionetas tipo Berlingo / Partner",
    use: "Última milla y reparto liviano",
  },
  {
    name: "Cargo box",
    use: "Mayor volumen con operación urbana",
  },
  {
    name: "Furgones",
    use: "Distribución y rutas multipunto",
  },
  {
    name: "Camiones 3/4",
    use: "Carga media y rutas planificadas",
  },
  {
    name: "Camiones cerrados",
    use: "Carga protegida y transporte dedicado",
  },
  {
    name: "Otros vehículos",
    use: "Evaluación caso a caso",
  },
]

const benefits = [
  {
    title: "Postulación ordenada",
    text:
      "Tus datos quedan estructurados para una revisión rápida por operación, comuna y tipo de vehículo.",
  },
  {
    title: "Evaluación logística real",
    text:
      "MR&B Recruit revisa compatibilidad con requerimientos vigentes, documentación y disponibilidad.",
  },
  {
    title: "Clientes activos",
    text:
      "Participa en procesos de captación para operaciones con demanda logística en desarrollo.",
  },
  {
    title: "Contacto claro",
    text:
      "Si existe compatibilidad, el equipo puede contactarte para coordinar próximos pasos.",
  },
]

const trustItems = [
  {
    title: "Operaciones activas",
    text: "Captación conectada a servicios logísticos reales.",
  },
  {
    title: "Evaluación por zona",
    text: "Analizamos comuna, disponibilidad y capacidad del vehículo.",
  },
  {
    title: "Proceso profesional",
    text: "Información clara, sin promesas de cupos automáticos.",
  },
]

const steps = [
  {
    number: "01",
    title: "Completa el formulario",
    text:
      "Ingresa datos de contacto, comuna, vehículo, disponibilidad y experiencia.",
  },
  {
    number: "02",
    title: "Revisamos compatibilidad",
    text:
      "Cruzamos tu perfil con operaciones, zonas y requerimientos vigentes.",
  },
  {
    number: "03",
    title: "Te contactamos",
    text:
      "Si hay una oportunidad compatible, coordinamos antecedentes y documentación.",
  },
  {
    number: "04",
    title: "Avanzamos a coordinación",
    text:
      "Se definen siguientes pasos para una eventual activación operacional.",
  },
]

const faqs = [
  {
    question: "¿La postulación asegura asignación inmediata?",
    answer:
      "No. La postulación permite ingresar tus datos para evaluación. La asignación depende de cupos, cliente, zona, documentación, vehículo y disponibilidad operacional.",
  },
  {
    question: "¿Puedo postular con un vehículo que no aparece en la lista?",
    answer:
      "Sí. Selecciona “Otros vehículos” y describe tu unidad en observaciones para que el equipo pueda revisarla caso a caso.",
  },
  {
    question: "¿Puedo elegir una operación específica?",
    answer:
      "Puedes indicar una operación de interés. La evaluación final dependerá de compatibilidad, cobertura, cliente y requerimientos vigentes.",
  },
  {
    question: "¿Qué experiencia debo detallar?",
    answer:
      "Indica experiencia en reparto, última milla, distribución, transporte de carga, rutas dedicadas, atención de clientes o manejo documental.",
  },
  {
    question: "¿Cómo me contactará MR&B?",
    answer:
      "El equipo puede contactarte por teléfono o WhatsApp usando los datos que ingreses en el formulario público.",
  },
]

const availabilityOptions = [
  { label: "Inmediata", value: "inmediata" },
  { label: "Durante esta semana", value: "esta_semana" },
  { label: "Durante este mes", value: "este_mes" },
]

const initialForm = {
  nombre: "",
  telefono: "",
  comuna: "",
  tipoVehiculo: "",
  operacion: "",
  disponibilidad: "",
  experiencia: "",
  observacion: "",
}

function SectionHeading({ eyebrow, title, text, align = "center", tone = "dark" }) {
  return (
    <div className={`section-heading section-heading--${align} section-heading--${tone}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}

function RecruitForm() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")
  const [step, setStep] = useState(1)

  const canSubmit = useMemo(
    () =>
      form.nombre.trim() &&
      form.telefono.trim() &&
      form.comuna.trim() &&
      form.tipoVehiculo &&
      form.operacion &&
      form.disponibilidad &&
      form.experiencia.trim(),
    [form],
  )

  const canContinue = useMemo(
    () =>
      form.nombre.trim() &&
      form.telefono.trim() &&
      form.comuna.trim(),
    [form],
  )

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSubmit) {
      setStatus("error")
      setMessage("Completa los campos obligatorios antes de enviar tu postulación.")
      return
    }

    setStatus("sending")
    setMessage("Enviando postulación...")

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          comuna: form.comuna.trim(),
          tipoVehiculo: form.tipoVehiculo,
          operacion: form.operacion,
          disponibilidad: form.disponibilidad,
          experiencia: form.experiencia.trim(),
          observacion: form.observacion.trim(),
        }),
      })

      if (!response.ok) throw new Error("No fue posible registrar la postulación.")

      setStatus("success")
      setMessage(
        "¡Postulación recibida! Revisaremos tu perfil según comuna, vehículo y disponibilidad. Si hay una operación compatible, te contactamos directamente por teléfono o WhatsApp."
      )
      setForm(initialForm)
      setStep(1)
    } catch (error) {
      setStatus("error")
      setMessage(
        "No pudimos registrar tu postulación en este momento. Por favor intenta nuevamente. Si el problema persiste, puedes escribirnos por WhatsApp y te ayudamos."
      )
    }
  }

  return (
    <form className="recruit-form" onSubmit={handleSubmit}>

      {/* PASO 1 — Siempre visible */}
      <div className="form-grid">
        <label>
          <span>Nombre completo *</span>
          <input
            name="nombre"
            value={form.nombre}
            onChange={updateField}
            placeholder="Ej: Juan Pérez"
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>Teléfono *</span>
          <input
            name="telefono"
            value={form.telefono}
            onChange={updateField}
            placeholder="Ej: +56912345678"
            autoComplete="tel"
            inputMode="tel"
            required
          />
        </label>

        <label>
          <span>Comuna *</span>
          <input
            name="comuna"
            value={form.comuna}
            onChange={updateField}
            placeholder="Ej: San Bernardo"
            autoComplete="address-level2"
            required
          />
        </label>
      </div>

      {/* Botón Continuar — solo visible en mobile cuando step === 1 */}
      {step === 1 && (
        <button
          type="button"
          className="button button-primary form-submit form-continue-mobile"
          onClick={() => setStep(2)}
          disabled={!canContinue}
        >
          Continuar →
        </button>
      )}

      {/* PASO 2 — En desktop siempre visible. En mobile solo si step === 2 */}
      <div className={`form-step-2 ${step === 2 ? "form-step-2--visible" : ""}`}>
        <div className="form-grid">
          <label>
            <span>Tipo de vehículo *</span>
            <select
              name="tipoVehiculo"
              value={form.tipoVehiculo}
              onChange={updateField}
              required
            >
              <option value="">Selecciona tu vehículo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.name} value={vehicle.name}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Operación de interés *</span>
            <select
              name="operacion"
              value={form.operacion}
              onChange={updateField}
              required
            >
              <option value="">Selecciona operación</option>
              {operations.map((operation) => (
                <option key={operation.name} value={operation.name}>
                  {operation.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Disponibilidad *</span>
            <select
              name="disponibilidad"
              value={form.disponibilidad}
              onChange={updateField}
              required
            >
              <option value="">Selecciona disponibilidad</option>
              {availabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span>Experiencia logística *</span>
          <textarea
            name="experiencia"
            value={form.experiencia}
            onChange={updateField}
            placeholder="Ej: 2 años en reparto urbano, última milla, rutas dedicadas o transporte de carga."
            rows="4"
            required
          />
        </label>

        <label>
          <span>Observación adicional</span>
          <textarea
            name="observacion"
            value={form.observacion}
            onChange={updateField}
            placeholder="Agrega detalles del vehículo, documentación, disponibilidad horaria o comentarios importantes."
            rows="4"
          />
        </label>

        {message && (
          <p className={`form-message form-message--${status}`} role="status">
            {message}
          </p>
        )}

        <button
          className="button button-primary form-submit"
          type="submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Enviando postulación..." : "Enviar postulación"}
        </button>
      </div>

    </form>
  )
}

function App() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE,
  )}`

  return (
    <div className="app" translate="no">
      <header className="hero" id="inicio">
        <nav className="nav shell" aria-label="Navegación principal">
          <a className="brand" href="#inicio" aria-label="MR&B Recruit inicio">
            <span className="brand-mark">MR&B</span>
            <span className="brand-text">
              <strong>MR&B Recruit</strong>
              <small>Captación logística</small>
            </span>
          </a>

          <div className="nav-actions">
            <a href="#operaciones">Operaciones</a>
            <a className="nav-cta" href="#postula">
              Postular
            </a>
          </div>
        </nav>

        <section className="hero-grid shell">
          <div className="hero-copy">
            <span className="eyebrow">MR&B Servicios Logísticos</span>
            <h1>Suma tu vehículo a operaciones logísticas reales</h1>
            <p>
              MR&B Recruit conecta transportistas y dueños de vehículos con
              oportunidades de reparto, distribución y transporte para operaciones
              activas.
            </p>

            <div className="hero-actions">
  <a className="button button-primary" href="#postula">
    Postular ahora
  </a>
  <a className="button button-secondary" href="#operaciones">
    Ver operaciones
  </a>
 </div>

<p className="hero-social-proof">
  ✓ Más de 40 transportistas ya postularon · 3 operaciones activas
</p>
</div>
          <aside className="hero-panel hero-panel-simple" aria-label="Postulación simple">
            <div className="panel-status">
              <span />
              Captación disponible
            </div>

            <h2>Postulación simple para transportistas</h2>
            <p>
              Completa tus datos y revisaremos compatibilidad según comuna,
              vehículo y disponibilidad.
            </p>

            <ul className="hero-checklist">
              <li>Vehículos comerciales</li>
              <li>Operaciones activas</li>
              <li>Contacto del equipo MR&B</li>
            </ul>
          </aside>
        </section>
      </header>

      <main>
  <section className="trust-bar shell" aria-label="Franja de confianza">
    {trustItems.map((item) => (
      <article key={item.title}>
        <strong>{item.title}</strong>
        <span>{item.text}</span>
      </article>
    ))}
  </section>

  {/* Operaciones visibles solo en mobile — justo después del hero */}
  <div className="shell">
    <div className="mobile-operations-strip">
      <strong>Operaciones con captación activa</strong>
      <p>Chilexpress · Brightcell · Viña Concha y Toro · Otros clientes</p>
      <span>Las oportunidades varían según zona, vehículo y disponibilidad.</span>
    </div>
  </div>


<section className="section form-section" id="postula">
  <div className="shell form-layout">
    <div className="form-copy">
      <SectionHeading
        eyebrow="Postulación"
        title="Postula tu vehículo a MR&B Recruit"
        text="Registra tus datos para evaluación. La postulación no garantiza asignación inmediata; permite iniciar una revisión operacional."
        align="left"
        tone="light"
      />

      <div className="assurance-card">
        <strong>¿Cómo funciona la postulación?</strong>
        <ul>
          <li>Revisamos tu perfil según comuna, vehículo y disponibilidad.</li>
          <li>Si hay una operación compatible, el equipo MR&B te contacta directamente.</li>
          <li>Tus datos quedan registrados para evaluación interna.</li>
        </ul>
      </div>
    </div>

    <RecruitForm />
  </div>
</section>

        <section className="section shell" id="beneficios">
          <SectionHeading
            eyebrow="Beneficios"
            title="Una postulación seria, clara y enfocada en operación"
            text="Entendemos que tu tiempo vale. Por eso el proceso es directo: postulas, revisamos tu perfil y te contactamos si hay compatibilidad."
          />

          <div className="cards-grid cards-grid--four">
            {benefits.map((benefit, index) => (
              <article className="info-card" key={benefit.title}>
                <span className="card-number">0{index + 1}</span>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-soft shell split-section" id="vehiculos">
          <SectionHeading
            eyebrow="Tipos de vehículos"
            title="Capacidad para última milla, distribución y rutas dedicadas"
            text="Selecciona el tipo de unidad que tienes. Si no aparece, postula como “Otros vehículos” y agrega el detalle en observaciones."
            align="left"
          />

          <div className="vehicle-grid">
            {vehicles.map((vehicle) => (
              <article className="vehicle-card" key={vehicle.name}>
                <span className="vehicle-icon">✓</span>
                <div>
                  <h3>{vehicle.name}</h3>
                  <p>{vehicle.use}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section operations-section" id="operaciones">
          <div className="shell">
            <SectionHeading
              eyebrow="Operaciones disponibles"
              title="Clientes y servicios sujetos a demanda operacional"
              text="Las oportunidades pueden variar según comuna, volumen, documentación, cliente, tipo de vehículo y disponibilidad."
              tone="light"
            />

            <div className="cards-grid cards-grid--four">
              {operations.map((operation) => (
                <article className="operation-card" key={operation.name}>
                  <span>Evaluación activa</span>
                  <h3>{operation.name}</h3>
                  <p>{operation.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shell" id="como-funciona">
          <SectionHeading
            eyebrow="Cómo funciona"
            title="Un proceso simple para iniciar la evaluación"
            text="Completa tus datos y el equipo MR&B podrá revisar tu perfil según requerimientos operacionales vigentes."
          />

          <div className="cards-grid cards-grid--four">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section shell faq-section" id="faq">
          <SectionHeading
            eyebrow="Preguntas frecuentes"
            title="Información clave antes de postular"
          />

          <div className="faq-list">
            {faqs.map((faq) => (
              <details className="faq-item" key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        
      </main>

      <a
        className="whatsapp-button"
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <span />
        WhatsApp
      </a>

      <footer className="footer">
        <div className="shell footer-grid">
          <div>
            <a className="brand footer-brand" href="#inicio" aria-label="MR&B Recruit inicio">
              <span className="brand-mark">MR&B</span>
              <span className="brand-text">
                <strong>MR&B Recruit</strong>
                <small>MR&B Servicios Logísticos</small>
              </span>
            </a>

            <p>
              Landing pública de captación para transportistas y dueños de
              vehículos. Postulación sujeta a evaluación operacional,
              disponibilidad y documentación.
            </p>
          </div>

          <nav className="footer-links" aria-label="Enlaces de la landing">
            <a href="#beneficios">Beneficios</a>
            <a href="#vehiculos">Vehículos</a>
            <a href="#operaciones">Operaciones</a>
            <a href="#postula">Postular</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default App

