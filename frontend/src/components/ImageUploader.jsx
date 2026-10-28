import React, { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function ImageUploader({ images = [], onChange, maxImages = 4 }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      setUploadError(`Unaweza kupakia hadi picha ${maxImages} pekee.`);
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const newUrls = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`Faili ${file.name} sio picha halali.`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Picha ${file.name} inazidi ukubwa wa 5MB.`);
        }

        const ext = file.name.split(".").pop();
        const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = `${user?.id || "public"}/${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from("listing-images")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadErr) {
          throw uploadErr;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("listing-images")
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      onChange([...images, ...newUrls]);
    } catch (err) {
      console.error("Hitilafu ya kupakia picha:", err);
      setUploadError(err.message || "Hitilafu imetokea wakati wa kupakia picha.");
    } finally {
      setUploading(false);
      // Reset input value
      e.target.value = "";
    }
  };

  const handleRemove = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink-heading, #0f172a)" }}>
          Picha za Bidhaa / Huduma ({images.length}/{maxImages})
        </label>
        <span style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
          Upeo wa picha {maxImages} (hadi 5MB kila moja)
        </span>
      </div>

      {uploadError && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fee2e2",
          color: "#b91c1c",
          padding: "8px 12px",
          borderRadius: "8px",
          fontSize: "13px"
        }}>
          {uploadError}
        </div>
      )}

      {/* Grid of existing uploaded images and upload button */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "12px"
      }}>
        {images.map((url, idx) => (
          <div
            key={idx}
            style={{
              position: "relative",
              width: "100%",
              paddingTop: "100%",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid var(--line, #e2e8f0)",
              backgroundColor: "#f8fafc"
            }}
          >
            <img
              src={url}
              alt={`Picha ${idx + 1}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            {idx === 0 && (
              <span style={{
                position: "absolute",
                bottom: "4px",
                left: "4px",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "#ffffff",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px"
              }}>
                Kuu
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.9)",
                color: "#ffffff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
              title="Ondoa picha hii"
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label
            style={{
              position: "relative",
              width: "100%",
              paddingTop: "100%",
              borderRadius: "10px",
              border: "2px dashed var(--line-strong, #cbd5e1)",
              backgroundColor: "var(--card-bg, #f8fafc)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              transition: "border-color 0.2s"
            }}
          >
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: "var(--muted, #64748b)"
            }}>
              {uploading ? (
                <>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid #cbd5e1",
                    borderTopColor: "var(--primary, #10b981)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }} />
                  <span style={{ fontSize: "11px", fontWeight: "600" }}>Inapakia...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "24px" }}>📷</span>
                  <span style={{ fontSize: "11px", fontWeight: "600" }}>+ Ongeza</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
