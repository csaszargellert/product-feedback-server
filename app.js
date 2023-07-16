// OWN MODULES
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./helpers/AppError");
const { refreshTokenController } = require("./controllers/authController");
// THIRD PARTY MODULES
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    origin: "https://gellert-product-feedback.netlify.app",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/refresh-token", refreshTokenController);
// FEEDBACK ROUTES
app.use("/api/feedback", require("./routes/feedback"));
// USER ROUTES
app.use("/api/user", require("./routes/user"));

// DEFAULT ROUTE OF REQUESTS FOR UNDEFINED ROUTES AND METHODS
app.all("*", (req, res, next) => {
  const newError = new AppError("Can't get to the requested path.", 404);

  next(newError);
});

// HANDLE ALL OF THE ERRORS IN A SEPARATE ERROR HANDLER MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
