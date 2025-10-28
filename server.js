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

function normalizeYouTubeUrl(inputUrl = "") {
  let urlString = inputUrl.trim();
  if (!urlString) return urlString;

  try {
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = `https://${urlString}`;
    }

    const urlObj = new URL(urlString);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    if (hostname.endsWith("youtube.com") && urlObj.pathname.startsWith("/shorts/")) {
      const segments = urlObj.pathname.split("/").filter(Boolean);
      const videoId = segments[1];
      if (videoId) {
        urlObj.pathname = "/watch";
        urlObj.searchParams.set("v", videoId);
        console.log(`ℹ️ Normalized Shorts URL to watch format: ${videoId}`);
      }
    }

    return urlObj.toString();
  } catch (error) {
    console.warn("⚠️ Failed to normalize URL, using raw value.", error.message);
    return inputUrl;
  }
}

function sanitizeFilename(name = "video") {
  return name.replace(/[^\w\s-]/g, "_").replace(/\s+/g, " ").trim() || "video";
}

function shouldRetry(error) {
  if (!error) return false;
  const status = error.statusCode || error.status;
  if (status === 410 || status === 403) return true;
  const message = (error.message || "").toLowerCase();
  return message.includes("410") || message.includes("403") || message.includes("forbidden");
}

async function streamWithOptions({ videoUrl, res, options, label }) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(videoUrl, options);
    let started = false;

    const cleanup = () => {
      stream.removeAllListeners();
      res.removeListener("close", onClose);
    };

    const onClose = () => {
      stream.destroy();
    };

    stream.once("response", () => {
      started = true;
      console.log(`⬇️ ${label} stream started (${options.quality ?? "auto"})`);
      stream.pipe(res);
    });

    stream.once("end", () => {
      if (started) {
        console.log(`✅ ${label} stream completed`);
      }
      cleanup();
      resolve();
    });

    stream.once("error", (err) => {
      console.error(`❌ ${label} stream error:`, err.message || err);
      cleanup();
      if (!started) {
        reject(err);
      } else {
        res.destroy(err);
        resolve();
      }
    });

    res.once("close", onClose);
  });
}

// ===== Download Endpoint =====
app.get("/download", async (req, res) => {
  const requestTime = new Date().toISOString();

  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    const videoUrl = normalizeYouTubeUrl(rawUrl);

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    let info;
    try {
      info = await ytdl.getInfo(videoUrl);
    } catch (infoError) {
      console.error("❌ Metadata fetch failed:", infoError.message || infoError);
      return res.status(502).json({
        error: "Failed to retrieve video metadata",
        reason: infoError.message || String(infoError)
      });
    }

    const title = sanitizeFilename(info.videoDetails?.title);

    console.log(`[${requestTime}] ▶ Download from ${req.ip}: ${title}`);

    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");

    try {
      await streamWithOptions({
        videoUrl,
        res,
        options: { quality: "highest" },
        label: "Primary"
      });
    } catch (primaryError) {
      console.warn("⚠️ Primary stream failed:", primaryError.message || primaryError);

      if (shouldRetry(primaryError)) {
        console.warn("🔁 Retrying with fallback format (itag 18)");
        try {
          await streamWithOptions({
            videoUrl,
            res,
            options: { quality: "18" },
            label: "Fallback"
          });
          return;
        } catch (fallbackError) {
          console.error("❌ Fallback stream failed:", fallbackError.message || fallbackError);
          if (!res.headersSent) {
            return res.status(502).json({
              error: "Download failed",
              reason: fallbackError.message || String(fallbackError)
            });
          }
          return;
        }
      }

      if (!res.headersSent) {
        return res.status(502).json({
          error: "Download failed",
          reason: primaryError.message || String(primaryError)
        });
      }
      return;
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Download failed", reason: err.message || String(err) });
    }
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