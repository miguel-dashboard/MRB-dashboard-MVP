import { useCallback, useEffect, useMemo, useState } from "react";
import RecruitTable from "./RecruitTable";
import {
  getRecruitApplicants,
  updateRecruitApplicant,
  updateRecruitApplicantStatus,
} from "./recruitApi";

const terminalStatuses = new Set(["aprobado", "rechazado", "convertido_a_chofer"]);

function toLocalDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value) {
  if (!value) return "Sin registrar";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registrar";

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function RecruitPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [operationFilter, setOperationFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [followupForm, setFollowupForm] = useState({
    asignadoA: "",
    proximaAccion: "",
    fechaProximaAccion: "",
  });

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

  function selectApplicant(applicant) {
    setSelectedApplicant(applicant);
    setFollowupForm({
      asignadoA: applicant.asignadoA || "",
      proximaAccion: applicant.proximaAccion || "",
      fechaProximaAccion: toLocalDateTimeInput(applicant.fechaProximaAccion),
    });
  }

  function replaceApplicant(updatedApplicant) {
    setApplicants((currentApplicants) =>
      currentApplicants.map((applicant) =>
        applicant._id === updatedApplicant._id ? updatedApplicant : applicant
      )
    );

    if (selectedApplicant?._id === updatedApplicant._id) {
      setSelectedApplicant(updatedApplicant);
      setFollowupForm({
        asignadoA: updatedApplicant.asignadoA || "",
        proximaAccion: updatedApplicant.proximaAccion || "",
        fechaProximaAccion: toLocalDateTimeInput(
          updatedApplicant.fechaProximaAccion
        ),
      });
    }
  }

  async function handleStatusChange(applicantId, estado) {
    setUpdatingId(applicantId);
    setError("");

    try {
      const response = await updateRecruitApplicantStatus(applicantId, estado);
      replaceApplicant(response.applicant);
      return response.applicant;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveFollowup() {
    if (!selectedApplicant) return;

    setUpdatingId(selectedApplicant._id);
    setError("");

    try {
      const response = await updateRecruitApplicant(selectedApplicant._id, {
        asignadoA: followupForm.asignadoA.trim(),
        proximaAccion: followupForm.proximaAccion.trim(),
        fechaProximaAccion: followupForm.fechaProximaAccion
          ? new Date(followupForm.fechaProximaAccion).toISOString()
          : null,
      });

      replaceApplicant(response.applicant);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkContacted() {
    if (!selectedApplicant) return;
    await handleStatusChange(selectedApplicant._id, "contactado");
  }

  const operationApplicants = useMemo(
    () =>
      applicants.filter((applicant) =>
        operationFilter === "todas"
          ? true
          : applicant.operacion === operationFilter
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

  const kpis = useMemo(() => {
    const now = Date.now();

    const withoutContact = operationApplicants.filter(
      (applicant) =>
        !applicant.fechaPrimerContacto &&
        !terminalStatuses.has(applicant.estado)
    ).length;

    const urgentWithoutContact = operationApplicants.filter((applicant) => {
      if (
        applicant.fechaPrimerContacto ||
        terminalStatuses.has(applicant.estado) ||
        !applicant.createdAt
      ) {
        return false;
      }

      return now - new Date(applicant.createdAt).getTime() >= 6 * 60 * 60 * 1000;
    }).length;

    const overdue = operationApplicants.filter((applicant) => {
      if (
        !applicant.fechaProximaAccion ||
        terminalStatuses.has(applicant.estado)
      ) {
        return false;
      }

      return new Date(applicant.fechaProximaAccion).getTime() < now;
    }).length;

    return [
      { label: "Total postulantes", value: operationApplicants.length },
      {
        label: "Nuevos",
        value: operationApplicants.filter(
          (applicant) => applicant.estado === "nuevo"
        ).length,
      },
      { label: "Sin contactar", value: withoutContact },
      { label: "Urgentes +6h", value: urgentWithoutContact },
      { label: "Acciones vencidas", value: overdue },
      {
        label: "Aprobados",
        value: operationApplicants.filter(
          (applicant) => applicant.estado === "aprobado"
        ).length,
      },
    ];
  }, [operationApplicants]);

  return (
    <section className="panel table-section recruit-section">
      <div className="section-header">
        <div>
          <span className="section-kicker">MR&amp;B RECRUIT</span>
          <h3>Postulantes transportistas</h3>
          <p className="recruit-description">
            Captación y seguimiento para que ningún móvil interesado quede sin gestión.
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
              <option value="Starken - Hub Las Condes">Starken - Hub Las Condes</option>
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
              <option value="convertido_a_chofer">Convertido a chofer</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </label>
        </div>

        <span className="recruit-filter-count">
          {filteredApplicants.length} postulante
          {filteredApplicants.length === 1 ? "" : "s"}
        </span>
      </div>

      {selectedApplicant && (
        <div className="recruit-followup-card">
          <div className="recruit-followup-header">
            <div>
              <span className="section-kicker">SEGUIMIENTO</span>
              <h4>
                {[selectedApplicant.nombre, selectedApplicant.apellido]
                  .filter(Boolean)
                  .join(" ") || "Postulante"}
              </h4>
              <p>
                {selectedApplicant.operacion || "Sin operación"} ·{" "}
                {selectedApplicant.telefono || selectedApplicant.whatsapp || "Sin teléfono"}
              </p>
            </div>

            <button
              type="button"
              className="recruit-followup-close"
              onClick={() => setSelectedApplicant(null)}
            >
              Cerrar
            </button>
          </div>

          <div className="recruit-followup-meta">
            <div>
              <span>Ingresó</span>
              <strong>{formatDateTime(selectedApplicant.createdAt)}</strong>
            </div>
            <div>
              <span>Primer contacto</span>
              <strong>{formatDateTime(selectedApplicant.fechaPrimerContacto)}</strong>
            </div>
            <div>
              <span>Fuente</span>
              <strong>{selectedApplicant.fuente || "Sin fuente"}</strong>
            </div>
            <div>
              <span>Campaña</span>
              <strong>
                {selectedApplicant.utmCampaign ||
                  selectedApplicant.campaignName ||
                  "Sin campaña"}
              </strong>
            </div>
          </div>

          <div className="recruit-followup-form">
            <label>
              <span>Responsable</span>
              <input
                value={followupForm.asignadoA}
                onChange={(event) =>
                  setFollowupForm((current) => ({
                    ...current,
                    asignadoA: event.target.value,
                  }))
                }
                placeholder="Ej: Ricardo / Coordinador captación"
              />
            </label>

            <label>
              <span>Próxima acción</span>
              <input
                value={followupForm.proximaAccion}
                onChange={(event) =>
                  setFollowupForm((current) => ({
                    ...current,
                    proximaAccion: event.target.value,
                  }))
                }
                placeholder="Ej: solicitar documentos"
              />
            </label>

            <label>
              <span>Fecha próxima acción</span>
              <input
                type="datetime-local"
                value={followupForm.fechaProximaAccion}
                onChange={(event) =>
                  setFollowupForm((current) => ({
                    ...current,
                    fechaProximaAccion: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="recruit-followup-actions">
            <button
              type="button"
              className="recruit-action-btn status"
              disabled={updatingId === selectedApplicant._id}
              onClick={handleSaveFollowup}
            >
              Guardar seguimiento
            </button>

            <button
              type="button"
              className="recruit-action-btn whatsapp"
              disabled={
                updatingId === selectedApplicant._id ||
                Boolean(selectedApplicant.fechaPrimerContacto)
              }
              onClick={handleMarkContacted}
            >
              {selectedApplicant.fechaPrimerContacto
                ? "Contacto registrado"
                : "Marcar contactado ahora"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="recruit-error">{error}</p>}

      <RecruitTable
        applicants={filteredApplicants}
        loading={loading}
        updatingId={updatingId}
        onStatusChange={handleStatusChange}
        onViewApplicant={selectApplicant}
      />
    </section>
  );
}

export default RecruitPage;
