import { useState } from "react";
import { createRecruitApplicant } from "./recruitApi";

const initialForm = {
  nombre: "",
  apellido: "",
  telefono: "",
  whatsapp: "",
  comuna: "",
  region: "",
  tipoPostulante: "transportista",
  tipoVehiculo: "",
  patente: "",
  capacidadCarga: "",
  anosExperiencia: "",
  disponibilidad: "inmediata",
  operacionInteres: "Chilexpress",
  notas: "",
};

const vehicleTypes = [
  "Furgón",
  "Cargo box",
  "Camión 3/4",
  "Camión cerrado",
  "Otro vehículo",
];

const operations = ["Chilexpress", "Brightcell", "Viña Concha y Toro", "Otra"];

function PublicRecruitForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createRecruitApplicant({
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono,
        whatsapp: form.whatsapp,
        comuna: form.comuna,
        region: form.region,
        tipoPostulante: form.tipoPostulante,
        tipoVehiculo: form.tipoVehiculo,
        patente: form.patente,
        capacidadCarga: form.capacidadCarga,
        anosExperiencia: Number(form.anosExperiencia || 0),
        disponibilidad: form.disponibilidad,
        campaignName: form.operacionInteres,
        notas: form.notas,
        fuente: "manual",
        estado: "nuevo",
        prioridad: "media",
      });

      setForm(initialForm);
      setSuccess(
        "Postulación enviada correctamente. Nuestro equipo se pondrá en contacto contigo."
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="public-recruit-shell">
      <div className="panel public-recruit-hero">
        <div>
          <span className="section-kicker">MR&amp;B RECRUIT</span>
          <h1>Postula tu vehículo a nuevas oportunidades logísticas</h1>
          <p>
            Súmate a nuestra red de transportistas para operaciones de última
            milla, distribución y carga. Completa tus datos y evaluaremos tu
            perfil.
          </p>
        </div>

        <div className="public-recruit-operations">
          <span>Operaciones disponibles</span>
          <strong>Chilexpress</strong>
          <strong>Brightcell</strong>
          <strong>Viña Concha y Toro</strong>
          <strong>Otros clientes</strong>
        </div>
      </div>

      <form className="panel public-recruit-form" onSubmit={handleSubmit}>
        <div className="public-recruit-form-header">
          <div>
            <span className="section-kicker">FORMULARIO DE POSTULACIÓN</span>
            <h2>Cuéntanos sobre tu experiencia y vehículo</h2>
          </div>
          <p>Los campos marcados con * son obligatorios.</p>
        </div>

        {success && <p className="public-recruit-message success">{success}</p>}
        {error && <p className="public-recruit-message error">{error}</p>}

        <div className="public-recruit-grid">
          <label className="public-recruit-field">
            <span>Nombre *</span>
            <input
              name="nombre"
              onChange={handleChange}
              required
              value={form.nombre}
            />
          </label>

          <label className="public-recruit-field">
            <span>Apellido *</span>
            <input
              name="apellido"
              onChange={handleChange}
              required
              value={form.apellido}
            />
          </label>

          <label className="public-recruit-field">
            <span>Teléfono *</span>
            <input
              name="telefono"
              onChange={handleChange}
              required
              type="tel"
              value={form.telefono}
            />
          </label>

          <label className="public-recruit-field">
            <span>WhatsApp</span>
            <input
              name="whatsapp"
              onChange={handleChange}
              type="tel"
              value={form.whatsapp}
            />
          </label>

          <label className="public-recruit-field">
            <span>Comuna *</span>
            <input
              name="comuna"
              onChange={handleChange}
              required
              value={form.comuna}
            />
          </label>

          <label className="public-recruit-field">
            <span>Región *</span>
            <input
              name="region"
              onChange={handleChange}
              required
              value={form.region}
            />
          </label>

          <label className="public-recruit-field">
            <span>Tipo de postulante *</span>
            <select
              name="tipoPostulante"
              onChange={handleChange}
              required
              value={form.tipoPostulante}
            >
              <option value="chofer">Chofer</option>
              <option value="transportista">Transportista</option>
              <option value="flota">Flota</option>
              <option value="empresa">Empresa</option>
            </select>
          </label>

          <label className="public-recruit-field">
            <span>Tipo de vehículo *</span>
            <select
              name="tipoVehiculo"
              onChange={handleChange}
              required
              value={form.tipoVehiculo}
            >
              <option value="">Selecciona una opción</option>
              {vehicleTypes.map((vehicleType) => (
                <option key={vehicleType} value={vehicleType}>
                  {vehicleType}
                </option>
              ))}
            </select>
          </label>

          <label className="public-recruit-field">
            <span>Patente</span>
            <input
              name="patente"
              onChange={handleChange}
              value={form.patente}
            />
          </label>

          <label className="public-recruit-field">
            <span>Capacidad de carga</span>
            <input
              name="capacidadCarga"
              onChange={handleChange}
              placeholder="Ej: 1.500 kg"
              value={form.capacidadCarga}
            />
          </label>

          <label className="public-recruit-field">
            <span>Años de experiencia</span>
            <input
              min="0"
              name="anosExperiencia"
              onChange={handleChange}
              type="number"
              value={form.anosExperiencia}
            />
          </label>

          <label className="public-recruit-field">
            <span>Disponibilidad *</span>
            <select
              name="disponibilidad"
              onChange={handleChange}
              required
              value={form.disponibilidad}
            >
              <option value="inmediata">Inmediata</option>
              <option value="esta_semana">Esta semana</option>
              <option value="este_mes">Este mes</option>
              <option value="a_convenir">A convenir</option>
            </select>
          </label>

          <label className="public-recruit-field public-recruit-field-wide">
            <span>Operación de interés *</span>
            <select
              name="operacionInteres"
              onChange={handleChange}
              required
              value={form.operacionInteres}
            >
              {operations.map((operation) => (
                <option key={operation} value={operation}>
                  {operation}
                </option>
              ))}
            </select>
          </label>

          <label className="public-recruit-field public-recruit-field-wide">
            <span>Notas o comentario</span>
            <textarea
              name="notas"
              onChange={handleChange}
              placeholder="Cuéntanos si tienes más vehículos, experiencia relevante o alguna consulta."
              rows="4"
              value={form.notas}
            />
          </label>
        </div>

        <div className="public-recruit-footer">
          <p>
            Al enviar tus datos aceptas ser contactado por el equipo de MR&amp;B
            Recruit.
          </p>
          <button
            className="public-recruit-submit"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Enviando postulación..." : "Enviar postulación"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PublicRecruitForm;