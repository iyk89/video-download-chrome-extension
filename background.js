chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "download_video") {
    const videoUrl = message.url;
    const apiUrl = `http://localhost:3000/download?url=${encodeURIComponent(videoUrl)}`;
    console.log("🎬 Download request for:", apiUrl);

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) throw new Error("Server not reachable");
        return response.url;
      })
      .then(finalUrl => {
        chrome.downloads.download({
          url: finalUrl,
          filename: "video.mp4",
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Download failed:", chrome.runtime.lastError.message);
          } else {
            console.log("✅ Download started with ID:", downloadId);
          }
        });
      })
      .catch(err => {
        console.error("❌ Could not reach local server:", err.message);
      });
  }
});
