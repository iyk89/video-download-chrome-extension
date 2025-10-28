// background.js — Diagnostic build
console.log("🟣 Background service worker active");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📥 Background received message:", message);

  if (message.action === "download_video") {
    const videoUrl = message.url;
    const apiUrl = `https://localhost:3000/download?url=${encodeURIComponent(videoUrl)}`;

    console.log("🎯 Preparing fetch to backend:", apiUrl);

    fetch(apiUrl)
      .then(response => {
        console.log("📦 Response status:", response.status, response.statusText);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        console.log("💾 Blob received, size:", blob.size);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video.mp4";
        a.click();
        window.URL.revokeObjectURL(url);
        console.log("✅ Download triggered successfully.");
        sendResponse({ status: "ok" });
      })
      .catch(err => {
        console.error("❌ Fetch failed:", err);
        sendResponse({ status: "error", message: err.message });
      });

    // Keep message channel open for async
    return true;
  }

  console.warn("⚠️ Unknown action:", message.action);
});
