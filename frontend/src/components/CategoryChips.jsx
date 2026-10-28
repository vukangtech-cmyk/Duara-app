import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function CategoryChips({ selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, icon, sort_order")
          .order("sort_order", { ascending: true });

        if (error) throw error;
        if (mounted) setCategories(data || []);
      } catch (err) {
        console.warn("Haikuweza kupakia kategoria:", err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading && categories.length === 0) {
    return (
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              height: "36px",
              width: "110px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              borderRadius: "20px",
              flexShrink: 0,
              animation: "pulse 1.2s infinite ease-in-out"
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        padding: "8px 0 12px 0",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch"
      }}
      className="no-scrollbar"
    >
      {/* "Zote" chip */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: "600",
          whiteSpace: "nowrap",
          border: selectedCategory === null ? "1px solid var(--primary, #10b981)" : "1px solid var(--line, #e2e8f0)",
          backgroundColor: selectedCategory === null ? "var(--primary, #10b981)" : "var(--card-bg, #ffffff)",
          color: selectedCategory === null ? "#ffffff" : "var(--ink, #1e293b)",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: selectedCategory === null ? "var(--shadow-sm)" : "none"
        }}
      >
        <span>🔥</span>
        <span>Zote</span>
      </button>

      {/* Real categories from database */}
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              whiteSpace: "nowrap",
              border: isSelected ? "1px solid var(--primary, #10b981)" : "1px solid var(--line, #e2e8f0)",
              backgroundColor: isSelected ? "var(--primary, #10b981)" : "var(--card-bg, #ffffff)",
              color: isSelected ? "#ffffff" : "var(--ink, #1e293b)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isSelected ? "var(--shadow-sm)" : "none"
            }}
          >
            {cat.icon && <span>{cat.icon}</span>}
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
