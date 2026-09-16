// Shared Feed Helpers & Media Saving Utilities for THE CIRCLE

export const FB_REACTIONS = [
  { id: "like", emoji: "👍", labelSw: "Napenda", labelEn: "Like", color: "#1877f2" },
  { id: "love", emoji: "❤️", labelSw: "Upendo", labelEn: "Love", color: "#f43f5e" },
  { id: "haha", emoji: "😂", labelSw: "Kicheko", labelEn: "Haha", color: "#f59e0b" },
  { id: "wow", emoji: "😮", labelSw: "Kushangaa", labelEn: "Wow", color: "#f59e0b" },
  { id: "sad", emoji: "😢", labelSw: "Huzuni", labelEn: "Sad", color: "#eab308" },
  { id: "angry", emoji: "😡", labelSw: "Hasira", labelEn: "Angry", color: "#ef4444" },
  { id: "kick", emoji: "👊", labelSw: "Kigongo", labelEn: "Kick", color: "#10b981" }
];

/* Media Download Helper */
export async function downloadMedia(url, filename = "circle_media.mp4") {
  if (!url) return false;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}

/* Local Saved Media / Bookmarks Store */
export function getSavedMedia() {
  try {
    const saved = localStorage.getItem("circle_saved_media_v1");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveMediaItem(item) {
  try {
    const current = getSavedMedia();
    const exists = current.some((x) => x.id === item.id);
    let updated;
    if (exists) {
      updated = current.filter((x) => x.id !== item.id);
    } else {
      updated = [{ ...item, savedAt: new Date().toISOString() }, ...current];
    }
    localStorage.setItem("circle_saved_media_v1", JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}
