// backend/server.js — Diagnostic build
import express from "express";
import ytdl from "ytdl-core";
import cors from "cors";
import fs from "fs";
import https from "https";

const app = express();

console.log("🧩 Server initializing...");

app.use(cors({ origin: "*", methods: ["GET"] }));
app.use(express.json());

// --- Health check route ---
app.get("/", (req, res) => {
  console.log("✅ Health check hit");
  res.status(200).send("Server is alive.");
});

// --- Download route ---
app.get("/download", async (req, res) => {
  const url = req.query.url;
  console.log("🎬 /download route hit with:", url);

  if (!url) {
    console.error("❌ Missing URL parameter");
    return res.status(400).send("Missing URL");
  }

  try {
    if (!ytdl.validateURL(url)) {
      console.warn("⚠️ Invalid YouTube URL:", url);
      return res.status(400).send("Invalid YouTube URL");
    }

    console.log("🛰️ Valid URL confirmed, fetching info...");
    const info = await ytdl.getInfo(url);
    console.log("📘 Video title:", info.videoDetails.title);

    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");
    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
    console.log("📡 Streaming video to client...");

    ytdl(url, { quality: "highest" })
      .on("error", (err) => {
        console.error("🚨 Stream error:", err.message);
        res.status(500).send("Stream error");
      })
      .pipe(res)
      .on("close", () => console.log("✅ Stream completed successfully."));
  } catch (err) {
    console.error("🔥 Fatal error in /download:", err.message);
    res.status(500).send("Download failed.");
  }
});

// --- HTTPS server setup ---
const PORT = 3000;
const options = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`🟢 HTTPS server running on https://localhost:${PORT}`);
});
