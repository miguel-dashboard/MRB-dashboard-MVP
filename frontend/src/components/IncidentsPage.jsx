import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3001/api/incidents";

const initialForm = {
  operacion: "Chilexpress",
  fecha: new Date().toLocaleDateString("sv-SE"),
  vehiculo: "",
  chofer: "",
  tipo: "Carga atrasada",
  origen: "No determinado",
  severidad: "Media",
  impactoMinutos: "",
  paquetesAfectados: "",
  descripcion: "",
  estado: "Abierta",
  causaRaiz: "",
  accionCorrectiva: "",
};

function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [operationFilter, setOperationFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [resolution, setResolution] = useState({
    estado: "En análisis",
    causaRaiz: "",
    accionCorrectiva: "",
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("No se pudieron cargar las incidencias");
      const data = await response.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          impactoMinutos: Number(form.impactoMinutos || 0),
          paquetesAfectados: Number(form.paquetesAfectados || 0),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo registrar la incidencia");
      }

      setIncidents((current) => [data, ...current]);
      setForm((current) => ({
        ...initialForm,
        operacion: current.operacion,
        fecha: new Date().toLocaleDateString("sv-SE"),
      }));
      setMessage("Incidencia registrada correctamente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function startResolution(incident) {
    setEditingId(incident._id);
    setResolution({
      estado: incident.estado || "En análisis",
      causaRaiz: incident.causaRaiz || "",
      accionCorrectiva: incident.accionCorrectiva || "",
    });
  }

  async function saveResolution(incident) {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${incident._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...incident,
          ...resolution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar la incidencia");
      }

      setIncidents((current) =>
        current.map((item) => (item._id === data._id ? data : item))
      );
      setEditingId(null);
      setMessage("Incidencia actualizada correctamente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  const visibleIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const operationMatch =
        operationFilter === "Todas" || incident.operacion === operationFilter;
      const statusMatch =
        statusFilter === "Todos" || incident.estado === statusFilter;
      return operationMatch && statusMatch;
    });
  }, [incidents, operationFilter, statusFilter]);

  const summary = useMemo(() => {
    const open = visibleIncidents.filter((item) => item.estado === "Abierta").length;
    const analysis = visibleIncidents.filter(
      (item) => item.estado === "En análisis"
    ).length;
    const critical = visibleIncidents.filter(
      (item) => item.severidad === "Crítica"
    ).length;
    const warehouse = visibleIncidents.filter(
      (item) => item.origen === "Bodega"
    ).length;
    const minutes = visibleIncidents.reduce(
      (sum, item) => sum + Number(item.impactoMinutos || 0),
      0
    );
    const packages = visibleIncidents.reduce(
      (sum, item) => sum + Number(item.paquetesAfectados || 0),
      0
    );

    return {
      total: visibleIncidents.length,
      open,
      analysis,
      critical,
      warehouse,
      minutes,
      packages,
    };
  }, [visibleIncidents]);

  return (
    <div className="incident-module">
      <section className="panel simple-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">CAUSA RAÍZ</span>
            <h3>Incidencias operacionales</h3>
            <p className="incident-description">
              Registrar qué ocurrió, dónde nació y cuál fue su impacto.
            </p>
          </div>

          <div className="incident-filters">
            <select
              value={operationFilter}
              onChange={(event) => setOperationFilter(event.target.value)}
            >
              <option value="Todas">Todas las operaciones</option>
              <option value="Chilexpress">Chilexpress</option>
              <option value="Starken">Starken</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Todos">Todos los estados</option>
              <option value="Abierta">Abierta</option>
              <option value="En análisis">En análisis</option>
              <option value="Resuelta">Resuelta</option>
            </select>
          </div>
        </div>

        <div className="incident-kpis">
          <div className="incident-kpi"><span>Total</span><strong>{summary.total}</strong></div>
          <div className="incident-kpi"><span>Abiertas</span><strong>{summary.open}</strong></div>
          <div className="incident-kpi"><span>En análisis</span><strong>{summary.analysis}</strong></div>
          <div className="incident-kpi"><span>Críticas</span><strong>{summary.critical}</strong></div>
          <div className="incident-kpi"><span>Origen bodega</span><strong>{summary.warehouse}</strong></div>
          <div className="incident-kpi"><span>Impacto</span><strong>{summary.minutes} min</strong></div>
          <div className="incident-kpi"><span>Paquetes</span><strong>{summary.packages}</strong></div>
        </div>

        <form className="incident-form" onSubmit={handleSubmit}>
          <label>
            Operación
            <select name="operacion" value={form.operacion} onChange={updateField}>
              <option value="Chilexpress">Chilexpress</option>
              <option value="Starken">Starken</option>
            </select>
          </label>

          <label>
            Fecha
            <input type="date" name="fecha" value={form.fecha} onChange={updateField} required />
          </label>

          <label>
            Patente / móvil
            <input name="vehiculo" value={form.vehiculo} onChange={updateField} />
          </label>

          <label>
            Chofer
            <input name="chofer" value={form.chofer} onChange={updateField} />
          </label>

          <label>
            Tipo
            <select name="tipo" value={form.tipo} onChange={updateField}>
              <option value="Carga atrasada">Carga atrasada</option>
              <option value="Falta de carga">Falta de carga</option>
              <option value="Paquete perdido">Paquete perdido</option>
              <option value="Robo">Robo</option>
              <option value="Dirección">Dirección</option>
              <option value="Cliente">Cliente</option>
              <option value="Falla vehicular">Falla vehicular</option>
              <option value="Chofer">Chofer</option>
              <option value="Sistema/PDA">Sistema/PDA</option>
              <option value="Otro">Otro</option>
            </select>
          </label>

          <label>
            Origen
            <select name="origen" value={form.origen} onChange={updateField}>
              <option value="No determinado">No determinado</option>
              <option value="Bodega">Bodega</option>
              <option value="Planificación">Planificación</option>
              <option value="Cliente">Cliente</option>
              <option value="Chofer">Chofer</option>
              <option value="Transportista">Transportista</option>
              <option value="Vehículo">Vehículo</option>
              <option value="Sistema">Sistema</option>
              <option value="MR&B">MR&B</option>
            </select>
          </label>

          <label>
            Severidad
            <select name="severidad" value={form.severidad} onChange={updateField}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={updateField}>
              <option value="Abierta">Abierta</option>
              <option value="En análisis">En análisis</option>
              <option value="Resuelta">Resuelta</option>
            </select>
          </label>

          <label>
            Impacto en minutos
            <input type="number" min="0" name="impactoMinutos" value={form.impactoMinutos} onChange={updateField} />
          </label>

          <label>
            Paquetes afectados
            <input type="number" min="0" name="paquetesAfectados" value={form.paquetesAfectados} onChange={updateField} />
          </label>

          <label className="incident-wide">
            Descripción
            <textarea name="descripcion" value={form.descripcion} onChange={updateField} required />
          </label>

          <label className="incident-wide">
            Causa raíz
            <textarea
              name="causaRaiz"
              value={form.causaRaiz}
              onChange={updateField}
              placeholder="Se completa cuando se identifica el origen real del problema."
            />
          </label>

          <label className="incident-wide">
            Acción correctiva
            <textarea
              name="accionCorrectiva"
              value={form.accionCorrectiva}
              onChange={updateField}
              placeholder="Qué se hizo o qué debe cambiar para evitar recurrencia."
            />
          </label>

          <button className="incident-submit" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Registrar incidencia"}
          </button>
        </form>

        {message && <p className="incident-message">{message}</p>}
      </section>

      <section className="panel table-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">TRAZABILIDAD</span>
            <h3>Incidencias registradas</h3>
          </div>
          <button className="refresh-btn" onClick={loadIncidents}>Actualizar</button>
        </div>

        <div className="incident-cards">
          {visibleIncidents.length === 0 ? (
            <p className="empty-text">No hay incidencias registradas.</p>
          ) : (
            visibleIncidents.map((incident) => (
              <article className="incident-card" key={incident._id}>
                <div className="incident-card-head">
                  <div>
                    <span className="incident-operation">{incident.operacion}</span>
                    <h4>{incident.tipo}</h4>
                    <p>
                      {new Date(incident.fecha).toLocaleDateString("es-CL")} ·{" "}
                      {incident.vehiculo || "Sin móvil"} · {incident.chofer || "Sin chofer"}
                    </p>
                  </div>
                  <div className="incident-badges">
                    <span className={`incident-badge severity-${incident.severidad.toLowerCase().replace("í", "i")}`}>
                      {incident.severidad}
                    </span>
                    <span className="incident-badge">{incident.estado}</span>
                  </div>
                </div>

                <div className="incident-grid">
                  <div><span>Origen</span><strong>{incident.origen}</strong></div>
                  <div><span>Impacto</span><strong>{incident.impactoMinutos || 0} min</strong></div>
                  <div><span>Paquetes</span><strong>{incident.paquetesAfectados || 0}</strong></div>
                </div>

                <div className="incident-text">
                  <span>Descripción</span>
                  <p>{incident.descripcion}</p>
                </div>

                {incident.causaRaiz && (
                  <div className="incident-text root">
                    <span>Causa raíz</span>
                    <p>{incident.causaRaiz}</p>
                  </div>
                )}

                {incident.accionCorrectiva && (
                  <div className="incident-text action">
                    <span>Acción correctiva</span>
                    <p>{incident.accionCorrectiva}</p>
                  </div>
                )}

                {editingId === incident._id ? (
                  <div className="incident-resolution">
                    <select
                      value={resolution.estado}
                      onChange={(event) =>
                        setResolution((current) => ({
                          ...current,
                          estado: event.target.value,
                        }))
                      }
                    >
                      <option value="Abierta">Abierta</option>
                      <option value="En análisis">En análisis</option>
                      <option value="Resuelta">Resuelta</option>
                    </select>

                    <input
                      value={resolution.causaRaiz}
                      onChange={(event) =>
                        setResolution((current) => ({
                          ...current,
                          causaRaiz: event.target.value,
                        }))
                      }
                      placeholder="Causa raíz"
                    />

                    <input
                      value={resolution.accionCorrectiva}
                      onChange={(event) =>
                        setResolution((current) => ({
                          ...current,
                          accionCorrectiva: event.target.value,
                        }))
                      }
                      placeholder="Acción correctiva"
                    />

                    <div className="incident-resolution-actions">
                      <button
                        className="incident-save"
                        onClick={() => saveResolution(incident)}
                        disabled={saving}
                      >
                        Guardar análisis
                      </button>
                      <button
                        className="incident-cancel"
                        onClick={() => setEditingId(null)}
                        type="button"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="incident-analyze"
                    onClick={() => startResolution(incident)}
                    type="button"
                  >
                    Analizar / resolver
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default IncidentsPage;
