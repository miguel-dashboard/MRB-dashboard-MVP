const service = require("../services/smartDispatchService");
const { DispatchError } = require("../utils/smartDispatchValidation");

const handle = (action, status = 200) => async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    res.status(status).json(await action(req));
  } catch (error) {
    if (error instanceof DispatchError) {
      return res.status(error.status).json({ message: error.message, ...(error.day ? { day: error.day } : {}) });
    }
    if (["ValidationError", "CastError", "StrictModeError"].includes(error.name)) {
      return res.status(400).json({ message: "Datos inválidos para la jornada de despacho." });
    }
    res.status(500).json({ message: "No fue posible guardar o consultar Smart Dispatch. Intente nuevamente." });
  }
};

module.exports = {
  listDays: handle(() => service.listDays()),
  createDay: handle((req) => service.createDay(req.body), 201),
  getDay: handle((req) => service.getDay(req.params.id)),
  updateDay: handle((req) => service.updateDay(req.params.id, req.body)),
  addOrder: handle((req) => service.addOrder(req.params.id, req.body), 201),
  updateOrder: handle((req) => service.updateOrder(req.params.id, req.params.orderId, req.body)),
  scanPackage: handle((req) => service.scanPackage(req.params.id, req.body)),
};
