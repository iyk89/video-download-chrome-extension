chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 Message received in background script:", message);

  if (message.action === "download_video") {
    const videoUrl = message.url;
    const apiUrl = `https://localhost:3000/download?url=${encodeURIComponent(videoUrl)}`;
    console.log("🎬 Sending download request to:", apiUrl);

    try {
      fetch(apiUrl)
        .then(response => {
          console.log("🧾 Response status:", response.status);
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
          console.error(err.stack);
        })
        .finally(() => {
          console.log("🏁 Fetch finished.");
        });
    } catch (err) {
      console.error("🚨 Exception before fetch:", err.message);
    }
  }
});
