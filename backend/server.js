const path = require("node:path");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const bookingRoutes = require("./routes/bookingRoutes");
const app = express();
const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    "http://localhost:5500",
    "http://127.0.0.1:5500",
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
    }),
);
app.use(express.json());
app.use("/api", bookingRoutes);

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ success: false, error: "Request body must be valid JSON." });
    }

    console.error("API request failed:", error);
    return res.status(500).json({ success: false, error: "Internal server error." });
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
    console.log(`Backend API listening on port ${port}`);
});
