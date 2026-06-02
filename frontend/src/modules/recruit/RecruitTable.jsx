import { useState } from "react";

const applicantStatuses = [
  "nuevo",
  "contactado",
  "interesado",
  "documentacion_pendiente",
  "en_revision",
  "aprobado",
  "rechazado",
  "convertido_a_chofer",
];

const statusLabels = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  interesado: "Interesado",
  documentacion_pendiente: "Documentación pendiente",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  convertido_a_chofer: "Convertido a chofer",
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

function RecruitTableRow({ applicant, isUpdating, onStatusChange }) {
  const [selectedStatus, setSelectedStatus] = useState(applicant.estado || "nuevo");
  const applicantName = getApplicantName(applicant);
  const whatsappUrl = getWhatsAppUrl(applicant);

  return (
    <tr>
      <td>{applicantName}</td>
      <td>{applicant.telefono || applicant.whatsapp || "-"}</td>
      <td>{applicant.comuna || "-"}</td>
      <td>{applicant.tipoVehiculo || "-"}</td>
      <td>{applicant.campaignName || "Sin operación"}</td>
      <td>
        <span className={`tag ${getRecruitStatusClass(applicant.estado)}`}>
          {statusLabels[applicant.estado] || applicant.estado || "Nuevo"}
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
  className="recruit-action-btn approve"
  disabled={isUpdating || applicant.estado === "aprobado"}
  onClick={() => onStatusChange(applicant._id, "aprobado")}
  type="button"
>
  {applicant.estado === "aprobado" ? "Aprobado" : "Aprobar"}
</button>

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

function RecruitTable({ applicants, loading, updatingId, onStatusChange }) {
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
            <th>Acciones</th>
          
          </tr>
        </thead>
        <tbody>
          {applicants.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan="7">
                {loading ? "Cargando postulantes..." : "No hay postulantes registrados."}
              </td>
            </tr>
          ) : (
            applicants.map((applicant) => (
              <RecruitTableRow
                applicant={applicant}
                isUpdating={updatingId === applicant._id}
                key={`${applicant._id}-${applicant.estado}`}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RecruitTable;