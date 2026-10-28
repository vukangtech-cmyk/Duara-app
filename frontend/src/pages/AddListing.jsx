import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";
import ImageUploader from "../components/ImageUploader.jsx";
import { TANZANIA_REGIONS, POPULAR_INSTITUTIONS } from "../utils/format.js";
import Loader from "../components/Loader.jsx";

export default function AddListing() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("bidhaa"); // 'bidhaa' or 'huduma'
  const [price, setPrice] = useState("");
  const [region, setRegion] = useState(profile?.region || "Dar es Salaam");
  const [institution, setInstitution] = useState(profile?.institution || "Mtu Binafsi / Nje ya Chuo");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [phone, setPhone] = useState(profile?.phone || "");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCategories() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, icon")
          .order("sort_order", { ascending: true });

        if (error) throw error;
        setCategories(data || []);
        if (data && data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        console.warn("Hitilafu:", err.message);
      } finally {
        setLoadingCats(false);
      }
    }

    loadCategories();
  }, []);

  // Sync profile data if loaded
  useEffect(() => {
    if (profile?.region) setRegion(profile.region);
    if (profile?.institution) setInstitution(profile.institution);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Tafadhali ingia kwenye akaunti kwanza.");
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage("Tafadhali weka jina kamili la tangazo (angalau herufi 3).");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Tafadhali toa maelezo ya kina ya unachouza (angalau herufi 10).");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Tafadhali weka namba yako ya simu/WhatsApp ili wanunuzi wakupate.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Update user profile phone if updated
      if (phone.trim() !== profile?.phone) {
        await supabase
          .from("profiles")
          .update({
            phone: phone.trim(),
            region: region,
            institution: institution
          })
          .eq("id", user.id);
        await refreshProfile();
      }

      // 2. Insert new listing
      const payload = {
        seller_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        category_id: categoryId || null,
        type,
        images,
        region,
        institution,
        status: "active",
        is_featured: false,
        views_count: 0
      };

      const { data, error } = await supabase
        .from("listings")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Navigate to the newly created listing
      navigate(`/bidhaa/${data.id}`);
    } catch (err) {
      console.error("Hitilafu ya kuweka tangazo:", err);
      setErrorMessage(err.message || "Hitilafu imetokea wakati wa kuweka tangazo.");
      setSubmitting(false);
    }
  };

  if (loadingCats) {
    return <Loader message="Inatayarisha fomu ya tangazo..." />;
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "800",
          color: "var(--ink-heading, #0f172a)",
          margin: "0 0 6px 0"
        }}>
          ➕ Weka Tangazo Jipya Sokoni
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted, #64748b)", margin: 0 }}>
          Tangaza bidhaa au huduma yako bure. Wanunuzi watawasiliana nawe moja kwa moja kwa WhatsApp.
        </p>
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
        onSubmit={handleSubmit}
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
        {/* Aina ya Tangazo: Bidhaa au Huduma */}
        <div>
          <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "8px" }}>
            Aina ya Tangazo *
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "10px",
              border: type === "bidhaa" ? "2px solid var(--primary, #10b981)" : "1px solid var(--line, #cbd5e1)",
              backgroundColor: type === "bidhaa" ? "rgba(16, 185, 129, 0.05)" : "transparent",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}>
              <input
                type="radio"
                name="type"
                value="bidhaa"
                checked={type === "bidhaa"}
                onChange={() => setType("bidhaa")}
              />
              <span>📦 Nauza Bidhaa</span>
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "10px",
              border: type === "huduma" ? "2px solid #3b82f6" : "1px solid var(--line, #cbd5e1)",
              backgroundColor: type === "huduma" ? "rgba(59, 130, 246, 0.05)" : "transparent",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}>
              <input
                type="radio"
                name="type"
                value="huduma"
                checked={type === "huduma"}
                onChange={() => setType("huduma")}
              />
              <span>🛠️ Natoa Huduma</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
            Jina la {type === "huduma" ? "Huduma" : "Bidhaa"} *
          </label>
          <input
            type="text"
            required
            placeholder={type === "huduma" ? "Mfano: Ufundi wa Simu na Kompyuta (Flashing & Screen Replacement)" : "Mfano: HP EliteBook 840 G5 - Core i5, 8GB RAM, 256GB SSD"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
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
              placeholder="Mfano: 450000 (Weka 0 kama ni maelewano)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "14px",
                outline: "none"
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
              Chuo / Jamii (Hiari)
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

        {/* WhatsApp Phone */}
        <div>
          <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
            Namba ya Simu / WhatsApp kwa Wanunuzi *
          </label>
          <input
            type="tel"
            required
            placeholder="Mfano: 0755123456 au 255755123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
          <small style={{ color: "var(--muted, #64748b)", display: "block", marginTop: "4px", fontSize: "12px" }}>
            Namba hii itatumika kukuunganisha moja kwa moja na wanunuzi kupitia WhatsApp.
          </small>
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
            Maelezo ya Kina *
          </label>
          <textarea
            required
            rows="5"
            placeholder="Eleza hali ya bidhaa (mpya au imetumika), vipengele maalum, sababu ya kuuza, au eneo kamili la kukutana..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none",
              resize: "vertical",
              lineHeight: "1.5"
            }}
          />
        </div>

        {/* Image Uploader */}
        <ImageUploader images={images} onChange={setImages} maxImages={4} />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "14px 24px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "var(--primary, #10b981)",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "700",
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            marginTop: "10px"
          }}
        >
          {submitting ? "Inapakia tangazo..." : "Chapisha Tangazo Lako Bure →"}
        </button>
      </form>
    </div>
  );
}
