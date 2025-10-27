import express from "express";
import ytdl from "ytdl-core";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// === Security middleware ===
app.use(helmet());
app.use(express.json());

const corsOptions = {
  origin: [
    "chrome-extension://*",    // extension
    "http://localhost:3000",   // local testing
    "https://localhost:3000"
  ],
  methods: ["GET"],
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));

// === Rate limit (30 req / 10 min per IP) ===
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many requests, please try again later."
});
app.use(limiter);

// === Download route ===
app.get("/download", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).send("Invalid YouTube URL");
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");
    console.log(`[${new Date().toISOString()}] ▶ ${req.ip} -> ${title}`);

    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.header("Cache-Control", "no-store");
    res.header("Pragma", "no-cache");

    ytdl(url, { quality: "highest" }).pipe(res);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).send("Download failed");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
