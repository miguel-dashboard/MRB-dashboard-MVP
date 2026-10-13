import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3001/api/dashboard/summary";

function DashboardPage({ backendOnline }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("No se pudo cargar el Dashboard CEO");
      const data = await response.json();
      setSummary(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const cards = useMemo(() => {
    if (!summary) return [];

    return [
      {
        title: "Móviles activos",
        value: summary.fleet?.activeVehicles ?? 0,
        detail: "Vehículos registrados como activos",
      },
      {
        title: "Jornadas hoy",
        value: summary.operation?.todayJornadas ?? 0,
        detail: "Móviles con jornada registrada",
      },
      {
        title: "Cumplimiento",
        value: `${summary.operation?.cumplimiento ?? 0}%`,
        detail: "Entregados sobre paquetes asignados",
      },
      {
        title: "Paquetes entregados",
        value: summary.operation?.paquetesEntregados ?? 0,
        detail: "Volumen registrado en operación diaria",
      },
      {
        title: "Incidencias abiertas",
        value: summary.incidents?.open ?? 0,
        detail: "Casos que aún requieren gestión",
      },
      {
        title: "Impacto incidencias",
        value: `${summary.incidents?.impactMinutes ?? 0} min`,
        detail: "Tiempo operacional afectado",
      },
      {
        title: "Postulantes nuevos",
        value: summary.recruit?.new ?? 0,
        detail: "Leads esperando gestión comercial",
      },
      {
        title: "Aprobados Recruit",
        value: summary.recruit?.approved ?? 0,
        detail: "Candidatos listos para avanzar",
      },
    ];
  }, [summary]);

  if (loading && !summary) {
    return (
      <section className="panel simple-section">
        <span className="section-kicker">MR&B CONTROL TOWER</span>
        <h3>Cargando Dashboard CEO...</h3>
      </section>
    );
  }

  return (
    <>
      <section className="hero-strip panel">
        <div className="hero-strip-left">
          <span className="section-kicker">MR&B CONTROL TOWER</span>
          <h1>Control operacional y crecimiento en una sola vista</h1>
          <p>
            Operación diaria, incidencias, flota y captación de transportistas
            conectados para dirigir MR&B con datos.
          </p>
        </div>

        <div className="hero-strip-right">
          <div className="hero-mini-card">
            <span>Sistema</span>
            <strong>{backendOnline ? "Operativo" : "Con problemas"}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Backend</span>
            <strong>{backendOnline ? "Online" : "Offline"}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Choferes activos</span>
            <strong>{summary?.fleet?.activeDrivers ?? 0}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Incidencias críticas</span>
            <strong>{summary?.incidents?.critical ?? 0}</strong>
          </div>
        </div>
      </section>

      {error && <p className="recruit-error">{error}</p>}

      <section className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card panel" key={card.title}>
            <div className="stat-head">
              <span>{card.title}</span>
            </div>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </div>
        ))}
      </section>

      <section className="dashboard-business-grid">
        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">OPERACIONES</span>
              <h3>Rendimiento por cliente</h3>
            </div>
            <button className="refresh-btn" onClick={loadSummary}>
              Actualizar
            </button>
          </div>

          {summary?.operation?.operations?.length ? (
            <div className="list-stack">
              {summary.operation.operations.map((item) => (
                <div className="dashboard-operation-row" key={item.operacion}>
                  <div>
                    <strong>{item.operacion}</strong>
                    <p>
                      {item.jornadas} jornadas · {item.paquetesEntregados} entregados
                    </p>
                  </div>
                  <div className="dashboard-operation-values">
                    <span>{item.cumplimiento}%</span>
                    <small>{item.conProblema} con problema</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Aún no hay datos de operación diaria.</p>
          )}
        </div>

        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">CUELLO DE BOTELLA</span>
              <h3>Recruit — disponibilidad de móviles</h3>
            </div>
          </div>

          <div className="dashboard-funnel">
            <div><span>Total</span><strong>{summary?.recruit?.total ?? 0}</strong></div>
            <div><span>Nuevos</span><strong>{summary?.recruit?.new ?? 0}</strong></div>
            <div><span>Contactados</span><strong>{summary?.recruit?.contacted ?? 0}</strong></div>
            <div><span>Interesados</span><strong>{summary?.recruit?.interested ?? 0}</strong></div>
            <div><span>Documentos</span><strong>{summary?.recruit?.documentationPending ?? 0}</strong></div>
            <div><span>Aprobados</span><strong>{summary?.recruit?.approved ?? 0}</strong></div>
            <div><span>Convertidos</span><strong>{summary?.recruit?.converted ?? 0}</strong></div>
          </div>

          <div className="dashboard-recruit-operations">
            {(summary?.recruit?.byOperation || []).slice(0, 5).map((item) => (
              <div className="metric-row" key={item.operacion}>
                <div>
                  <h4>{item.operacion}</h4>
                  <p>Postulantes asociados</p>
                </div>
                <span className="row-value">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-business-grid">
        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">CAUSA RAÍZ</span>
              <h3>Impacto operacional</h3>
            </div>
          </div>

          <div className="metric-list">
            <div className="metric-row">
              <div>
                <h4>Incidencias totales</h4>
                <p>Problemas estructurados en Control Tower.</p>
              </div>
              <span className="row-value">{summary?.incidents?.total ?? 0}</span>
            </div>
            <div className="metric-row">
              <div>
                <h4>Origen bodega</h4>
                <p>Incidencias cuyo origen se identificó en bodega.</p>
              </div>
              <span className="row-value">{summary?.incidents?.warehouse ?? 0}</span>
            </div>
            <div className="metric-row">
              <div>
                <h4>Paquetes afectados</h4>
                <p>Volumen impactado por incidencias registradas.</p>
              </div>
              <span className="row-value">{summary?.incidents?.packagesAffected ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="panel section-card">
          <div className="block-header">
            <div>
              <span className="section-kicker">INCIDENCIAS RECIENTES</span>
              <h3>Qué necesita atención</h3>
            </div>
          </div>

          {summary?.incidents?.recent?.length ? (
            <div className="list-stack">
              {summary.incidents.recent.map((item) => (
                <div className="list-row" key={item._id}>
                  <div>
                    <strong>{item.operacion} · {item.tipo}</strong>
                    <p>{item.origen} · {item.estado}</p>
                  </div>
                  <span className="row-value">{item.impactoMinutos || 0} min</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No hay incidencias registradas.</p>
          )}
        </div>
      </section>
    </>
  );
}

export default DashboardPage;
