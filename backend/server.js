require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const internalAccess = require("./middleware/internalAccess");

const deliveryRoutes = require("./models/routes/deliveryRoutes");
const driverRoutes = require("./models/routes/driverRoutes");
const vehicleRoutes = require("./models/routes/vehicleRoutes");
const dashboardRoutes = require("./models/routes/dashboardRoutes");
const recruitApplicantRoutes = require("./models/routes/recruitApplicantRoutes");
const operationDayRoutes = require("./models/routes/operationDayRoutes");
const incidentRoutes = require("./models/routes/incidentRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(internalAccess);
app.use(cors());
app.use("/api/recruit/applicants", (req, res, next) => {
  if (req.method === "POST" && req.path === "/") return express.json({ limit: "16kb" })(req, res, next);
  return next();
});
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API MR&B funcionando correctamente" });
});

app.use("/api/deliveries", deliveryRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/recruit/applicants", recruitApplicantRoutes);
app.use("/api/operation-days", operationDayRoutes);
app.use("/api/incidents", incidentRoutes);

if (require.main === module) {
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB conectado correctamente");

    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error al conectar con MongoDB:", error);
  });
}

module.exports = app;
