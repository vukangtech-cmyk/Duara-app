import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { formatPrice, formatRelativeDate, buildWhatsAppLink } from "../utils/format.js";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ListingCard from "../components/ListingCard.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Report Form State
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("Utapeli / Udanganyifu");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Copy/Share feedback
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadListing() {
      if (!supabase || !id) return;
      setLoading(true);
      setErrorMsg("");

      try {
        const { data, error } = await supabase
          .from("listings")
          .select(`
            id,
            seller_id,
            title,
            description,
            price,
            type,
            images,
            region,
            institution,
            status,
            is_featured,
            views_count,
            created_at,
            category_id,
            categories (
              id,
              name,
              slug,
              icon
            ),
            profiles (
              id,
              display_name,
              username,
              phone,
              institution,
              region,
              avatar_url,
              created_at
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          if (mounted) {
            setListing(null);
            setErrorMsg("Tangazo hili halikupatikana au limeshafutwa.");
          }
          return;
        }

        if (mounted) {
          setListing(data);
          setActiveImageIndex(0);

          // Increment view count in background
          supabase
            .from("listings")
            .update({ views_count: (data.views_count || 0) + 1 })
            .eq("id", id)
            .then(() => {})
            .catch(() => {});

          // Fetch related listings from the same category
          if (data.category_id) {
            const { data: related } = await supabase
              .from("listings")
              .select(`
                id,
                title,
                price,
                type,
                images,
                region,
                institution,
                is_featured,
                created_at,
                profiles (id, display_name, phone)
              `)
              .eq("category_id", data.category_id)
              .neq("id", id)
              .eq("status", "active")
              .limit(4);

            if (mounted) setRelatedListings(related || []);
          }
        }
      } catch (err) {
        if (mounted) setErrorMsg(err.message || "Hitilafu imetokea.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadListing();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Angalia "${listing.title}" kwa ${formatPrice(listing.price)} kwenye Duara Sokoni Tanzania:`,
          url
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(`/ingia?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setReportSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        listing_id: listing.id,
        reason: reportReason,
        details: reportDetails,
        status: "pending"
      });

      if (error) throw error;
      setReportSuccess(true);
      setShowReportForm(false);
    } catch (err) {
      alert("Haikuweza kuwasilisha ripoti: " + err.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Inapakia taarifa za bidhaa..." />;
  }

  if (errorMsg || !listing) {
    return (
      <EmptyState
        title="Tangazo Halikupatikana"
        description={errorMsg || "Tangazo hili huenda limefutwa au halipatikani tena."}
        actionText="Rudi Sokoni"
        actionLink="/"
        icon="🔍"
      />
    );
  }

  const isOwner = user?.id === listing.seller_id;
  const seller = listing.profiles;
  const sellerPhone = seller?.phone;
  const images = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [];
  const currentImageUrl = images[activeImageIndex] || null;
  const whatsappUrl = sellerPhone ? buildWhatsAppLink(sellerPhone, listing.title, window.location.href) : null;

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        color: "var(--muted, #64748b)",
        marginBottom: "16px",
        flexWrap: "wrap"
      }}>
        <Link to="/" style={{ color: "var(--muted, #64748b)", textDecoration: "none" }}>Nyumbani</Link>
        <span>/</span>
        {listing.categories ? (
          <>
            <Link to={`/tafuta?category=${listing.category_id}`} style={{ color: "var(--muted, #64748b)", textDecoration: "none" }}>
              {listing.categories.name}
            </Link>
            <span>/</span>
          </>
        ) : null}
        <span style={{ color: "var(--ink-heading, #0f172a)", fontWeight: "600" }}>{listing.title}</span>
      </nav>

      {/* Main Layout Grid (2 Columns on Desktop) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "28px",
        marginBottom: "36px"
      }}>
        {/* Left Column: Image Gallery */}
        <div>
          <div style={{
            position: "relative",
            width: "100%",
            paddingTop: "75%",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "#f1f5f9",
            border: "1px solid var(--line, #e2e8f0)",
            boxShadow: "var(--shadow-sm)"
          }}>
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={listing.title}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  backgroundColor: "#ffffff"
                }}
              />
            ) : (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "8px",
                color: "#94a3b8"
              }}>
                <span style={{ fontSize: "56px" }}>{listing.type === "huduma" ? "🛠️" : "📦"}</span>
                <span style={{ fontSize: "14px", fontWeight: "500" }}>Picha haijawekwa</span>
              </div>
            )}

            {/* Badges */}
            <div style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              display: "flex",
              gap: "8px"
            }}>
              <span style={{
                backgroundColor: listing.type === "huduma" ? "#3b82f6" : "#10b981",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "700",
                padding: "4px 10px",
                borderRadius: "6px"
              }}>
                {listing.type === "huduma" ? "🛠️ Huduma" : "📦 Bidhaa"}
              </span>

              {listing.is_featured && (
                <span style={{
                  backgroundColor: "#f59e0b",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "6px"
                }}>
                  ⭐ Tangazo Maalum
                </span>
              )}
            </div>

            {listing.status === "sold" && (
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: "900",
                letterSpacing: "1px"
              }}>
                IMESHAUZWA
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div style={{
              display: "flex",
              gap: "10px",
              marginTop: "12px",
              overflowX: "auto",
              paddingBottom: "4px"
            }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: activeImageIndex === idx ? "2px solid var(--primary, #10b981)" : "1px solid var(--line, #cbd5e1)",
                    padding: 0,
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Listing Details & Seller Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header & Price Card */}
          <div style={{
            backgroundColor: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            border: "1px solid var(--line, #e2e8f0)",
            padding: "20px",
            boxShadow: "var(--shadow-sm)"
          }}>
            <h1 style={{
              fontSize: "clamp(20px, 3vw, 26px)",
              fontWeight: "800",
              color: "var(--ink-heading, #0f172a)",
              lineHeight: "1.3",
              margin: "0 0 10px 0"
            }}>
              {listing.title}
            </h1>

            <div style={{
              fontSize: "26px",
              fontWeight: "900",
              color: "var(--primary, #10b981)",
              marginBottom: "14px"
            }}>
              {formatPrice(listing.price)}
            </div>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              fontSize: "13px",
              color: "var(--muted, #64748b)",
              paddingTop: "12px",
              borderTop: "1px solid var(--line, #f1f5f9)"
            }}>
              <div>📍 <strong>Eneo:</strong> {listing.region || "Tanzania"}</div>
              {listing.institution && (
                <div>🏛️ <strong>Chuo/Taasisi:</strong> {listing.institution}</div>
              )}
              <div>🕒 <strong>Iliwekwa:</strong> {formatRelativeDate(listing.created_at)}</div>
              <div>👁️ <strong>Matazamo:</strong> {listing.views_count || 0}</div>
            </div>
          </div>

          {/* Seller Profile & Contact Card */}
          <div style={{
            backgroundColor: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            border: "1px solid var(--line, #e2e8f0)",
            padding: "20px",
            boxShadow: "var(--shadow-sm)"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--muted, #64748b)", textTransform: "uppercase", margin: "0 0 12px 0" }}>
              Taarifa za Muuzaji
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--primary, #10b981)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "700"
              }}>
                {seller?.display_name ? seller.display_name.charAt(0).toUpperCase() : "M"}
              </div>
              <div>
                <h4 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: "700", color: "var(--ink-heading, #0f172a)" }}>
                  {seller?.display_name || "Mwanachama wa Duara"}
                </h4>
                <div style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                  {seller?.institution || seller?.region || "Tanzania"}
                </div>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            {isOwner ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: "600"
                }}>
                  ✅ Hili ni tangazo lako.
                </div>
                <Link
                  to={`/hariri/${listing.id}`}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "var(--ink-heading, #0f172a)",
                    color: "#ffffff",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "14px"
                  }}
                >
                  ✏️ Hariri Tangazo Lako
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "14px",
                      borderRadius: "12px",
                      backgroundColor: "#22c55e",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontWeight: "700",
                      fontSize: "15px",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)"
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>💬</span>
                    <span>Wasiliana kwa WhatsApp</span>
                  </a>
                ) : (
                  <div style={{
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid var(--line, #cbd5e1)",
                    color: "var(--muted, #64748b)",
                    fontSize: "13px",
                    textAlign: "center"
                  }}>
                    Muuzaji hajaweka namba ya simu ya moja kwa moja.
                  </div>
                )}

                {/* In-app Message CTA */}
                <Link
                  to={seller?.id ? `/ujumbe?recipient=${seller.id}&listing=${listing.id}` : "/ujumbe"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "var(--card-bg, #f8fafc)",
                    border: "1px solid var(--line, #cbd5e1)",
                    color: "var(--ink, #1e293b)",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  <span>✉️ Tuma Ujumbe Sokoni</span>
                </Link>

                {seller?.id && (
                  <Link
                    to={`/muuzaji/${seller.id}`}
                    style={{
                      textAlign: "center",
                      fontSize: "13px",
                      color: "var(--primary, #10b981)",
                      textDecoration: "none",
                      fontWeight: "600",
                      marginTop: "4px"
                    }}
                  >
                    Tazama matangazo mengine ya muuzaji huyu →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Share & Report Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleShare}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--card-bg, #ffffff)",
                color: "var(--ink, #1e293b)",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer"
              }}
            >
              <span>🔗</span>
              <span>{copiedLink ? "Kiungo Kimenakiliwa!" : "Shiriki Tangazo"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReportForm(!showReportForm)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #fecdd3",
                backgroundColor: "#fff1f2",
                color: "#e11d48",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              ⚠️ Toa Ripoti
            </button>
          </div>

          {/* Report Form Dropdown */}
          {showReportForm && (
            <form
              onSubmit={handleSubmitReport}
              style={{
                backgroundColor: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <h4 style={{ margin: "0", fontSize: "14px", color: "#9f1239", fontWeight: "700" }}>
                Toa Ripoti ya Tangazo Hili
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Tusaidie kuweka soko salama. Wasimamizi wetu watakagua tangazo hili mara moja.
              </p>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Sababu ya Ripoti
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                >
                  <option value="Utapeli / Udanganyifu">Utapeli au Udanganyifu</option>
                  <option value="Bei Isiyo Halisi au ya Kupotosha">Bei Isiyo Halisi / Ya Kupotosha</option>
                  <option value="Picha Zisizofaa au Zilizokopwa">Picha Zisizofaa au Zilizokopwa</option>
                  <option value="Bidhaa Imeshauzwa Lakini Haiondolewi">Bidhaa Imeshauzwa</option>
                  <option value="Bidhaa Haramu au Iliyopigwa Marufuku">Bidhaa Haramu / Marufuku</option>
                  <option value="Sababu Nyingine">Sababu Nyingine</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Maelezo ya Ziada (Hiari)
                </label>
                <textarea
                  rows="2"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Eleza kwa ufupi kwanini tangazo hili lina mashaka..."
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#e11d48",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: reportSubmitting ? "not-allowed" : "pointer"
                  }}
                >
                  {reportSubmitting ? "Inatuma..." : "Tuma Ripoti"}
                </button>
              </div>
            </form>
          )}

          {reportSuccess && (
            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px"
            }}>
              ✅ Asante. Ripoti yako imepokelewa na itakaguliwa na timu yetu ya usalama.
            </div>
          )}
        </div>
      </div>

      {/* Full Description Card */}
      <div style={{
        backgroundColor: "var(--card-bg, #ffffff)",
        borderRadius: "16px",
        border: "1px solid var(--line, #e2e8f0)",
        padding: "24px",
        marginBottom: "36px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "var(--ink-heading, #0f172a)",
          margin: "0 0 16px 0",
          borderBottom: "1px solid var(--line, #f1f5f9)",
          paddingBottom: "10px"
        }}>
          Maelezo ya Kina
        </h3>

        <div style={{
          fontSize: "15px",
          lineHeight: "1.7",
          color: "var(--ink, #334155)",
          whiteSpace: "pre-wrap"
        }}>
          {listing.description}
        </div>
      </div>

      {/* Safety Tips Card */}
      <div style={{
        backgroundColor: "#fffbeb",
        border: "1px solid #fef3c7",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "36px"
      }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "700", color: "#92400e" }}>
          💡 Mwongozo wa Manunuzi Salama
        </h4>
        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#78350f", lineHeight: "1.7" }}>
          <li>Usilipe au kutuma pesa mapema kabla ya kuona bidhaa ana kwa ana.</li>
          <li>Kutana na muuzaji maeneo ya umma yaliyo wazi (mfano geti la chuo, kituo cha basi, duka).</li>
          <li>Jaribu au kagua kifaa (mfano simu, kompyuta) kikamilifu kabla ya kukabidhi malipo.</li>
        </ul>
      </div>

      {/* Related Listings Section */}
      {relatedListings.length > 0 && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--ink-heading, #0f172a)" }}>
              Matangazo Mengi ya Kategoria Hii
            </h3>
            {listing.category_id && (
              <Link to={`/tafuta?category=${listing.category_id}`} style={{ fontSize: "13px", color: "var(--primary, #10b981)", textDecoration: "none", fontWeight: "600" }}>
                Tazama Zote →
              </Link>
            )}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px"
          }}>
            {relatedListings.map((rel) => (
              <ListingCard key={rel.id} listing={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
