function DeliveryTable({ deliveries, onEdit, onDelete }) {
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Sin fecha'

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return 'Fecha inválida'

    return date.toLocaleDateString('es-CL')
  }

  return (
    <section className="table-section">
      <h2>Listado de entregas</h2>

      <table className="deliveries-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Dirección</th>
            <th>Fecha</th>
            <th>Chofer</th>
            <th>Vehículo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {deliveries.length > 0 ? (
            deliveries.map((delivery) => (
              <tr key={delivery._id}>
                <td>{delivery.id || 'Sin ID'}</td>
                <td>{delivery.cliente}</td>
                <td>{delivery.direccion}</td>
                <td>{formatDate(delivery.fecha)}</td>
                <td>{delivery.chofer || 'Sin chofer'}</td>
                <td>{delivery.vehiculo || 'Sin vehículo'}</td>
                <td>
                  <span className={`status ${getStatusClass(delivery.estado)}`}>
                    {delivery.estado}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="save-btn"
                      type="button"
                      onClick={() => onEdit(delivery)}
                    >
                      Editar
                    </button>

                    <button
                      className="cancel-btn"
                      type="button"
                      onClick={() => onDelete(delivery)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No hay entregas registradas</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}

function getStatusClass(estado) {
  if (estado === 'Entregada') return 'entregada'
  if (estado === 'Pendiente') return 'pendiente'
  if (estado === 'Incidencia') return 'incidencia'
  return ''
}

export default DeliveryTable