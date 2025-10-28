// ---------- secure_server.js ----------
import express from "express";
import ytdl from "ytdl-core";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import https from "https";
import fs from "fs";
import path from "path";

const app = express();

// ===== Security Middlewares =====
app.use(helmet());
app.use(express.json());

const corsOptions = {
  origin: [
    "chrome-extension://*",
    "https://localhost:3000",
    "https://yt-downloader.local:3000"
  ],
  methods: ["GET"],
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: "Too many requests, please try again later."
});
app.use(limiter);

// ===== Download Endpoint =====
app.get("/download", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).send("Invalid YouTube URL");
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");

    console.log(`[${new Date().toISOString()}] ▶ Download from ${req.ip}: ${title}`);

    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.header("Cache-Control", "no-store");
    res.header("Pragma", "no-cache");

    ytdl(url, { quality: "highest" }).pipe(res);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).send("Download failed");
  }
});

// ===== HTTPS Server =====
const certDir = path.resolve("./");
const options = {
  key: fs.readFileSync(path.join(certDir, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(certDir, "localhost.pem"))
};

https.createServer(options, app).listen(3000, () => {
  console.log("✅ HTTPS server running at:");
  console.log("   https://localhost:3000");
  console.log("   https://yt-downloader.local:3000");
});