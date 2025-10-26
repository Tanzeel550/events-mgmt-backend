require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");

const { errorController } = require("./controllers/errorController");
const eventsRouter = require("./routes/eventsRouter");
const authRouter = require("./routes/authRouter");
const bookingRouter = require("./routes/bookingRouter");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// API Routes
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use(errorController);

// MongoDB Connection
mongoose
	.connect(process.env.DB_LINK, { useNewUrlParser: true })
	.then(() => console.log("✅ MongoDB connected"))
	.catch((err) => console.error("⛔ Database connection failed:", err));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
