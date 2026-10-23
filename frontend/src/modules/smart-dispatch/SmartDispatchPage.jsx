import { useCallback, useEffect, useRef, useState } from "react";
import { dispatchRequest } from "./api";
import { DayForm, OrderForm, ScanForm } from "./DispatchForms";
import "./SmartDispatch.css";

const KPI_FIELDS = [
  ["ofEsperadas", "OF esperadas", "Órdenes declaradas para la jornada."],
  ["ofDigitalizadas", "OF digitalizadas", "Órdenes únicas registradas."],
  ["direccionesOk", "Direcciones OK", "OF con dirección revisada manualmente."],
  ["porRevisar", "Por revisar", "OF con dirección pendiente de revisión."],
  ["paquetesEscaneados", "Paquetes escaneados", "Bultos individuales confirmados."],
  ["faltantes", "Faltantes (OF)", "OF que aún no tienen todos sus bultos confirmados, incluidas las que faltan por registrar."],
  ["duplicados", "Duplicados", "Intentos repetidos de registrar una OF/código o confirmar el mismo bulto."],
];
const LOAD_LABELS = { pendiente: "Pendiente", parcial: "Parcial", escaneado: "Escaneado" };

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-CL");
}

export default function SmartDispatchPage() {
  const [days, setDays] = useState([]);
  const [day, setDay] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editHeader, setEditHeader] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [query, setQuery] = useState("");
  const requestVersion = useRef(0);
  const dayRequest = useRef(null);
  const orderFormPanel = useRef(null);
  const busy = loadingList || loadingDay || pending;

  const loadDays = useCallback(async (signal) => {
    try {
      const result = await dispatchRequest("", { signal });
      if (!signal?.aborted) setDays(result);
    } catch (error) {
      if (error.name !== "AbortError") setNotice({ type: "error", title: "No se pudieron cargar las jornadas", message: error.message });
    } finally {
      if (!signal?.aborted) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDays(controller.signal);
    return () => {
      controller.abort();
      dayRequest.current?.abort();
      requestVersion.current += 1;
    };
  }, [loadDays]);

  function acceptDay(nextDay) {
    setDay(nextDay);
    setSelectedId(nextDay._id);
    setDays((current) => [nextDay, ...current.filter((item) => item._id !== nextDay._id)]);
  }

  async function selectDay(id) {
    const version = ++requestVersion.current;
    dayRequest.current?.abort();
    setSelectedId(id);
    setDay(null);
    setNotice(null);
    setEditingOrder(null);
    setEditHeader(false);
    setShowCreate(false);
    setQuery("");
    if (!id) return;
    const controller = new AbortController();
    dayRequest.current = controller;
    setLoadingDay(true);
    try {
      const result = await dispatchRequest(`/${id}`, { signal: controller.signal });
      if (version === requestVersion.current) acceptDay(result);
    } catch (error) {
      if (error.name !== "AbortError" && version === requestVersion.current) {
        setNotice({ type: "error", title: "No se pudo abrir la jornada", message: error.message });
      }
    } finally {
      if (version === requestVersion.current) setLoadingDay(false);
    }
  }

  async function mutate(path, method, body, successMessage, action) {
    const version = requestVersion.current;
    setPending(true);
    setNotice(null);
    try {
      const result = await dispatchRequest(path, { method, body });
      if (version !== requestVersion.current) return false;
      acceptDay(result);
      setNotice({ type: "success", title: successMessage });
      return true;
    } catch (error) {
      if (version !== requestVersion.current) return false;
      if (error.day) acceptDay(error.day);
      setNotice({
        type: error.status === 409 ? "warning" : "error",
        title: error.status === 409 ? (error.day ? "Duplicado detectado" : "La jornada cambió; vuelve a intentarlo") : action === "scan" && error.status === 404 ? "Paquete no encontrado en esta jornada" : "No se pudo guardar",
        message: error.message,
      });
      return false;
    } finally {
      if (version === requestVersion.current) setPending(false);
    }
  }

  async function saveDay(body) {
    if (await mutate(editHeader ? `/${day._id}` : "", editHeader ? "PATCH" : "POST", body, editHeader ? "Jornada actualizada" : "Jornada creada")) {
      setShowCreate(false);
      setEditHeader(false);
      setEditingOrder(null);
      setQuery("");
      setFormVersion((value) => value + 1);
    }
  }

  async function saveOrder(body) {
    const path = `/${day._id}/orders${editingOrder ? `/${editingOrder._id}` : ""}`;
    if (await mutate(path, editingOrder ? "PATCH" : "POST", body, editingOrder ? "OF actualizada" : "OF registrada")) {
      setEditingOrder(null);
      setFormVersion((value) => value + 1);
    }
  }

  const visibleOrders = (day?.ordenes || []).filter((order) => [order.of, order.codigoBarras, order.direccion, order.comuna].some((value) => value.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))));

  return (
    <div className="smart-dispatch" aria-busy={busy}>
      <header className="sd-page-header">
        <div><span className="sd-kicker">STARKEN · HUB LAS CONDES</span><h1>Smart Dispatch <span className="sd-version">V1</span></h1><p>Registra las OF, revisa las direcciones y cuadra la carga de cada jornada.</p></div>
        <button type="button" className="sd-primary" disabled={busy || showCreate} onClick={() => { setShowCreate(true); setEditHeader(false); setNotice(null); }}>Nueva jornada</button>
      </header>

      <section className="sd-panel sd-selector" aria-label="Seleccionar jornada">
        <label>Jornada<select disabled={busy} value={selectedId} onChange={(event) => selectDay(event.target.value)}>
          <option value="">{loadingList ? "Cargando jornadas…" : "Selecciona una jornada"}</option>
          {days.map((item) => <option key={item._id} value={item._id}>{formatDate(item.fecha)} · {item.movil} · {item.chofer}</option>)}
        </select></label>
        <button type="button" disabled={busy} onClick={() => {
          if (selectedId) selectDay(selectedId);
          else { setLoadingList(true); setNotice(null); loadDays(); }
        }}>Actualizar</button>
      </section>

      {notice && <div className={`sd-notice sd-${notice.type}`} role={notice.type === "success" ? "status" : "alert"}><strong>{notice.title}</strong>{notice.message && <p>{notice.message}</p>}</div>}
      {(showCreate || editHeader) && <section className="sd-panel"><DayForm key={editHeader ? day._id : "new"} initial={editHeader ? day : null} disabled={busy} onSave={saveDay} onCancel={() => { setShowCreate(false); setEditHeader(false); }} /></section>}
      {loadingDay && <p className="sd-empty" role="status">Cargando jornada…</p>}

      {!day && !loadingDay && !loadingList && !showCreate && <section className="sd-panel sd-empty"><h2>{days.length ? "Abre una jornada para continuar" : "Prepara tu primera jornada"}</h2><p>{days.length ? "Selecciona la fecha, el móvil y el chofer en la lista superior." : "Crea una jornada con el móvil, el chofer y la cantidad de OF esperadas. Luego podrás registrar los paquetes."}</p></section>}

      {day && <>
        <section className="sd-panel sd-day-header">
          <div><span className="sd-kicker">{day.operacion} · Hub {day.hub}</span><h2>{day.movil} <span className="sd-muted">/ {day.chofer}</span></h2><p>Jornada del {formatDate(day.fecha)}</p></div>
          <button type="button" disabled={busy || showCreate || editHeader} onClick={() => { setEditHeader(true); setShowCreate(false); }}>Editar jornada</button>
        </section>

        <section className="sd-kpis" aria-label="KPIs de cuadratura">
          {KPI_FIELDS.map(([key, label, description]) => <article className="sd-panel sd-kpi" key={key}><h3>{label}</h3><strong>{day.kpis[key]}</strong><p>{description}</p></article>)}
        </section>
        <div className="sd-reconciliation">
          <span><strong>{day.kpis.ofSinDigitalizar}</strong> OF por digitalizar</span>
          <span><strong>{day.kpis.bultosPendientes}</strong> bultos pendientes en OF registradas</span>
          <span><strong>{day.kpis.ofEscaneadas}</strong> OF con carga completa</span>
          {day.kpis.ofExcedentes > 0 && <span className="sd-extra"><strong>{day.kpis.ofExcedentes}</strong> OF sobre la cantidad esperada</span>}
        </div>
        <p className="sd-help">Faltantes se mide en OF: la mayor cantidad entre esperadas y digitalizadas, menos las OF con carga completa. Los bultos se cuentan por separado.</p>

        <div className="sd-work-grid">
          <section className="sd-panel" ref={orderFormPanel}><OrderForm key={`${day._id}-${editingOrder?._id || "new"}-${formVersion}`} initial={editingOrder} disabled={busy || showCreate || editHeader} onSave={saveOrder} onCancel={() => setEditingOrder(null)} /></section>
          <section className="sd-panel"><ScanForm key={day._id} disabled={busy || showCreate || editHeader} onScan={(body) => mutate(`/${day._id}/scans`, "POST", body, `Bulto ${body.bulto} confirmado`, "scan")} /></section>
        </div>

        <section className="sd-panel sd-orders" aria-labelledby="sd-orders-title">
          <div className="sd-table-header"><div><h2 id="sd-orders-title">Órdenes de flete</h2><p>{day.ordenes.length} OF registradas · La parada se asigna manualmente.</p></div><label>Buscar OF, código o dirección<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en esta jornada" /></label></div>
          <div className="sd-table-scroll" tabIndex="0" role="region" aria-label="Listado de OF, desplazar horizontalmente para ver todas las columnas">
            <table><thead><tr><th scope="col">OF / código</th><th scope="col">Dirección / comuna</th><th scope="col">Dirección</th><th scope="col">Bultos</th><th scope="col">Carga</th><th scope="col">Parada</th><th scope="col">Acción</th></tr></thead>
              <tbody>{visibleOrders.map((order) => <tr key={order._id}>
                <td><strong>{order.of}</strong><small>{order.codigoBarras || "Sin código de barras"}</small></td>
                <td>{order.direccion || "Dirección pendiente"}<small>{order.comuna || "Comuna pendiente"}</small></td>
                <td><span className={`sd-badge ${order.estadoDireccion === "ok" ? "sd-good" : "sd-review"}`}>{order.estadoDireccion === "ok" ? "OK manual" : "Por revisar"}</span></td>
                <td>{order.bultosEscaneados.length} / {order.bultos}<small>{order.bultosEscaneados.length ? `Confirmados: ${[...order.bultosEscaneados].sort((a, b) => a - b).join(", ")}` : "Sin confirmar"}</small></td>
                <td><span className={`sd-badge ${order.estadoCarga === "escaneado" ? "sd-good" : "sd-review"}`}>{LOAD_LABELS[order.estadoCarga]}</span></td>
                <td>{order.parada ?? "Sin asignar"}</td>
                <td><button type="button" disabled={busy || showCreate || editHeader} aria-label={`Editar OF ${order.of}`} onClick={() => {
                  setEditingOrder(order);
                  setNotice(null);
                  requestAnimationFrame(() => {
                    orderFormPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    orderFormPanel.current?.querySelector("input:not([readonly])")?.focus({ preventScroll: true });
                  });
                }}>Editar</button></td>
              </tr>)}
              {!visibleOrders.length && <tr><td colSpan="7" className="sd-empty">{day.ordenes.length ? "No hay OF que coincidan con la búsqueda." : "Aún no hay OF. Agrega la primera usando el formulario de registro."}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </>}
      <p className="sd-scope">V1 · Registro y revisión manual, con confirmación de bultos. OCR, cámara y optimización de rutas quedan para una etapa posterior.</p>
    </div>
  );
}
