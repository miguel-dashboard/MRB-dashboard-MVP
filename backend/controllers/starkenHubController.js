const StarkenHubRecord = require("../models/StarkenHubRecord");

const numericFields = [
  "entregadas",
  "entregadasParciales",
  "devoluciones",
  "extraviados",
  "dineroRendir",
  "vouchersDevolver",
  "nominasRendidas",
  "encargosRetiro",
  "bultosRetiro",
  "pesoKg",
];

const normalizePayload = (body = {}) => {
  const payload = { ...body };

  numericFields.forEach((field) => {
    payload[field] = Number(body[field] || 0);
  });

  if (payload.tipoMovimiento === "rendicion") {
    payload.horaEmision = "";
    payload.horaDespacho = "";
    payload.origen = "";
    payload.destino = "";
    payload.encargosRetiro = 0;
    payload.bultosRetiro = 0;
    payload.pesoKg = 0;
  }

  if (payload.tipoMovimiento === "retiro") {
    payload.entregadas = 0;
    payload.entregadasParciales = 0;
    payload.devoluciones = 0;
    payload.extraviados = 0;
    payload.dineroRendir = 0;
    payload.vouchersDevolver = 0;
    payload.nominasRendidas = 0;
  }

  return payload;
};

const getRecords = async (req, res) => {
  try {
    const filter = {};

    if (req.query.movil) filter.movil = req.query.movil;
    if (req.query.tipoMovimiento) filter.tipoMovimiento = req.query.tipoMovimiento;

    if (req.query.month) {
      const [year, month] = String(req.query.month).split("-").map(Number);

      if (year && month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        filter.fecha = { $gte: start, $lt: end };
      }
    }

    const records = await StarkenHubRecord.find(filter).sort({
      fecha: -1,
      createdAt: -1,
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener registros de Starken Las Condes",
      error: error.message,
    });
  }
};

const createRecord = async (req, res) => {
  try {
    const record = await StarkenHubRecord.create(normalizePayload(req.body));
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({
      message: "Error al registrar movimiento de Starken Las Condes",
      error: error.message,
    });
  }
};

const updateRecord = async (req, res) => {
  try {
    const record = await StarkenHubRecord.findByIdAndUpdate(
      req.params.id,
      normalizePayload(req.body),
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar registro",
      error: error.message,
    });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const record = await StarkenHubRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    res.json({ message: "Registro eliminado correctamente" });
  } catch (error) {
    res.status(400).json({
      message: "Error al eliminar registro",
      error: error.message,
    });
  }
};

module.exports = {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
};
