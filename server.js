const mongoose = require("mongoose");

require("dotenv").config();
const app = require("./app");

const DB = process.env.DB_CONNECTION_STRING.replace(
  "<password>",
  process.env.DB_PASSWORD
);

// CONNECT TO MONGODB
mongoose
  .connect(DB)
  .catch((error) =>
    console.error("Error occured on initial connection: " + error)
  );

// LISTEN FOR ERRORS DURING CONNECTION
mongoose.connection.on("connected", () =>
  console.log("Mongoose has connected SUCCESSFULLY to MongoDB")
);

mongoose.connection.on("error", (error) =>
  console.error(
    "Error occured after initial connection has been established: " + error
  )
);

mongoose.connection.on("disconnected", () =>
  console.error("Mongoose had disconnected from MongoDB")
);

// SETUP SERVER TO RUN ON PORT SPECIFIED IN .ENV FILE
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App is listening on: http://127.0.0.1:${port}`);
});

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});

process.on("uncaughtException", function (er) {
  console.error(er.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
  server.close(() => {
    process.exit(1);
  });
});
