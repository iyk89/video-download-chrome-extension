(function () {
  const BUTTON_ID = "yt-download-btn";

  function createDownloadButton() {
    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.textContent = "⬇ Download Video";
    Object.assign(btn.style, {
      position: "absolute",
      top: "16px",
      left: "16px",
      zIndex: "9999",
      padding: "8px 12px",
      background: "#cc0000",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
    });
    btn.onclick = () => {
      chrome.runtime.sendMessage({
        action: "download_video",
        url: location.href,
      });
    };
    return btn;
  }

  function findActivePlayer() {
    const selectors = [
      "#movie_player",
      "ytd-player",
      "#shorts-player",
      "ytd-reel-video-renderer",
      ".html5-video-player",
      "video"
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function attachDownloadButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const player = findActivePlayer();
    if (!player) {
      console.log("Waiting for YouTube player...");
      setTimeout(attachDownloadButton, 1000);
      return;
    }

    if (getComputedStyle(player).position === "static") {
      player.style.position = "relative";
    }

    const btn = createDownloadButton();
    player.appendChild(btn);
    console.log("✅ Download button attached:", player);
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) attachDownloadButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  attachDownloadButton();
})();
