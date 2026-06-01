import { useCallback, useEffect, useState } from "react";
import RecruitTable from "./RecruitTable";
import { getRecruitApplicants, updateRecruitApplicantStatus } from "./recruitApi";

function RecruitPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [operationFilter, setOperationFilter] = useState("todas");

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

  const filteredApplicants = applicants.filter((applicant) =>
    operationFilter === "todas"
      ? true
      : applicant.campaignName === operationFilter
  );

  return (
    <section className="panel table-section recruit-section">
      <div className="section-header">
        <div>
          <span className="section-kicker">MR&amp;B RECRUIT</span>
          <h3>Postulantes transportistas</h3>
          <p className="recruit-description">
            Captación y seguimiento inicial de candidatos para la operación
            logística.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadApplicants}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="recruit-toolbar">
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

        <span className="recruit-filter-count">
          {filteredApplicants.length} postulante
          {filteredApplicants.length === 1 ? "" : "s"}
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