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
  if (!videoUrl) {
    return res.status(400).send("Missing 'url' parameter");
  }

  console.log("🎬 Fetching:", videoUrl);

  try {
    const ytdlp = spawn("yt-dlp", [
      "-o", "-",
      "-f", "mp4",
      "--no-warnings",
      "--quiet",
      videoUrl
    ]);

    res.header("Content-Type", "video/mp4");
    res.header("Content-Disposition", "attachment; filename=video.mp4");

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on("data", (data) => {
      console.error("⚠️ yt-dlp error:", data.toString());
    });

    ytdlp.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ yt-dlp exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).send("Download failed");
        }
      } else {
        console.log("✅ Stream complete");
      }
    });
  } catch (err) {
    console.error("❌ Server error:", err.message);
    if (!res.headersSent) {
      res.status(500).send("Server error: " + err.message);
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
