require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const deliveryRoutes = require("./models/routes/deliveryRoutes");
const driverRoutes = require("./models/routes/driverRoutes");
const vehicleRoutes = require("./models/routes/vehicleRoutes");
const dashboardRoutes = require("./models/routes/dashboardRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API MR&B funcionando correctamente" });
});

app.use("/api/deliveries", deliveryRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/dashboard", dashboardRoutes);

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
