chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "download_video") {
    const videoUrl = message.url;
    const apiUrl = `https://localhost:3000/download?url=${encodeURIComponent(videoUrl)}`;

    console.log("🎬 Sending download request to:", apiUrl);
    console.log("🚀 Fetch starting...");

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video.mp4";
        a.click();
        window.URL.revokeObjectURL(url);
        console.log("✅ Video download triggered.");
      })
      .catch(err => {
        console.error("❌ Download failed:", err.message);
        alert("Download failed: " + err.message);
      })
      .finally(() => {
        console.log("🏁 Fetch finished.");
      });
  }
});
