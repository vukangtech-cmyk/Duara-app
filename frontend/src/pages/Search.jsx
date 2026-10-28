import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import ListingCard from "../components/ListingCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import { TANZANIA_REGIONS, POPULAR_INSTITUTIONS } from "../utils/format.js";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States from URL or defaults
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const typeParam = searchParams.get("type") || "all";
  const regionParam = searchParams.get("region") || "";
  const institutionParam = searchParams.get("institution") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  // Local form inputs
  const [keyword, setKeyword] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);
  const [type, setType] = useState(typeParam);
  const [region, setRegion] = useState(regionParam);
  const [institution, setInstitution] = useState(institutionParam);
  const [sort, setSort] = useState(sortParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);

  // Load categories list
  useEffect(() => {
    async function loadCats() {
      if (!supabase) return;
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      setCategories(data || []);
    }
    loadCats();
  }, []);

  // Update local states when URL changes
  useEffect(() => {
    setKeyword(queryParam);
    setCategory(categoryParam);
    setType(typeParam);
    setRegion(regionParam);
    setInstitution(institutionParam);
    setSort(sortParam);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
  }, [queryParam, categoryParam, typeParam, regionParam, institutionParam, sortParam, minPriceParam, maxPriceParam]);

  // Execute database query
  const executeSearch = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      let q = supabase
        .from("listings")
        .select(`
          id,
          title,
          description,
          price,
          type,
          images,
          region,
          institution,
          is_featured,
          created_at,
          category_id,
          profiles (
            id,
            display_name,
            phone,
            avatar_url
          )
        `)
        .eq("status", "active");

      // Text search in title or description
      if (queryParam.trim()) {
        q = q.or(`title.ilike.%${queryParam.trim()}%,description.ilike.%${queryParam.trim()}%`);
      }

      // Category filter
      if (categoryParam) {
        q = q.eq("category_id", categoryParam);
      }

      // Type filter
      if (typeParam && typeParam !== "all") {
        q = q.eq("type", typeParam);
      }

      // Region filter
      if (regionParam) {
        q = q.eq("region", regionParam);
      }

      // Institution filter
      if (institutionParam) {
        q = q.eq("institution", institutionParam);
      }

      // Min price
      if (minPriceParam && !isNaN(Number(minPriceParam))) {
        q = q.gte("price", Number(minPriceParam));
      }

      // Max price
      if (maxPriceParam && !isNaN(Number(maxPriceParam))) {
        q = q.lte("price", Number(maxPriceParam));
      }

      // Sorting
      if (sortParam === "price_asc") {
        q = q.order("price", { ascending: true });
      } else if (sortParam === "price_desc") {
        q = q.order("price", { ascending: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }

      const { data, error } = await q.limit(60);
      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.warn("Hitilafu ya utafutaji:", err.message);
    } finally {
      setLoading(false);
    }
  }, [queryParam, categoryParam, typeParam, regionParam, institutionParam, sortParam, minPriceParam, maxPriceParam]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (category) params.set("category", category);
    if (type && type !== "all") params.set("type", type);
    if (region) params.set("region", region);
    if (institution) params.set("institution", institution);
    if (sort) params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setKeyword("");
    setCategory("");
    setType("all");
    setRegion("");
    setInstitution("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setSearchParams({});
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "800",
          color: "var(--ink-heading, #0f172a)",
          margin: "0 0 6px 0"
        }}>
          🔍 Tafuta Sokoni
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted, #64748b)", margin: 0 }}>
          Tumia vichungi hapa chini kupata bidhaa au huduma kwa urahisi kulingana na eneo lako au chuo chako.
        </p>
      </div>

      {/* Filter Form Card */}
      <form
        onSubmit={handleApplyFilters}
        style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "16px",
          padding: "18px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}
      >
        {/* Main Search Input */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "4px" }}>
            Neno Muhimu la Kutafuta
          </label>
          <input
            type="text"
            placeholder="Mfano: Samsung Galaxy, Meza ya kusomea, Ufundi simu..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        {/* Filter Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px"
        }}>
          {/* Category Dropdown */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Kategoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            >
              <option value="">Kategoria Zote</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Aina ya Tangazo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            >
              <option value="all">Vyote (Bidhaa na Huduma)</option>
              <option value="bidhaa">Bidhaa Pekee</option>
              <option value="huduma">Huduma Pekee</option>
            </select>
          </div>

          {/* Region Dropdown */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Mkoa / Eneo
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            >
              <option value="">Mikoa Yote</option>
              {TANZANIA_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Institution Dropdown */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Chuo / Jamii
            </label>
            <select
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            >
              <option value="">Vyuo na Sehemu Zote</option>
              {POPULAR_INSTITUTIONS.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Bei ya Chini (TSh)
            </label>
            <input
              type="number"
              placeholder="Mf. 5,000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            />
          </div>

          {/* Max Price */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Bei ya Juu (TSh)
            </label>
            <input
              type="number"
              placeholder="Mf. 500,000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            />
          </div>

          {/* Sorting */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Panga Kwa (Sort)
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            >
              <option value="newest">Mpya Kwanza</option>
              <option value="price_asc">Bei: Ndogo kwenda Kubwa</option>
              <option value="price_desc">Bei: Kubwa kwenda Ndogo</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "6px" }}>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "transparent",
              color: "var(--muted, #64748b)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Futa Vichungi
          </button>
          <button
            type="submit"
            style={{
              padding: "9px 22px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--primary, #10b981)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Tafuta Sasa
          </button>
        </div>
      </form>

      {/* Results Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", margin: 0 }}>
          Matokeo ya Utafutaji ({listings.length})
        </h2>
      </div>

      {/* Results Grid or Empty State */}
      {loading ? (
        <Loader message="Inatafuta matangazo..." />
      ) : listings.length === 0 ? (
        <EmptyState
          title="Hakuna bidhaa inayolingana na utafutaji wako"
          description="Jaribu kubadilisha jina la unachotafuta au kulegeza vichungi vya kategoria au eneo."
          actionText="Onyesha Matangazo Yote"
          actionLink="/tafuta"
          icon="🔎"
        />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "16px"
        }}>
          {listings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}
