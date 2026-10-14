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

function formatElapsed(createdAt) {
  if (!createdAt) return "Sin hora";

  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();

  if (Number.isNaN(created.getTime()) || diffMs < 0) return "Recién ingresado";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 0)} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function getFollowup(applicant) {
  if (applicant.estado === "aprobado") {
    return { label: "Aprobado", className: "done" };
  }

  if (applicant.estado === "convertido_a_chofer") {
    return { label: "Convertido", className: "done" };
  }

  if (applicant.estado === "rechazado") {
    return { label: "Cerrado", className: "closed" };
  }

  if (applicant.fechaPrimerContacto) {
    return { label: "Contactado", className: "done" };
  }

  const created = new Date(applicant.createdAt || 0);
  const elapsedHours = (Date.now() - created.getTime()) / 3600000;

  if (elapsedHours >= 6) {
    return {
      label: `Urgente · ${formatElapsed(applicant.createdAt)}`,
      className: "critical",
    };
  }

  if (elapsedHours >= 2) {
    return {
      label: `Sin contacto · ${formatElapsed(applicant.createdAt)}`,
      className: "warning",
    };
  }

  return {
    label: `Nuevo · ${formatElapsed(applicant.createdAt)}`,
    className: "new",
  };
}

function RecruitTableRow({ applicant, isUpdating, onStatusChange, onViewApplicant }) {
  const [selectedStatus, setSelectedStatus] = useState(applicant.estado || "nuevo");
  const applicantName = getApplicantName(applicant);
  const whatsappUrl = getWhatsAppUrl(applicant);
  const followup = getFollowup(applicant);

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
      <td>{applicant.asignadoA || "Sin asignar"}</td>
      <td>
        <span className={`recruit-followup-badge ${followup.className}`}>
          {followup.label}
        </span>
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
            <th>Responsable</th>
            <th>Seguimiento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {applicants.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan="9">
                {loading ? "Cargando postulantes..." : "No hay postulantes registrados."}
              </td>
            </tr>
          ) : (
            applicants.map((applicant) => (
              <RecruitTableRow
                applicant={applicant}
                isUpdating={updatingId === applicant._id}
                key={`${applicant._id}-${applicant.estado}-${applicant.fechaPrimerContacto || ""}`}
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
