import https from "https";
import fs from "fs";
import express from "express";
import cors from "cors";
import ytdl from "ytdl-core";

const app = express();

// ===== SECURITY CONFIG =====
const CERT_PATH = "./localhost.pem";
const KEY_PATH = "./localhost-key.pem";

if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
  console.error("❌ SSL certificate missing. Run: mkcert localhost");
  process.exit(1);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith("chrome-extension://")) {
      return callback(null, true);
    }
    callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${ip}`);
  next();
});

function sanitizeFilename(name = "video") {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 100) || "video";
}

app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl || typeof videoUrl !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'url' query parameter." });
    }

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    const info = await ytdl.getInfo(videoUrl);
    const title = sanitizeFilename(info.videoDetails?.title || "video");
    const filename = `${title}.mp4`;

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = ytdl(videoUrl, { quality: "highest" });

    stream.on("error", (err) => {
      console.error("❌ Stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream video." });
      } else {
        res.destroy(err);
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("❌ Download handler error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

const httpsOptions = {
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH),
};

const PORT = 3000;

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`✅ Secure YouTube downloader listening on https://localhost:${PORT}`);
});
