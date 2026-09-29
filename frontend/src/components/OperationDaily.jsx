import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3001/api/operation-days";

const initialForm = {
  operacion: "Chilexpress",
  fecha: new Date().toLocaleDateString("sv-SE"),
  vehiculo: "",
  chofer: "",
  citado: true,
  opero: true,
  horaCitacion: "",
  horaCarga: "",
  paquetesAsignados: "",
  paquetesEntregados: "",
  problemaPrincipal: "",
  observacion: "",
  estado: "Cerrada",
};

function OperationDaily() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("Todas");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("No se pudo cargar la operación diaria");
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
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
          paquetesAsignados: Number(form.paquetesAsignados || 0),
          paquetesEntregados: Number(form.paquetesEntregados || 0),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el registro");
      }

      setRecords((current) => [data, ...current]);
      setForm((current) => ({
        ...initialForm,
        operacion: current.operacion,
        fecha: new Date().toLocaleDateString("sv-SE"),
      }));
      setMessage("Jornada registrada correctamente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  const visibleRecords = useMemo(() => {
    if (filter === "Todas") return records;
    return records.filter((item) => item.operacion === filter);
  }, [records, filter]);

  const summary = useMemo(() => {
    const totalAsignados = visibleRecords.reduce(
      (sum, item) => sum + Number(item.paquetesAsignados || 0),
      0
    );
    const totalEntregados = visibleRecords.reduce(
      (sum, item) => sum + Number(item.paquetesEntregados || 0),
      0
    );
    const incidents = visibleRecords.filter(
      (item) => item.estado === "Incidencia" || item.problemaPrincipal
    ).length;
    const compliance =
      totalAsignados > 0
        ? Math.round((totalEntregados / totalAsignados) * 100)
        : 0;

    return {
      jornadas: visibleRecords.length,
      totalAsignados,
      totalEntregados,
      incidents,
      compliance,
    };
  }, [visibleRecords]);

  return (
    <div className="operation-module">
      <section className="panel simple-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">OPERACIÓN REAL</span>
            <h3>Registro diario por móvil</h3>
          </div>

          <select
            className="operation-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="Chilexpress">Chilexpress</option>
            <option value="Starken">Starken</option>
          </select>
        </div>

        <div className="operation-kpis">
          <div className="operation-kpi"><span>Jornadas</span><strong>{summary.jornadas}</strong></div>
          <div className="operation-kpi"><span>Asignados</span><strong>{summary.totalAsignados}</strong></div>
          <div className="operation-kpi"><span>Entregados</span><strong>{summary.totalEntregados}</strong></div>
          <div className="operation-kpi"><span>Cumplimiento</span><strong>{summary.compliance}%</strong></div>
          <div className="operation-kpi"><span>Con problema</span><strong>{summary.incidents}</strong></div>
        </div>

        <form className="operation-form" onSubmit={handleSubmit}>
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
            <input name="vehiculo" value={form.vehiculo} onChange={updateField} required />
          </label>

          <label>
            Chofer
            <input name="chofer" value={form.chofer} onChange={updateField} />
          </label>

          <label>
            Hora citación
            <input type="time" name="horaCitacion" value={form.horaCitacion} onChange={updateField} />
          </label>

          <label>
            Hora carga
            <input type="time" name="horaCarga" value={form.horaCarga} onChange={updateField} />
          </label>

          <label>
            Paquetes asignados
            <input type="number" min="0" name="paquetesAsignados" value={form.paquetesAsignados} onChange={updateField} />
          </label>

          <label>
            Paquetes entregados
            <input type="number" min="0" name="paquetesEntregados" value={form.paquetesEntregados} onChange={updateField} />
          </label>

          <label>
            Problema principal
            <select name="problemaPrincipal" value={form.problemaPrincipal} onChange={updateField}>
              <option value="">Sin problema</option>
              <option value="Carga atrasada">Carga atrasada</option>
              <option value="Falta de carga">Falta de carga</option>
              <option value="Bodega">Bodega</option>
              <option value="Paquete perdido">Paquete perdido</option>
              <option value="Robo">Robo</option>
              <option value="Falla vehicular">Falla vehicular</option>
              <option value="Chofer">Chofer</option>
              <option value="Sistema/PDA">Sistema/PDA</option>
              <option value="Otro">Otro</option>
            </select>
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={updateField}>
              <option value="Planificada">Planificada</option>
              <option value="Operando">Operando</option>
              <option value="Cerrada">Cerrada</option>
              <option value="Incidencia">Incidencia</option>
            </select>
          </label>

          <label className="operation-check">
            <input type="checkbox" name="citado" checked={form.citado} onChange={updateField} />
            Citado
          </label>

          <label className="operation-check">
            <input type="checkbox" name="opero" checked={form.opero} onChange={updateField} />
            Operó
          </label>

          <label className="operation-wide">
            Observación
            <input name="observacion" value={form.observacion} onChange={updateField} />
          </label>

          <button className="operation-submit" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Registrar jornada"}
          </button>
        </form>

        {message && <p className="operation-message">{message}</p>}
      </section>

      <section className="panel table-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">TRAZABILIDAD</span>
            <h3>Últimas jornadas registradas</h3>
          </div>
          <button className="refresh-btn" onClick={loadRecords}>Actualizar</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Operación</th>
                <th>Móvil</th>
                <th>Chofer</th>
                <th>Asignados</th>
                <th>Entregados</th>
                <th>No entregados</th>
                <th>Problema</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">No hay jornadas registradas.</td>
                </tr>
              ) : (
                visibleRecords.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.fecha).toLocaleDateString("es-CL")}</td>
                    <td>{item.operacion}</td>
                    <td>{item.vehiculo}</td>
                    <td>{item.chofer || "-"}</td>
                    <td>{item.paquetesAsignados || 0}</td>
                    <td>{item.paquetesEntregados || 0}</td>
                    <td>{item.paquetesNoEntregados || 0}</td>
                    <td>{item.problemaPrincipal || "-"}</td>
                    <td>{item.estado}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default OperationDaily;
