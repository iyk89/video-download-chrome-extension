import express from "express";
import cors from "cors";
import ytdl from "ytdl-core";
import https from "https";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ YouTube Downloader API is live!");
});

app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
      return res.status(400).send("Invalid YouTube URL");
    }

    console.log("🎬 Fetching:", videoUrl);

    const info = await ytdl.getInfo(videoUrl, {
      requestOptions: { agent: new https.Agent({ keepAlive: true }) }
    });

    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_") || "video";

    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.header("Content-Type", "video/mp4");

    const stream = ytdl(videoUrl, {
      format: "mp4",
      quality: "highest",
      requestOptions: { agent: new https.Agent({ keepAlive: true }) }
    });

    stream.on("error", (err) => {
      console.error("❌ Stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).send("Stream error: " + err.message);
      } else {
        res.destroy(err);
      }
    });

    stream.pipe(res);
  } catch (err) {
    console.error("❌ Download failed:", err.message);
    res.status(500).send("Download failed: " + err.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
