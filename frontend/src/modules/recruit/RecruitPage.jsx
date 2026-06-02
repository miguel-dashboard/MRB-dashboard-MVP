import { useCallback, useEffect, useMemo, useState } from "react";
import RecruitTable from "./RecruitTable";
import { getRecruitApplicants, updateRecruitApplicantStatus } from "./recruitApi";

const recruitKpis = [
  { label: "Total postulantes", status: null },
  { label: "Nuevos", status: "nuevo" },
  { label: "En revisión", status: "en_revision" },
  { label: "Contactados", status: "contactado" },
  { label: "Aprobados", status: "aprobado" },
  { label: "Rechazados", status: "rechazado" },
];

function RecruitPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [operationFilter, setOperationFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");

  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getRecruitApplicants();
      setApplicants(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setApplicants([]);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  async function handleStatusChange(applicantId, estado) {
    setUpdatingId(applicantId);
    setError("");

    try {
      const response = await updateRecruitApplicantStatus(applicantId, estado);
      setApplicants((currentApplicants) =>
        currentApplicants.map((applicant) =>
          applicant._id === applicantId ? response.applicant : applicant
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const operationApplicants = useMemo(
    () =>
      applicants.filter((applicant) =>
        operationFilter === "todas"
          ? true
          : applicant.campaignName === operationFilter
      ),
    [applicants, operationFilter]
  );

  const filteredApplicants = useMemo(
    () =>
      operationApplicants.filter((applicant) =>
        statusFilter === "todos" ? true : applicant.estado === statusFilter
      ),
    [operationApplicants, statusFilter]
  );

  const kpis = recruitKpis.map((kpi) => ({
    ...kpi,
    value: kpi.status
      ? operationApplicants.filter((applicant) => applicant.estado === kpi.status)
          .length
      : operationApplicants.length,
  }));

  return (
    <section className="panel table-section recruit-section">
      <div className="section-header">
        <div>
          <span className="section-kicker">MR&amp;B RECRUIT</span>
          <h3>Postulantes transportistas</h3>
          <p className="recruit-description">
            Captación y seguimiento inicial de candidatos para la operación logística.
          </p>
        </div>

        <button className="refresh-btn" onClick={loadApplicants} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="recruit-kpi-grid">
        {kpis.map((kpi) => (
          <div className="recruit-kpi-card" key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
          </div>
        ))}
      </div>

      <div className="recruit-toolbar">
        <div className="recruit-filter-group">
          <label className="recruit-operation-filter">
            <span>Filtrar por operación</span>
            <select
              onChange={(event) => setOperationFilter(event.target.value)}
              value={operationFilter}
            >
              <option value="todas">Todas</option>
              <option value="Chilexpress">Chilexpress</option>
              <option value="Brightcell">Brightcell</option>
              <option value="Viña Concha y Toro">Viña Concha y Toro</option>
              <option value="Otra">Otra</option>
            </select>
          </label>

          <label className="recruit-status-filter">
            <span>Filtrar por estado</span>
            <select
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="todos">Todos</option>
              <option value="nuevo">Nuevo</option>
              <option value="en_revision">En revisión</option>
              <option value="contactado">Contactado</option>
              <option value="interesado">Interesado</option>
              <option value="documentacion_pendiente">Documentación pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </label>
        </div>

        <span className="recruit-filter-count">
          {filteredApplicants.length} postulante{filteredApplicants.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && <p className="recruit-error">{error}</p>}

      <RecruitTable
        applicants={filteredApplicants}
        loading={loading}
        updatingId={updatingId}
        onStatusChange={handleStatusChange}
      />
    </section>
  );
}

export default RecruitPage;