import { useState } from "react";

const applicantStatuses = [
  "nuevo",
  "en_revision",
  "contactado",
  "interesado",
  "documentacion_pendiente",
  "aprobado",
  "convertido_a_chofer",
  "rechazado",
];

const statusLabels = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  contactado: "Contactado",
  interesado: "Interesado",
  documentacion_pendiente: "Documentación pendiente",
  aprobado: "Aprobado",
  convertido_a_chofer: "Convertido a chofer",
  rechazado: "Rechazado",
};

const priorityLabels = {
  alta: "Alta",
  media: "Normal",
  baja: "Baja",
};

const documentKeys = [
  "cedula",
  "licenciaConducir",
  "padronVehiculo",
  "permisoCirculacion",
  "revisionTecnica",
  "soap",
];

function getDocumentProgress(applicant) {
  const received = documentKeys.filter(
    (key) => Boolean(applicant.documentacion?.[key])
  ).length;

  return { received, total: documentKeys.length };
}

function getApplicantName(applicant) {
  return [applicant.nombre, applicant.apellido].filter(Boolean).join(" ") || "Sin nombre";
}

function getWhatsAppUrl(applicant) {
  const phone = String(applicant.whatsapp || applicant.telefono || "").replace(/\D/g, "");
  const message = `Hola ${applicant.nombre || ""}, te contactamos desde MR&B Recruit.`;

  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}

function getRecruitStatusClass(status) {
  if (status === "aprobado" || status === "convertido_a_chofer") return "done";
  if (status === "rechazado") return "incident";
  if (status === "contactado" || status === "interesado") return "route";
  return "pending";
}

function getPriorityClass(priority) {
  if (priority === "alta") return "critical";
  if (priority === "baja") return "done";
  return "warning";
}

function formatDuration(ms) {
  const totalMinutes = Math.max(Math.round(Math.abs(ms) / 60000), 1);

  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 24) {
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function getFollowup(applicant) {
  if (applicant.estado === "convertido_a_chofer") {
    return { label: "Convertido", className: "done" };
  }

  if (applicant.estado === "rechazado") {
    return { label: "Cerrado", className: "closed" };
  }

  if (!applicant.fechaProximaAccion) {
    return {
      label: applicant.fechaPrimerContacto ? "Definir siguiente paso" : "Sin fecha",
      className: "warning",
    };
  }

  const dueAt = new Date(applicant.fechaProximaAccion);
  if (Number.isNaN(dueAt.getTime())) {
    return { label: "Fecha inválida", className: "warning" };
  }

  const remaining = dueAt.getTime() - Date.now();

  if (remaining < 0) {
    return {
      label: `Vencida · ${formatDuration(remaining)}`,
      className: "critical",
    };
  }

  if (remaining <= 2 * 60 * 60 * 1000) {
    return {
      label: `Vence en ${formatDuration(remaining)}`,
      className: "warning",
    };
  }

  return {
    label: `En ${formatDuration(remaining)}`,
    className: "new",
  };
}

function RecruitTableRow({ applicant, isUpdating, onStatusChange, onViewApplicant }) {
  const [selectedStatus, setSelectedStatus] = useState(applicant.estado || "nuevo");
  const applicantName = getApplicantName(applicant);
  const whatsappUrl = getWhatsAppUrl(applicant);
  const followup = getFollowup(applicant);
  const documents = getDocumentProgress(applicant);

  return (
    <tr>
      <td>{applicantName}</td>
      <td>{applicant.telefono || applicant.whatsapp || "-"}</td>
      <td>{applicant.comuna || "-"}</td>
      <td>{applicant.tipoVehiculo || "-"}</td>
      <td>{applicant.operacion || "Sin operación"}</td>
      <td>
        <span className={`tag ${getRecruitStatusClass(applicant.estado)}`}>
          {statusLabels[applicant.estado] || applicant.estado || "Nuevo"}
        </span>
      </td>
      <td>
        <span className={`recruit-followup-badge ${getPriorityClass(applicant.prioridad)}`}>
          {priorityLabels[applicant.prioridad] || "Normal"}
        </span>
      </td>
      <td>{applicant.asignadoA || "Sin asignar"}</td>
      <td>
        <span
          className={`recruit-followup-badge ${
            documents.received === documents.total ? "done" : "new"
          }`}
        >
          {documents.received}/{documents.total}
        </span>
      </td>
      <td>
        <div className="recruit-next-action">
          <strong>{applicant.proximaAccion || "Sin próxima acción"}</strong>
          <span className={`recruit-followup-badge ${followup.className}`}>
            {followup.label}
          </span>
        </div>
      </td>
      <td>
        <div className="recruit-actions">
          {whatsappUrl ? (
            <a
              className="recruit-action-btn whatsapp"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          ) : (
            <span className="recruit-action-btn disabled">Sin teléfono</span>
          )}

          <button
            className="recruit-action-btn view"
            onClick={() => onViewApplicant?.(applicant)}
            type="button"
          >
            Gestionar
          </button>

          <label className="recruit-status-control">
            <span className="sr-only">Nuevo estado para {applicantName}</span>
            <select
              aria-label={`Nuevo estado para ${applicantName}`}
              disabled={isUpdating}
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              {applicantStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <button
            className="recruit-action-btn status"
            disabled={isUpdating || selectedStatus === applicant.estado}
            onClick={() => onStatusChange(applicant._id, selectedStatus)}
            type="button"
          >
            {isUpdating ? "Guardando..." : "Cambiar estado"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function RecruitTable({ applicants, loading, updatingId, onStatusChange, onViewApplicant }) {
  return (
    <div className="table-wrap recruit-table-wrap">
      <table className="recruit-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Comuna</th>
            <th>Tipo vehículo</th>
            <th>Operación</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Responsable</th>
            <th>Documentos</th>
            <th>Próxima acción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {applicants.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan="11">
                {loading ? "Cargando postulantes..." : "No hay postulantes registrados."}
              </td>
            </tr>
          ) : (
            applicants.map((applicant) => (
              <RecruitTableRow
                applicant={applicant}
                isUpdating={updatingId === applicant._id}
                key={`${applicant._id}-${applicant.estado}-${applicant.fechaProximaAccion || ""}`}
                onStatusChange={onStatusChange}
                onViewApplicant={onViewApplicant}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RecruitTable;
