import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { formatRelativeDate } from "../utils/format.js";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const recipientParam = searchParams.get("recipient") || "";
  const listingParam = searchParams.get("listing") || "";

  const [activePartnerId, setActivePartnerId] = useState(recipientParam);
  const [activePartner, setActivePartner] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Load active partner profile if recipientParam exists
  useEffect(() => {
    async function loadPartnerInfo() {
      if (!supabase || !activePartnerId) return;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, phone, avatar_url, region")
          .eq("id", activePartnerId)
          .maybeSingle();

        setActivePartner(data || null);
      } catch (err) {
        console.warn("Hitilafu ya mwenzi:", err.message);
      }
    }
    loadPartnerInfo();
  }, [activePartnerId]);

  // 2. Load conversations list
  const loadConversations = async () => {
    if (!supabase || !user) {
      setLoadingConv(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          recipient_id,
          content,
          created_at,
          is_read,
          sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(id, display_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback without foreign key aliases if tables have default relations
        const { data: rawMessages } = await supabase
          .from("messages")
          .select("id, sender_id, recipient_id, content, created_at, is_read")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        processRawConversations(rawMessages || []);
        return;
      }

      processRawConversations(data || []);
    } catch (err) {
      console.warn("Hitilafu ya mazungumzo:", err.message);
    } finally {
      setLoadingConv(false);
    }
  };

  const processRawConversations = async (msgs) => {
    const partnerMap = new Map();
    const partnerIdsToFetch = new Set();

    msgs.forEach((m) => {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!partnerMap.has(otherId)) {
        partnerMap.set(otherId, {
          partnerId: otherId,
          lastMessage: m.content,
          timestamp: m.created_at,
          unread: !m.is_read && m.recipient_id === user.id
        });
        partnerIdsToFetch.add(otherId);
      }
    });

    if (activePartnerId && !partnerMap.has(activePartnerId)) {
      partnerMap.set(activePartnerId, {
        partnerId: activePartnerId,
        lastMessage: "Anza mazungumzo mapya...",
        timestamp: new Date().toISOString(),
        unread: false
      });
      partnerIdsToFetch.add(activePartnerId);
    }

    if (partnerIdsToFetch.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, phone")
        .in("id", Array.from(partnerIdsToFetch));

      const profileDict = {};
      profiles?.forEach((p) => {
        profileDict[p.id] = p;
      });

      const list = Array.from(partnerMap.values()).map((c) => ({
        ...c,
        partner: profileDict[c.partnerId] || { display_name: "Mtumiaji wa Duara" }
      }));

      setConversations(list);
    } else {
      setConversations([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user, activePartnerId]);

  // 3. Load messages for active partner
  useEffect(() => {
    let mounted = true;
    if (!supabase || !user || !activePartnerId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    async function loadThread() {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${activePartnerId}),and(sender_id.eq.${activePartnerId},recipient_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (mounted) setMessages(data || []);

        // Mark incoming messages as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("sender_id", activePartnerId)
          .eq("recipient_id", user.id)
          .eq("is_read", false);
      } catch (err) {
        console.warn("Hitilafu ya thread:", err.message);
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    }

    loadThread();

    // 4. Realtime subscription on messages
    const channel = supabase
      .channel("direct_messages_feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === user.id && newMsg.recipient_id === activePartnerId) ||
            (newMsg.sender_id === activePartnerId && newMsg.recipient_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activePartnerId) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const payload = {
        sender_id: user.id,
        recipient_id: activePartnerId,
        listing_id: listingParam || null,
        content,
        is_read: false
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      setMessages((prev) => [...prev, data]);
      loadConversations();
    } catch (err) {
      alert("Haikuweza kutuma ujumbe: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{
          fontSize: "22px",
          fontWeight: "800",
          color: "var(--ink-heading, #0f172a)",
          margin: "0 0 4px 0"
        }}>
          💬 Ujumbe na Mazungumzo
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>
          Wasiliana na wanunuzi na wauzaji wenzako moja kwa moja hapa sokoni.
        </p>
      </div>

      <div style={{
        backgroundColor: "var(--card-bg, #ffffff)",
        borderRadius: "16px",
        border: "1px solid var(--line, #e2e8f0)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        minHeight: "560px",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)"
      }}>
        {/* Left Column: Conversations List */}
        <div style={{
          borderRight: "1px solid var(--line, #e2e8f0)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            padding: "16px",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            fontWeight: "700",
            fontSize: "14px",
            color: "var(--ink-heading, #0f172a)"
          }}>
            Mazungumzo Yako ({conversations.length})
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingConv ? (
              <Loader minHeight="180px" message="Inapakia orodha..." />
            ) : conversations.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--muted, #64748b)" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📬</div>
                <p style={{ fontSize: "13px", margin: 0 }}>Bado huna ujumbe wowote. Bofya "Tuma Ujumbe Sokoni" kwenye tangazo lolote kuanza maongezi.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activePartnerId === conv.partnerId;
                return (
                  <button
                    key={conv.partnerId}
                    type="button"
                    onClick={() => setActivePartnerId(conv.partnerId)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      border: "none",
                      borderBottom: "1px solid var(--line, #f1f5f9)",
                      backgroundColor: isSelected ? "rgba(16, 185, 129, 0.08)" : "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background-color 0.15s"
                    }}
                  >
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary, #10b981)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "16px",
                      flexShrink: 0
                    }}>
                      {conv.partner?.display_name ? conv.partner.display_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <strong style={{ fontSize: "14px", color: "var(--ink-heading, #0f172a)" }}>
                          {conv.partner?.display_name || "Mtumiaji"}
                        </strong>
                        <span style={{ fontSize: "11px", color: "var(--muted, #94a3b8)" }}>
                          {formatRelativeDate(conv.timestamp)}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: "12px",
                        color: conv.unread ? "var(--ink-heading, #0f172a)" : "var(--muted, #64748b)",
                        fontWeight: conv.unread ? "700" : "400",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Messages Thread */}
        <div style={{ display: "flex", flexDirection: "column", flex: 2 }}>
          {activePartnerId ? (
            <>
              {/* Partner Top Bar */}
              <div style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--line, #e2e8f0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f8fafc"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary, #10b981)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700"
                  }}>
                    {activePartner?.display_name ? activePartner.display_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--ink-heading, #0f172a)" }}>
                      {activePartner?.display_name || "Mwanachama wa Duara"}
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                      {activePartner?.region || "Tanzania"}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/muuzaji/${activePartnerId}`}
                  style={{
                    fontSize: "12px",
                    color: "var(--primary, #10b981)",
                    textDecoration: "none",
                    fontWeight: "600"
                  }}
                >
                  Tazama Wasifu →
                </Link>
              </div>

              {/* Messages Area */}
              <div style={{
                flex: 1,
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                backgroundColor: "#fcfdfd"
              }}>
                {loadingMessages ? (
                  <Loader message="Inapakia ujumbe..." />
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", margin: "auto", color: "var(--muted, #64748b)" }}>
                    <p style={{ fontSize: "14px" }}>Hakuna ujumbe hapa bado. Andika ujumbe hapa chini kuanza mazungumzo!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "75%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMe ? "flex-end" : "flex-start"
                        }}
                      >
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          backgroundColor: isMe ? "var(--primary, #10b981)" : "#f1f5f9",
                          color: isMe ? "#ffffff" : "var(--ink-heading, #0f172a)",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          wordBreak: "break-word"
                        }}>
                          {m.content}
                        </div>
                        <span style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
                          {formatRelativeDate(m.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "14px 16px",
                  borderTop: "1px solid var(--line, #e2e8f0)",
                  display: "flex",
                  gap: "10px",
                  backgroundColor: "#ffffff"
                }}
              >
                <input
                  type="text"
                  placeholder="Andika ujumbe wako hapa..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    borderRadius: "22px",
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    padding: "11px 20px",
                    borderRadius: "22px",
                    border: "none",
                    backgroundColor: "var(--primary, #10b981)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {sending ? "..." : "Tuma"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", color: "var(--muted, #64748b)", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>💬</div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", margin: "0 0 6px 0" }}>
                  Chagua Mazungumzo
                </h3>
                <p style={{ fontSize: "13px", maxWidth: "300px", margin: 0 }}>
                  Bofya mmoja wa washiriki kwenye safu ya kushoto ili kusoma au kuendelea na mazungumzo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
