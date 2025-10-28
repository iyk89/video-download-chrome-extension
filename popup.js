// popup.js — Diagnostic build
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("videoUrl");
  const button = document.getElementById("downloadBtn");

  console.log("🟢 Popup loaded");

  button.addEventListener("click", () => {
    const videoUrl = input.value.trim();
    console.log("📩 Popup click detected. URL:", videoUrl);

    if (!videoUrl) {
      alert("Please paste a YouTube URL.");
      console.warn("⚠️ No URL entered");
      return;
    }

    console.log("🚀 Sending message to background...");
    chrome.runtime.sendMessage({ action: "download_video", url: videoUrl }, (response) => {
      console.log("📬 Popup received response:", response);
    });
  });
});
