import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";
import { syncExistingPatientIds } from "./src/models/Patient.js";
import { syncExistingAppointmentIds } from "./src/models/Appointment.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDatabase();
  await syncExistingPatientIds();
  await syncExistingAppointmentIds();
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" || error.code === "EACCES") {
      console.error(
        `Port ${PORT} failed to listen (${error.code}: ${error.message}). Please change PORT in server/.env to an open port (e.g. 5001 or 5005).`
      );
      process.exit(1);
    }

    throw error;
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
