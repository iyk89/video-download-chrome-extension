import express from "express";
import cors from "cors";
import { spawn } from "child_process";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Video Downloader API is live!");
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("Missing 'url' parameter");

  console.log("🎬 Requesting:", videoUrl);

  try {
    const args = [
      "-o", "-",
      "-f", "best[ext=mp4]/best",
      "--no-warnings",
      "--quiet",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
      "--referer", "https://www.youtube.com/",
      videoUrl
    ];

    const ytdlp = spawn("yt-dlp", args);

    res.header("Content-Type", "video/mp4");
    res.header("Content-Disposition", "attachment; filename=video.mp4");

    ytdlp.stdout.pipe(res);

    let stderr = "";
    ytdlp.stderr.on("data", d => (stderr += d.toString()));

    ytdlp.on("close", code => {
      if (code !== 0) {
        console.error("❌ yt-dlp failed:", stderr || `exit code ${code}`);
        if (!res.headersSent) res.status(500).send(`Download failed: ${stderr || code}`);
      } else {
        console.log("✅ Stream complete");
      }
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    if (!res.headersSent) res.status(500).send("Server error: " + err.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
