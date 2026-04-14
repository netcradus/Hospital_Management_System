import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the existing server or change PORT in server/.env.`);
      process.exit(1);
    }

    throw error;
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
