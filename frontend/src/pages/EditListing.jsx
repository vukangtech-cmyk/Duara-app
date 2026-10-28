import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";
import ImageUploader from "../components/ImageUploader.jsx";
import { TANZANIA_REGIONS, POPULAR_INSTITUTIONS } from "../utils/format.js";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [notFound, setNotFound] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("bidhaa");
  const [price, setPrice] = useState("");
  const [region, setRegion] = useState("Dar es Salaam");
  const [institution, setInstitution] = useState("Mtu Binafsi / Nje ya Chuo");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("active");

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!supabase || !id) return;
      try {
        // Load categories
        const { data: cats } = await supabase.from("categories").select("*").order("sort_order");
        setCategories(cats || []);

        // Load listing
        const { data: listing, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error || !listing) {
          setNotFound(true);
          return;
        }

        // Check ownership or admin
        if (user && listing.seller_id !== user.id && !isAdmin) {
          setErrorMessage("Huna ruhusa ya kuhariri tangazo hili.");
          setNotFound(true);
          return;
        }

        setTitle(listing.title || "");
        setCategoryId(listing.category_id || "");
        setType(listing.type || "bidhaa");
        setPrice(String(listing.price || "0"));
        setRegion(listing.region || "Dar es Salaam");
        setInstitution(listing.institution || "Mtu Binafsi / Nje ya Chuo");
        setDescription(listing.description || "");
        setImages(Array.isArray(listing.images) ? listing.images : []);
        setStatus(listing.status || "active");
      } catch (err) {
        console.warn("Hitilafu:", err.message);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, user, isAdmin]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage("Tafadhali jaza jina na maelezo ya tangazo.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const updates = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        category_id: categoryId || null,
        type,
        images,
        region,
        institution,
        status,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      navigate(`/bidhaa/${id}`);
    } catch (err) {
      setErrorMessage(err.message || "Haikuweza kuhifadhi mabadiliko.");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Je, una uhakika unataka kufuta tangazo hili kabisa?")) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      navigate("/mimi");
    } catch (err) {
      alert("Haikuweza kufuta tangazo: " + err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader message="Inapakia tangazo kwa ajili ya kuhariri..." />;
  }

  if (notFound) {
    return (
      <EmptyState
        title="Tangazo Halikupatikana"
        description="Huenda tangazo hili halipo au huna ruhusa ya kulihariri."
        actionText="Rudi kwenye Akaunti Yangu"
        actionLink="/mimi"
      />
    );
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "var(--ink-heading, #0f172a)",
            margin: "0 0 4px 0"
          }}>
            ✏️ Hariri Tangazo
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted, #64748b)", margin: 0 }}>
            Badilisha maelezo, bei, picha au weka alama imeshauzwa.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: "8px 16px",
            backgroundColor: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#e11d48",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: deleting ? "not-allowed" : "pointer"
          }}
        >
          {deleting ? "Inafuta..." : "🗑️ Futa Tangazo Hili"}
        </button>
      </div>

      {errorMessage && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fee2e2",
          color: "#b91c1c",
          padding: "12px 16px",
          borderRadius: "10px",
          marginBottom: "20px",
          fontSize: "14px"
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleUpdate}
        style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        {/* Hali ya Tangazo (Status) */}
        <div>
          <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "8px" }}>
            Hali ya Tangazo Sokoni
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "8px",
              border: status === "active" ? "2px solid #10b981" : "1px solid #cbd5e1",
              backgroundColor: status === "active" ? "rgba(16, 185, 129, 0.08)" : "transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600"
            }}>
              <input
                type="radio"
                name="status"
                value="active"
                checked={status === "active"}
                onChange={() => setStatus("active")}
              />
              <span>🟢 Bado Lipo (Active)</span>
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "8px",
              border: status === "sold" ? "2px solid #f59e0b" : "1px solid #cbd5e1",
              backgroundColor: status === "sold" ? "rgba(245, 158, 11, 0.08)" : "transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600"
            }}>
              <input
                type="radio"
                name="status"
                value="sold"
                checked={status === "sold"}
                onChange={() => setStatus("sold")}
              />
              <span>🤝 Imeshauzwa (Sold)</span>
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "8px",
              border: status === "hidden" ? "2px solid #64748b" : "1px solid #cbd5e1",
              backgroundColor: status === "hidden" ? "rgba(100, 116, 139, 0.08)" : "transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600"
            }}>
              <input
                type="radio"
                name="status"
                value="hidden"
                checked={status === "hidden"}
                onChange={() => setStatus("hidden")}
              />
              <span>🔒 Ficha (Hidden)</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
            Jina la Tangazo *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Category & Price */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
              Kategoria *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "14px"
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
              Bei (TSh) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "14px"
              }}
            />
          </div>
        </div>

        {/* Region & Institution */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
              Mkoa / Eneo *
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "14px"
              }}
            >
              {TANZANIA_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
              Chuo / Jamii
            </label>
            <select
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "14px"
              }}
            >
              {POPULAR_INSTITUTIONS.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
            Maelezo ya Kina *
          </label>
          <textarea
            required
            rows="5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              resize: "vertical",
              lineHeight: "1.5"
            }}
          />
        </div>

        {/* Images */}
        <ImageUploader images={images} onChange={setImages} maxImages={4} />

        {/* Submit */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(`/bidhaa/${id}`)}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "transparent",
              color: "var(--muted, #64748b)",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Ghairi
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "var(--primary, #10b981)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "700",
              cursor: submitting ? "not-allowed" : "pointer"
            }}
          >
            {submitting ? "Inahifadhi..." : "Hifadhi Mabadiliko"}
          </button>
        </div>
      </form>
    </div>
  );
}
