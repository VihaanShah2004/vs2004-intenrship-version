const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // Import path for handling file paths
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, "../client")));

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");

    // Start the server after connecting to the database
    app.listen(3000, () => {
        console.log("Server listening on port 3000");
    });
});

// Routes
const vidavaRoutes = require("./routes/vidavaroutes");
const authRoutes = require("./routes/authRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
app.use("/api", vidavaRoutes);
app.use("/auth", authRoutes);
app.use("/api", recommendationRoutes);

// Handle 404 for undefined API routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
        return res.status(404).json({ message: "API route not found" });
    }
    next();
});

// Handle other routes (HTML files)
// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../client", "index.html"))
// });
