import { useCallback, useEffect, useState } from "react";
import RecruitTable from "./RecruitTable";
import { getRecruitApplicants, updateRecruitApplicantStatus } from "./recruitApi";

function RecruitPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

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

      {error && <p className="recruit-error">{error}</p>}

      <RecruitTable
        applicants={applicants}
        loading={loading}
        updatingId={updatingId}
        onStatusChange={handleStatusChange}
      />
    </section>
  );
}

export default RecruitPage;