import { useEffect, useMemo, useState } from "react";
import "./App.css";
import RecruitPage from "./modules/recruit/RecruitPage";
const API_BASE = "http://localhost:3001/api";

const menuItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "deliveries", label: "Entregas" },
  { id: "drivers", label: "Choferes" },
  { id: "vehicles", label: "Vehículos" },
  { id: "incidents", label: "Incidencias" },
  { id: "recruit", label: "Recruit" },
];



const safeArray = (value) => (Array.isArray(value) ? value : []);

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CL");
}

function formatId(id) {
  if (!id) return "-";
  return String(id).slice(-6).toUpperCase();
}

function normalizeStatus(status) {
  if (!status) return "Pendiente";
  return String(status).trim();
}

function normalizePriority(priority) {
  if (!priority) return "Media";
  return String(priority).trim();
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const diff = Math.round((b - a) / 60000);
  return diff > 0 ? diff : 0;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error ${response.status} en ${url}`);
  }
  return response.json();
}

async function fetchFirstAvailable(urls) {
  for (const url of urls) {
    try {
      const data = await fetchJson(url);
      return data;
    } catch (_) {
      // Intenta el siguiente endpoint
    }
  }
  return null;
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const [deliveriesData, driversData, vehiclesData] = await Promise.all([
        fetchFirstAvailable([
          `${API_BASE}/deliveries`,
          `${API_BASE}/delivery`,
        ]),
        fetchFirstAvailable([
          `${API_BASE}/drivers`,
          `${API_BASE}/choferes`,
        ]),
        fetchFirstAvailable([
          `${API_BASE}/vehicles`,
          `${API_BASE}/vehiculos`,
        ]),
      ]);

      setDeliveries(safeArray(deliveriesData));
      setDrivers(safeArray(driversData));
      setVehicles(safeArray(vehiclesData));
      setBackendOnline(true);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setDeliveries([]);
      setDrivers([]);
      setVehicles([]);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }

  const dashboard = useMemo(() => {
    const today = new Date();
    const todayString = today.toLocaleDateString("sv-SE");

    const normalizedDeliveries = safeArray(deliveries).map((delivery) => {
      const estado = normalizeStatus(delivery.estado);
      const prioridad = normalizePriority(delivery.prioridad);
      const fechaBase =
        delivery.fecha || delivery.createdAt || delivery.updatedAt || null;

      const waitMinutes =
        delivery.horaCitacion && delivery.horaCarga
          ? minutesBetween(delivery.horaCitacion, delivery.horaCarga)
          : 0;

      return {
        ...delivery,
        estado,
        prioridad,
        fechaBase,
        waitMinutes,
      };
    });

    const deliveriesToday = normalizedDeliveries.filter((delivery) => {
      if (!delivery.fechaBase) return false;
      const value = new Date(delivery.fechaBase);
      if (Number.isNaN(value.getTime())) return false;
      return value.toLocaleDateString("sv-SE") === todayString;
    });

    const entregadas = normalizedDeliveries.filter(
      (d) => d.estado.toLowerCase() === "entregada"
    );

    const pendientes = normalizedDeliveries.filter((d) => {
      const estado = d.estado.toLowerCase();
      return estado === "pendiente" || estado === "en ruta";
    });

    const incidencias = normalizedDeliveries.filter(
      (d) => d.estado.toLowerCase() === "incidencia"
    );

    const waitValues = normalizedDeliveries
      .map((d) => d.waitMinutes)
      .filter((v) => v > 0);

    const averageWait =
      waitValues.length > 0
        ? Math.round(waitValues.reduce((acc, val) => acc + val, 0) / waitValues.length)
        : 0;

    const delayedDepartures = normalizedDeliveries.filter(
      (d) => d.waitMinutes >= 60
    ).length;

    const warehouseProblems = normalizedDeliveries.filter((d) => {
      const origin = String(d.origenProblema || "").toLowerCase();
      return origin.includes("bodega");
    }).length;

    const criticalDeliveries = normalizedDeliveries.filter((d) => {
      const p = d.prioridad.toLowerCase();
      return p.includes("crítica") || p.includes("critica") || p.includes("alta");
    }).length;

    const activeDrivers = safeArray(drivers).filter((d) => d.activo !== false).length;
    const activeVehicles = safeArray(vehicles).filter((v) => v.activo !== false).length;

    const driverRankingMap = {};
    normalizedDeliveries.forEach((d) => {
      const key = d.chofer || "Sin chofer";
      driverRankingMap[key] = (driverRankingMap[key] || 0) + 1;
    });

    const vehicleRankingMap = {};
    normalizedDeliveries.forEach((d) => {
      const key = d.vehiculo || "Sin vehículo";
      vehicleRankingMap[key] = (vehicleRankingMap[key] || 0) + 1;
    });

    const topDrivers = Object.entries(driverRankingMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topVehicles = Object.entries(vehicleRankingMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentPending = [...pendientes]
      .sort((a, b) => new Date(b.fechaBase || 0) - new Date(a.fechaBase || 0))
      .slice(0, 5);

    const recentIncidents = [...incidencias]
      .sort((a, b) => new Date(b.fechaBase || 0) - new Date(a.fechaBase || 0))
      .slice(0, 5);

    const systemStatus = backendOnline ? "Online" : "Offline";
    const operationStatus = backendOnline ? "Operación estable" : "Con problemas";

    return {
      deliveriesTodayCount: deliveriesToday.length,
      deliveredCount: entregadas.length,
      pendingCount: pendientes.length,
      incidentsCount: incidencias.length,
      averageWait,
      delayedDepartures,
      warehouseProblems,
      criticalDeliveries,
      activeDrivers,
      activeVehicles,
      topDrivers,
      topVehicles,
      recentPending,
      recentIncidents,
      systemStatus,
      operationStatus,
      deliveryTable: normalizedDeliveries,
    };
  }, [deliveries, drivers, vehicles, backendOnline]);

  const statCards = [
    {
      title: "Entregas del día",
      value: dashboard.deliveriesTodayCount,
      detail: "Operación registrada hoy",
    },
    {
      title: "Entregadas",
      value: dashboard.deliveredCount,
      detail: "Cumplimiento efectivo",
    },
    {
      title: "Pendientes",
      value: dashboard.pendingCount,
      detail: "Pendiente o en ruta",
    },
    {
      title: "Incidencias",
      value: dashboard.incidentsCount,
      detail: "Quiebres operacionales",
    },
    {
      title: "Espera bodega",
      value: `${dashboard.averageWait} min`,
      detail: "Promedio citación a carga",
    },
    {
      title: "Salidas atrasadas",
      value: dashboard.delayedDepartures,
      detail: "Espera ≥ 60 min",
    },
    {
      title: "Problemas bodega",
      value: dashboard.warehouseProblems,
      detail: "Origen detectado en bodega",
    },
    {
      title: "Entregas críticas",
      value: dashboard.criticalDeliveries,
      detail: "Alta o crítica",
    },
  ];

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "entregada") return "done";
    if (value === "incidencia") return "incident";
    if (value === "en ruta") return "route";
    return "pending";
  };

  const renderDashboard = () => (
    <>
      <section className="hero-strip panel">
        <div className="hero-strip-left">
          <span className="section-kicker">MR&B CONTROL TOWER</span>
          <h1>Torre de control logística con foco operativo real</h1>
          <p>
            Visibilidad de calle, bodega, flota y cumplimiento. No muestra solo
            qué pasó: ayuda a detectar dónde nació el problema operacional.
          </p>
        </div>

        <div className="hero-strip-right">
          <div className="hero-mini-card">
            <span>Estado</span>
            <strong>{dashboard.operationStatus}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Backend</span>
            <strong>{dashboard.systemStatus}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Choferes activos</span>
            <strong>{dashboard.activeDrivers}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Vehículos activos</span>
            <strong>{dashboard.activeVehicles}</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {statCards.map((card) => (
          <div className="stat-card panel" key={card.title}>
            <div className="stat-head">
              <span>{card.title}</span>
            </div>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </div>
        ))}
      </section>

      <section className="insight-grid">
        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">DOLOR OPERATIVO</span>
              <h3>Fricciones del día</h3>
            </div>
          </div>

          <div className="metric-list">
            <div className="metric-row">
              <div>
                <h4>Espera promedio en bodega</h4>
                <p>Tiempo medio entre citación y carga real.</p>
              </div>
              <span className="pill warning">{dashboard.averageWait} min</span>
            </div>

            <div className="metric-row">
              <div>
                <h4>Salidas atrasadas</h4>
                <p>Transportistas con espera igual o superior a 60 minutos.</p>
              </div>
              <span className="pill danger">{dashboard.delayedDepartures}</span>
            </div>

            <div className="metric-row">
              <div>
                <h4>Problemas de bodega</h4>
                <p>Entregas donde el origen del problema fue bodega.</p>
              </div>
              <span className="pill danger">{dashboard.warehouseProblems}</span>
            </div>

            <div className="metric-row">
              <div>
                <h4>Entregas críticas</h4>
                <p>Entregas marcadas con prioridad alta o crítica.</p>
              </div>
              <span className="pill warning">{dashboard.criticalDeliveries}</span>
            </div>
          </div>
        </div>

        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">LECTURA EJECUTIVA</span>
              <h3>Interpretación operacional</h3>
            </div>
          </div>

          <div className="executive-stack">
            <div className="executive-item">
              <h4>Origen del problema</h4>
              <p>
                El sistema permite separar si el desorden nace en bodega, en
                asignación, en cliente o en calle.
              </p>
            </div>

            <div className="executive-item">
              <h4>Valor operativo</h4>
              <p>
                Hace visible la pérdida de eficiencia real en la salida y
                ejecución de la flota.
              </p>
            </div>

            <div className="executive-item">
              <h4>Valor comercial</h4>
              <p>
                Transforma dolores logísticos en evidencia clara y demostrable
                para vender el producto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="feed-grid">
        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">RANKING</span>
              <h3>Top choferes</h3>
            </div>
          </div>

          {dashboard.topDrivers.length === 0 ? (
            <p className="empty-text">Aún no hay entregas para calcular ranking.</p>
          ) : (
            <div className="list-stack">
              {dashboard.topDrivers.map((item, index) => (
                <div className="list-row" key={`${item.name}-${index}`}>
                  <div className="list-row-main">
                    <span className="index-badge">{index + 1}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <p>Chofer con entregas registradas</p>
                    </div>
                  </div>
                  <span className="row-value">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">RANKING</span>
              <h3>Top vehículos</h3>
            </div>
          </div>

          {dashboard.topVehicles.length === 0 ? (
            <p className="empty-text">Aún no hay vehículos con entregas registradas.</p>
          ) : (
            <div className="list-stack">
              {dashboard.topVehicles.map((item, index) => (
                <div className="list-row" key={`${item.name}-${index}`}>
                  <div className="list-row-main">
                    <span className="index-badge">{index + 1}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <p>Vehículo con entregas registradas</p>
                    </div>
                  </div>
                  <span className="row-value">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">ACTIVIDAD</span>
              <h3>Pendientes recientes</h3>
            </div>
          </div>

          {dashboard.recentPending.length === 0 ? (
            <p className="empty-text">No hay entregas pendientes.</p>
          ) : (
            <div className="list-stack">
              {dashboard.recentPending.map((item) => (
                <div className="list-row" key={item._id || item.id}>
                  <div>
                    <strong>{item.cliente || "Sin cliente"}</strong>
                    <p>{item.direccion || "Sin dirección"}</p>
                  </div>
                  <span className={`tag ${getStatusClass(item.estado)}`}>
                    {item.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">ACTIVIDAD</span>
              <h3>Incidencias recientes</h3>
            </div>
          </div>

          {dashboard.recentIncidents.length === 0 ? (
            <p className="empty-text">No hay incidencias registradas.</p>
          ) : (
            <div className="list-stack">
              {dashboard.recentIncidents.map((item) => (
                <div className="list-row" key={item._id || item.id}>
                  <div>
                    <strong>{item.cliente || "Sin cliente"}</strong>
                    <p>{item.tipoIncidencia || item.observacion || "Sin detalle"}</p>
                  </div>
                  <span className={`tag ${getStatusClass(item.estado)}`}>
                    {item.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel table-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">OPERACIÓN</span>
            <h3>Listado de entregas</h3>
          </div>

          <button className="refresh-btn" onClick={loadData}>
            Actualizar
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Dirección</th>
                <th>Fecha</th>
                <th>Chofer</th>
                <th>Vehículo</th>
                <th>Estado</th>
                <th>Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.deliveryTable.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    {loading ? "Cargando entregas..." : "No hay entregas registradas"}
                  </td>
                </tr>
              ) : (
                dashboard.deliveryTable.map((delivery) => (
                  <tr key={delivery._id || delivery.id}>
                    <td>{formatId(delivery._id || delivery.id)}</td>
                    <td>{delivery.cliente || "-"}</td>
                    <td>{delivery.direccion || "-"}</td>
                    <td>{formatDate(delivery.fechaBase)}</td>
                    <td>{delivery.chofer || "-"}</td>
                    <td>{delivery.vehiculo || "-"}</td>
                    <td>
                      <span className={`tag ${getStatusClass(delivery.estado)}`}>
                        {delivery.estado}
                      </span>
                    </td>
                    <td>{delivery.prioridad}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderSimpleView = (title, items, type) => (
    <section className="panel simple-section">
      <div className="section-header">
        <div>
          <span className="section-kicker">MÓDULO</span>
          <h3>{title}</h3>
        </div>

        <button className="refresh-btn" onClick={loadData}>
          Actualizar
        </button>
      </div>

      {items.length === 0 ? (
        <p className="empty-text">
          {loading ? "Cargando información..." : `No hay ${title.toLowerCase()} registrados.`}
        </p>
      ) : (
        <div className="cards-list">
          {items.map((item) => (
            <div className="data-card" key={item._id || item.id}>
              {type === "drivers" && (
                <>
                  <div className="card-title-row">
                    <h4>{item.nombre || item.name || "Chofer sin nombre"}</h4>
                    <span className={`tag ${item.activo === false ? "incident" : "done"}`}>
                      {item.activo === false ? "Inactivo" : "Activo"}
                    </span>
                  </div>
                  <p><strong>RUT:</strong> {item.rut || "-"}</p>
                  <p><strong>Teléfono:</strong> {item.telefono || item.phone || "-"}</p>
                </>
              )}

              {type === "vehicles" && (
                <>
                  <div className="card-title-row">
                    <h4>{item.patente || item.placa || "Vehículo sin patente"}</h4>
                    <span className={`tag ${item.activo === false ? "incident" : "done"}`}>
                      {item.activo === false ? "Inactivo" : "Activo"}
                    </span>
                  </div>
                  <p><strong>Marca:</strong> {item.marca || "-"}</p>
                  <p><strong>Modelo:</strong> {item.modelo || "-"}</p>
                </>
              )}

              {type === "incidents" && (
                <>
                  <div className="card-title-row">
                    <h4>{item.cliente || "Sin cliente"}</h4>
                    <span className="tag incident">Incidencia</span>
                  </div>
                  <p><strong>Tipo:</strong> {item.tipoIncidencia || "-"}</p>
                  <p><strong>Dirección:</strong> {item.direccion || "-"}</p>
                  <p><strong>Detalle:</strong> {item.observacion || "-"}</p>
                </>
              )}

              {type === "deliveries" && (
                <>
                  <div className="card-title-row">
                    <h4>{item.cliente || "Sin cliente"}</h4>
                    <span className={`tag ${getStatusClass(normalizeStatus(item.estado))}`}>
                      {normalizeStatus(item.estado)}
                    </span>
                  </div>
                  <p><strong>Dirección:</strong> {item.direccion || "-"}</p>
                  <p><strong>Fecha:</strong> {formatDate(item.fecha || item.createdAt)}</p>
                  <p><strong>Chofer:</strong> {item.chofer || "-"}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-mark">MR&amp;B</div>
          <div className="brand-copy">
            <strong>Control Tower</strong>
            <span>Visibilidad operativa logística</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-status panel">
          <div className="status-line">
            <span>Estado</span>
            <strong>Operativo</strong>
          </div>
          <div className="status-line">
            <span>Backend</span>
            <strong>{backendOnline ? "Online" : "Offline"}</strong>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar panel">
          <div className="topbar-left">
            <span className="topbar-chip">MR&B System</span>
            <span className="topbar-chip">Última milla</span>
            <span className="topbar-chip">Santiago</span>
          </div>

          <div className="topbar-right">
            <span className={`topbar-badge ${backendOnline ? "ok" : "off"}`}>
              {backendOnline ? "Sistema activo" : "Sistema offline"}
            </span>
          </div>
        </header>

        {activeView === "dashboard" && renderDashboard()}
        {activeView === "deliveries" &&
          renderSimpleView("Entregas", deliveries, "deliveries")}
        {activeView === "drivers" &&
          renderSimpleView("Choferes", drivers, "drivers")}
        {activeView === "vehicles" &&
          renderSimpleView("Vehículos", vehicles, "vehicles")}
        {activeView === "incidents" &&
          renderSimpleView(
            "Incidencias",
            deliveries.filter(
              (d) => normalizeStatus(d.estado).toLowerCase() === "incidencia"
            ),
            "incidents"
          )}
          {activeView === "recruit" && <RecruitPage />}
      </main>
    </div>
  );
}

export default App;