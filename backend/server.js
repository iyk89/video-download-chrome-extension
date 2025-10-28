import express from "express";
import cors from "cors";
import https from "https";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Local HTTPS server for Video Downloader is live!");
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("Missing 'url' parameter");
  console.log("🎬 Requesting:", videoUrl);

  try {
    const ytdlp = spawn("yt-dlp", [
      "-o", "-",
      "-f", "best[ext=mp4]/best",
      "--quiet",
      videoUrl
    ]);

    res.header("Content-Type", "video/mp4");
    res.header("Content-Disposition", "attachment; filename=video.mp4");
    ytdlp.stdout.pipe(res);

    ytdlp.on("close", (code) => {
      if (code !== 0) {
        console.error("❌ yt-dlp exited with code:", code);
        if (!res.headersSent) res.status(500).send("Download failed");
      }
    });
  } catch (err) {
    console.error("❌ Error:", err);
    if (!res.headersSent) res.status(500).send("Server error");
  }
});

const certDir = path.resolve("./");
const options = {
  key: fs.readFileSync(path.join(certDir, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(certDir, "localhost.pem")),
};

https.createServer(options, app).listen(3000, () => {
  console.log("✅ HTTPS server running at:");
  console.log("   https://localhost:3000");
  console.log("   https://yt-downloader.local:3000");
});
