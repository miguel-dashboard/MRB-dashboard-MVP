import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3001/api/starken-las-condes";

const today = () => new Date().toLocaleDateString("sv-SE");
const currentMonth = () => today().slice(0, 7);

const initialForm = {
  fecha: today(),
  movil: "",
  chofer: "",
  tipoMovimiento: "rendicion",
  horaRegistro: "",
  numeroDocumento: "",
  entregadas: "",
  entregadasParciales: "",
  devoluciones: "",
  extraviados: "",
  dineroRendir: "",
  vouchersDevolver: "",
  nominasRendidas: "",
  horaEmision: "",
  horaDespacho: "",
  origen: "HUB LAS CONDES DOMICILIO",
  destino: "",
  encargosRetiro: "",
  bultosRetiro: "",
  pesoKg: "",
  observacion: "",
};

function formatMoney(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatVoucherDate(value) {
  // La API devuelve la fecha del voucher en ISO UTC; conservar su día calendario.
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function StarkenLasCondesPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [month, setMonth] = useState(currentMonth());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadRecords = useCallback(async () => {
    setMessage("");

    try {
      const response = await fetch(`${API_URL}?month=${month}`);
      if (!response.ok) throw new Error("No se pudieron cargar los registros del hub");
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    }
  }, [month]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

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
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el voucher");
      }

      setRecords((current) => [data, ...current]);
      setForm((current) => ({
        ...initialForm,
        fecha: today(),
        movil: current.movil,
        chofer: current.chofer,
        tipoMovimiento: current.tipoMovimiento,
      }));
      setMessage("Registro guardado correctamente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(recordId) {
    const confirmed = window.confirm("¿Eliminar este registro?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${recordId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("No se pudo eliminar el registro");

      setRecords((current) =>
        current.filter((record) => record._id !== recordId)
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  const summary = useMemo(() => {
    const renditions = records.filter(
      (record) => record.tipoMovimiento === "rendicion"
    );
    const pickups = records.filter(
      (record) => record.tipoMovimiento === "retiro"
    );

    const delivered = renditions.reduce(
      (sum, record) => sum + Number(record.entregadas || 0),
      0
    );
    const returns = renditions.reduce(
      (sum, record) => sum + Number(record.devoluciones || 0),
      0
    );
    const lost = renditions.reduce(
      (sum, record) => sum + Number(record.extraviados || 0),
      0
    );
    const money = renditions.reduce(
      (sum, record) => sum + Number(record.dineroRendir || 0),
      0
    );
    const pickupItems = pickups.reduce(
      (sum, record) => sum + Number(record.encargosRetiro || 0),
      0
    );

    return {
      renditions: renditions.length,
      pickups: pickups.length,
      pickupItems,
      delivered,
      returns,
      lost,
      money,
      effectiveness:
        delivered + returns > 0
          ? ((delivered / (delivered + returns)) * 100).toFixed(1)
          : "0.0",
    };
  }, [records]);

  const byMobile = useMemo(() => {
    const map = {};

    records.forEach((record) => {
      const key = record.movil || "Sin móvil";

      if (!map[key]) {
        map[key] = {
          movil: key,
          dates: new Set(),
          entregadas: 0,
          devoluciones: 0,
          retiros: 0,
          encargosRetiro: 0,
        };
      }

      map[key].dates.add(new Date(record.fecha).toLocaleDateString("sv-SE"));

      if (record.tipoMovimiento === "rendicion") {
        map[key].entregadas += Number(record.entregadas || 0);
        map[key].devoluciones += Number(record.devoluciones || 0);
      }

      if (record.tipoMovimiento === "retiro") {
        map[key].retiros += 1;
        map[key].encargosRetiro += Number(record.encargosRetiro || 0);
      }
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        dias: item.dates.size,
        efectividad:
          item.entregadas + item.devoluciones > 0
            ? (
                (item.entregadas /
                  (item.entregadas + item.devoluciones)) *
                100
              ).toFixed(1)
            : "0.0",
      }))
      .sort((a, b) => b.entregadas - a.entregadas);
  }, [records]);

  return (
    <div className="starken-module">
      <section className="panel simple-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">STARKEN · HUB LAS CONDES</span>
            <h3>Control diario de vouchers</h3>
            <p className="recruit-description">
              Registra rendiciones de reparto y retiros sin mezclar ambos tipos de operación.
            </p>
          </div>

          <label className="starken-month-filter">
            <span>Mes</span>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
        </div>

        <div className="starken-kpis">
          <div><span>Rendiciones</span><strong>{summary.renditions}</strong></div>
          <div><span>Entregadas</span><strong>{summary.delivered}</strong></div>
          <div><span>Devoluciones</span><strong>{summary.returns}</strong></div>
          <div><span>Efectividad</span><strong>{summary.effectiveness}%</strong></div>
          <div><span>Retiros</span><strong>{summary.pickups}</strong></div>
          <div><span>Encargos retiro</span><strong>{summary.pickupItems}</strong></div>
          <div><span>Extraviados</span><strong>{summary.lost}</strong></div>
          <div><span>Dinero a rendir</span><strong>{formatMoney(summary.money)}</strong></div>
        </div>

        <form className="starken-form" onSubmit={handleSubmit}>
          <label>
            Fecha
            <input type="date" name="fecha" value={form.fecha} onChange={updateField} required />
          </label>

          <label>
            Móvil / patente
            <input name="movil" value={form.movil} onChange={updateField} required />
          </label>

          <label>
            Chofer
            <input name="chofer" value={form.chofer} onChange={updateField} />
          </label>

          <label>
            Tipo de movimiento
            <select name="tipoMovimiento" value={form.tipoMovimiento} onChange={updateField}>
              <option value="rendicion">Rendición reparto</option>
              <option value="retiro">Retiro</option>
            </select>
          </label>

          <label>
            Hora voucher
            <input type="time" name="horaRegistro" value={form.horaRegistro} onChange={updateField} />
          </label>

          <label>
            Folio / N° nómina
            <input name="numeroDocumento" value={form.numeroDocumento} onChange={updateField} />
          </label>

          {form.tipoMovimiento === "rendicion" ? (
            <>
              <label>
                OF entregadas
                <input type="number" min="0" name="entregadas" value={form.entregadas} onChange={updateField} />
              </label>

              <label>
                Entregas parciales
                <input type="number" min="0" name="entregadasParciales" value={form.entregadasParciales} onChange={updateField} />
              </label>

              <label>
                OF a devolver
                <input type="number" min="0" name="devoluciones" value={form.devoluciones} onChange={updateField} />
              </label>

              <label>
                Encargos extraviados
                <input type="number" min="0" name="extraviados" value={form.extraviados} onChange={updateField} />
              </label>

              <label>
                Dinero a rendir
                <input type="number" min="0" step="1" name="dineroRendir" value={form.dineroRendir} onChange={updateField} />
              </label>

              <label>
                Voucher a devolver
                <input type="number" min="0" name="vouchersDevolver" value={form.vouchersDevolver} onChange={updateField} />
              </label>

              <label>
                Nóminas rendidas
                <input type="number" min="0" name="nominasRendidas" value={form.nominasRendidas} onChange={updateField} />
              </label>
            </>
          ) : (
            <>
              <label>
                Hora emisión
                <input type="time" name="horaEmision" value={form.horaEmision} onChange={updateField} />
              </label>

              <label>
                Hora despacho
                <input type="time" name="horaDespacho" value={form.horaDespacho} onChange={updateField} />
              </label>

              <label>
                Origen
                <input name="origen" value={form.origen} onChange={updateField} />
              </label>

              <label>
                Destino
                <input name="destino" value={form.destino} onChange={updateField} />
              </label>

              <label>
                Encargos retiro
                <input type="number" min="0" name="encargosRetiro" value={form.encargosRetiro} onChange={updateField} />
              </label>

              <label>
                Bultos
                <input type="number" min="0" name="bultosRetiro" value={form.bultosRetiro} onChange={updateField} />
              </label>

              <label>
                Peso kg
                <input type="number" min="0" step="0.001" name="pesoKg" value={form.pesoKg} onChange={updateField} />
              </label>
            </>
          )}

          <label className="starken-wide">
            Observación
            <input name="observacion" value={form.observacion} onChange={updateField} />
          </label>

          <button className="starken-submit" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar voucher"}
          </button>
        </form>

        {message && <p className="operation-message">{message}</p>}
      </section>

      <section className="panel table-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">RENDIMIENTO MENSUAL</span>
            <h3>Resumen por móvil</h3>
          </div>
          <button className="refresh-btn" onClick={loadRecords}>Actualizar</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Móvil</th>
                <th>Días con registro</th>
                <th>Entregadas</th>
                <th>Devoluciones</th>
                <th>Efectividad</th>
                <th>Retiros</th>
                <th>Encargos retiro</th>
              </tr>
            </thead>
            <tbody>
              {byMobile.length === 0 ? (
                <tr><td className="empty-row" colSpan="7">No hay registros en este mes.</td></tr>
              ) : (
                byMobile.map((item) => (
                  <tr key={item.movil}>
                    <td>{item.movil}</td>
                    <td>{item.dias}</td>
                    <td>{item.entregadas}</td>
                    <td>{item.devoluciones}</td>
                    <td>{item.efectividad}%</td>
                    <td>{item.retiros}</td>
                    <td>{item.encargosRetiro}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel table-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">TRAZABILIDAD</span>
            <h3>Vouchers registrados</h3>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Móvil</th>
                <th>Chofer</th>
                <th>Tipo</th>
                <th>Hora</th>
                <th>Entregadas</th>
                <th>Devoluciones</th>
                <th>Retiros</th>
                <th>Documento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td className="empty-row" colSpan="10">Aún no hay vouchers registrados.</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id}>
                    <td>{formatVoucherDate(record.fecha)}</td>
                    <td>{record.movil}</td>
                    <td>{record.chofer || "-"}</td>
                    <td>{record.tipoMovimiento === "rendicion" ? "Rendición" : "Retiro"}</td>
                    <td>{record.horaRegistro || record.horaDespacho || "-"}</td>
                    <td>{record.entregadas || 0}</td>
                    <td>{record.devoluciones || 0}</td>
                    <td>{record.encargosRetiro || 0}</td>
                    <td>{record.numeroDocumento || "-"}</td>
                    <td>
                      <button
                        className="starken-delete"
                        type="button"
                        onClick={() => deleteRecord(record._id)}
                      >
                        Eliminar
                      </button>
                    </td>
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

export default StarkenLasCondesPage;
