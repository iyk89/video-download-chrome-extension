import express from "express";
import cors from "cors";
import ytdl from "ytdl-core";

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

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");

    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.header("Content-Type", "video/mp4");

    ytdl(videoUrl, {
      format: "mp4",
      quality: "highestvideo"
    }).pipe(res);
  } catch (err) {
    console.error("❌ Download failed:", err.message);
    res.status(500).send("Download failed");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
