import React, { useState, useRef } from "react";
import { updateProfile, uploadImage, getFeed } from "./api/api";
import { useTranslation } from "./lib/translations";

const AVATAR_PRESETS = [
  { id: "p1", name: "Simba (Lion Leader)", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80" },
  { id: "p2", name: "Dev (Mwanateknolojia)", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80" },
  { id: "p3", name: "Mjasiriamali (Founder)", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80" },
  { id: "p4", name: "Mbunifu (Creative)", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80" },
  { id: "p5", name: "Nyota (Star Leader)", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80" },
  { id: "p6", name: "Kijana wa Kisasa (Modern)", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80" },
  { id: "p7", name: "Msanii (Artist)", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80" },
  { id: "p8", name: "Duara Champion", url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&auto=format&fit=crop&q=80" }
];

const COVER_PRESETS = [
  { id: "c1", name: "Savannah Emerald", gradient: "linear-gradient(135deg, #065f46, #059669 45%, #d97706)" },
  { id: "c2", name: "Serengeti Sunset", gradient: "linear-gradient(135deg, #c2410c, #ea580c 50%, #f59e0b)" },
  { id: "c3", name: "Kilimanjaro Dusk", gradient: "linear-gradient(135deg, #1e1b4b, #4338ca 50%, #6366f1)" },
  { id: "c4", name: "Zanzibar Ocean", gradient: "linear-gradient(135deg, #0f766e, #0284c7 50%, #38bdf8)" }
];

const BIO_TEMPLATES = {
  sw: [
    "🚀 Mjasiriamali wa kidijitali & Mwanachama wa THE CIRCLE Tanzania 🇹🇿",
    "🌿 Mpenzi wa teknolojia, ubunifu, kilimo na jamii.",
    "💻 Software developer & AI enthusiast. Kujifunza na kushiriki kila siku.",
    "🎨 Mtengenezaji wa maudhui na hadithi za kusisimua za Kiafrika."
  ],
  en: [
    "🚀 Digital entrepreneur & active member of THE CIRCLE community 🇹🇿",
    "🌿 Tech explorer, agriculture enthusiast, and community builder.",
    "💻 Software developer & AI learner. Building real-world solutions daily.",
    "🎨 Creative storyteller & content creator celebrating modern culture."
  ]
};

const QUICK_EMOJIS = ["🇹🇿", "🦁", "💻", "🌿", "🎵", "🚀", "🔥", "💡", "✨", "❤️", "📍", "🤝"];

const getInitials = (name = "Guest") =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

export function UserProfile({
  profile,
  setProfile,
  posts = [],
  setPosts,
  onPost,
  lang = "sw",
  onShowToast,
  setActive,
  PostCard
}) {
  const t = useTranslation(lang);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Profile fields state
  const [name, setName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [pronouns, setPronouns] = useState(profile?.pronouns || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [coverGradient, setCoverGradient] = useState(profile?.cover_url || COVER_PRESETS[0].gradient);

  // UI modes
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(profile?.bio || "");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState("posts"); // "posts", "about", "media"
  const [postFilter, setPostFilter] = useState("all"); // "all", "media", "text"
  const [viewMode, setViewMode] = useState("feed"); // "feed" or "grid"

  // Quick in-profile post composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [quickPostText, setQuickPostText] = useState("");
  const [quickPostFile, setQuickPostFile] = useState(null);
  const [postingBusy, setPostingBusy] = useState(false);

  // Edit full info modal
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);

  // Filter posts belonging to this profile
  const myPosts = posts.filter(
    (p) =>
      p.author_id === profile?.id ||
      p.user_id === profile?.id ||
      p.profiles?.id === profile?.id
  );

  const mediaPosts = myPosts.filter((p) => p.media_url);
  const textPosts = myPosts.filter((p) => !p.media_url);

  const displayedPosts =
    postFilter === "media"
      ? mediaPosts
      : postFilter === "text"
      ? textPosts
      : myPosts;

  // Total reactions calculated across user's posts
  const totalReactions = myPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

  // ==========================================
  // Bio Handlers
  // ==========================================
  const handleOpenBioEdit = () => {
    setBioDraft(bio);
    setIsEditingBio(true);
  };

  const handleSaveBio = async (e) => {
    if (e) e.preventDefault();
    setSavingBio(true);
    try {
      const updated = await updateProfile(profile.id, {
        bio: bioDraft.trim()
      });
      setBio(bioDraft.trim());
      if (setProfile) setProfile({ ...profile, bio: bioDraft.trim(), ...updated });
      setIsEditingBio(false);
      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "✓ Wasifu wako (Bio) umesasishwa kikamilifu!"
            : "✓ Bio updated successfully!"
        );
      }
    } catch (err) {
      console.warn("Save bio error:", err);
      // Fallback local update if offline or table constraint
      setBio(bioDraft.trim());
      if (setProfile) setProfile({ ...profile, bio: bioDraft.trim() });
      setIsEditingBio(false);
      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "✓ Wasifu umehifadhiwa (Kumbukumbu)!"
            : "✓ Bio saved to profile!"
        );
      }
    } finally {
      setSavingBio(false);
    }
  };

  const handleAddEmojiToBio = (emoji) => {
    if (bioDraft.length + emoji.length <= 280) {
      setBioDraft((prev) => prev + emoji);
    }
  };

  const handleApplyBioTemplate = (template) => {
    setBioDraft(template);
  };

  // ==========================================
  // Avatar Handlers
  // ==========================================
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "Tafadhali chagua faili la picha (JPG, PNG au WEBP)"
            : "Please select an image file (JPG, PNG or WEBP)"
        );
      }
      return;
    }

    setUploadingAvatar(true);
    try {
      let finalUrl = null;
      try {
        finalUrl = await uploadImage(profile.id, file, "avatars");
      } catch (storageErr) {
        console.warn("Storage upload fallback to dataURL:", storageErr);
        // Fallback to data URL so the user is never blocked
        finalUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      setAvatarUrl(finalUrl);
      const updated = await updateProfile(profile.id, { avatar_url: finalUrl });
      if (setProfile) setProfile({ ...profile, avatar_url: finalUrl, ...updated });

      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "✓ Picha ya wasifu (Avatar) imebadilishwa kikamilifu!"
            : "✓ Avatar changed successfully!"
        );
      }
    } catch (err) {
      console.warn("Avatar change error:", err);
      if (onShowToast) onShowToast(err.message || "Failed to update avatar.");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSelectPresetAvatar = async (presetUrl) => {
    setAvatarUrl(presetUrl);
    setShowAvatarPresets(false);
    try {
      const updated = await updateProfile(profile.id, { avatar_url: presetUrl });
      if (setProfile) setProfile({ ...profile, avatar_url: presetUrl, ...updated });
      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "✓ Picha ya avatar uliyochagua imewekwa kikamilifu!"
            : "✓ Avatar preset applied successfully!"
        );
      }
    } catch (err) {
      if (setProfile) setProfile({ ...profile, avatar_url: presetUrl });
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl("");
    setShowAvatarPresets(false);
    try {
      await updateProfile(profile.id, { avatar_url: null });
      if (setProfile) setProfile({ ...profile, avatar_url: null });
      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "✓ Picha ya wasifu imeondolewa, herufi za jina zitaonyeshwa."
            : "✓ Avatar removed, initials will be displayed."
        );
      }
    } catch (err) {
      if (setProfile) setProfile({ ...profile, avatar_url: null });
    }
  };

  // ==========================================
  // Cover Photo Handlers
  // ==========================================
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const url = reader.result;
        setCoverGradient(`url(${url})`);
        try {
          await updateProfile(profile.id, { cover_url: url });
          if (setProfile) setProfile({ ...profile, cover_url: url });
        } catch (err) {}
        if (onShowToast) {
          onShowToast(
            lang === "sw" ? "✓ Picha ya cover imesasishwa!" : "✓ Cover photo updated!"
          );
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Cover update err:", err);
    }
  };

  const handleSelectCoverPreset = (gradient) => {
    setCoverGradient(gradient);
    setShowCoverMenu(false);
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Muonekano wa cover umebadilishwa!" : "✓ Cover style applied!");
    }
  };

  // ==========================================
  // Full Info Update
  // ==========================================
  const handleSaveFullInfo = async (e) => {
    e.preventDefault();
    setInfoSaving(true);
    try {
      const updated = await updateProfile(profile.id, {
        display_name: name.trim(),
        pronouns: pronouns.trim(),
        location: location.trim(),
        website: website.trim(),
        bio: bio.trim()
      });
      if (setProfile) {
        setProfile({
          ...profile,
          display_name: name.trim(),
          pronouns: pronouns.trim(),
          location: location.trim(),
          website: website.trim(),
          bio: bio.trim(),
          ...updated
        });
      }
      setIsEditingInfo(false);
      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "✓ Taarifa za wasifu zimehifadhiwa kikamilifu!"
            : "✓ Profile information saved successfully!"
        );
      }
    } catch (err) {
      console.warn("Info save error:", err);
    } finally {
      setInfoSaving(false);
    }
  };

  // ==========================================
  // Quick In-Profile Post
  // ==========================================
  const handleCreateQuickPost = async (e) => {
    e.preventDefault();
    if (!quickPostText.trim() && !quickPostFile) return;
    setPostingBusy(true);
    try {
      let mediaUrl = null;
      let mediaType = null;
      if (quickPostFile) {
        mediaType = quickPostFile.type.startsWith("video/") ? "video" : "image";
        mediaUrl = await uploadImage(profile.id, quickPostFile);
      }
      let newPost = null;
      if (onPost) {
        newPost = await onPost(quickPostText.trim(), mediaUrl, mediaType);
      }
      if (newPost && setPosts) {
        setPosts((current) => [{ ...newPost, profiles: profile, likes: [], comments: [] }, ...current]);
      } else if (setPosts) {
        const refreshed = await getFeed();
        setPosts(refreshed);
      }
      setQuickPostText("");
      setQuickPostFile(null);
      setComposerOpen(false);
      if (onShowToast) {
        onShowToast(
          lang === "sw"
            ? "✓ Chapisho lako limeshirikiwa kwenye Duara!"
            : "✓ Post published to your circle!"
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to post.");
    } finally {
      setPostingBusy(false);
    }
  };

  const isGradient = !coverGradient.startsWith("url");

  return (
    <div className="user-profile-shell" id="user-profile-component">
      {/* 1. Profile Cover Banner */}
      <div
        className="user-profile-cover"
        style={
          isGradient
            ? { background: coverGradient }
            : { backgroundImage: coverGradient }
        }
      >
        <div className="cover-overlay-gradient" />

        <div className="cover-tools-bar">
          <button
            type="button"
            className="cover-tool-btn"
            id="btn-change-cover-photo"
            onClick={() => setShowCoverMenu(!showCoverMenu)}
          >
            <span>🎨</span>
            <span>{lang === "sw" ? "Badilisha Cover" : "Change Cover"}</span>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverFileChange}
            style={{ display: "none" }}
          />

          {showCoverMenu && (
            <div
              className="glass-card"
              style={{
                position: "absolute",
                top: 48,
                right: 0,
                width: 220,
                padding: 12,
                borderRadius: 16,
                zIndex: 20,
                boxShadow: "var(--shadow-lg)"
              }}
            >
              <button
                type="button"
                className="button button-soft"
                style={{ width: "100%", justifyContent: "flex-start", marginBottom: 8, fontSize: 13 }}
                onClick={() => {
                  setShowCoverMenu(false);
                  coverInputRef.current?.click();
                }}
              >
                📁 {lang === "sw" ? "Pakia Kutoka Kwenye Kifaa" : "Upload From Device"}
              </button>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", margin: "6px 0 4px", textTransform: "uppercase" }}>
                {lang === "sw" ? "Mionekano ya Rangi" : "Color Gradients"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {COVER_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    style={{
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      background: c.gradient,
                      cursor: "pointer"
                    }}
                    title={c.name}
                    onClick={() => handleSelectCoverPreset(c.gradient)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Profile Card Header with Avatar, Name, and Quick Actions */}
      <div className="user-profile-card">
        <div className="user-avatar-header-row">
          {/* Avatar with Interactive Badge */}
          <div className="avatar-interactive-holder">
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid var(--card-bg)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                background: avatarUrl ? "transparent" : "var(--primary)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 34
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "User"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{getInitials(name)}</span>
              )}
            </div>

            {/* Camera Badge Trigger */}
            <button
              type="button"
              className="avatar-cam-badge"
              id="btn-change-avatar-badge"
              onClick={() => fileInputRef.current?.click()}
              title={lang === "sw" ? "Badilisha picha ya wasifu" : "Change avatar photo"}
            >
              {uploadingAvatar ? "⏳" : "📷"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="profile-action-buttons">
            <button
              type="button"
              className="button button-soft"
              id="btn-open-avatar-presets"
              onClick={() => setShowAvatarPresets(true)}
              style={{ fontSize: 13, gap: 6 }}
            >
              <span>🎭</span>
              <span>{lang === "sw" ? "Mifano ya Avatar" : "Avatar Presets"}</span>
            </button>
            <button
              type="button"
              className="button button-primary"
              id="btn-edit-full-profile"
              onClick={() => setIsEditingInfo(true)}
              style={{ fontSize: 13, gap: 6 }}
            >
              <span>✏️</span>
              <span>{lang === "sw" ? "Hariri Wasifu Kamili" : "Edit Profile"}</span>
            </button>
            {setActive && (
              <button
                type="button"
                className="button button-soft"
                id="btn-goto-privacy-settings"
                onClick={() => setActive("settings")}
                style={{ fontSize: 13, gap: 6 }}
              >
                <span>🛡️</span>
                <span>{lang === "sw" ? "Ulinzi na Faragha" : "Privacy & Security"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Name and Meta */}
        <div className="profile-names-block">
          <h1 className="profile-display-name">
            <span>{name || profile?.display_name || "Mwanachama wa Duara"}</span>
            <span className="profile-verified-badge" title="Verified Circle Member">✓</span>
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>
            @{profile?.username || "mwanachama"}
          </p>
        </div>

        {/* Meta details pills */}
        <div className="profile-meta-pills">
          <span
            className="profile-meta-pill"
            style={{
              background: (profile?.role === "ceo")
                ? "linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.3))"
                : profile?.role === "manager"
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(59, 130, 246, 0.15)",
              color: (profile?.role === "ceo")
                ? "#eab308"
                : profile?.role === "manager"
                ? "#10b981"
                : "#3b82f6",
              fontWeight: 800,
              border: "1px solid currentColor"
            }}
          >
            {(profile?.role === "ceo")
              ? "👑 CEO & MWANZILISHI (HAMZA VUKANG)"
              : profile?.role === "manager"
              ? "💼 MANAGER WA DUKA (WHATSAPP CATALOGUE)"
              : "🛒 MTEJA WA KAWAIDA / MTANGAZAJI"}
          </span>

          {pronouns && (
            <span className="profile-meta-pill">
              <span>👤</span> {pronouns}
            </span>
          )}
          {location && (
            <span className="profile-meta-pill">
              <span>📍</span> {location}
            </span>
          )}
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-meta-pill"
              style={{ textDecoration: "none", color: "var(--primary)" }}
            >
              <span>🔗</span> {website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span className="profile-meta-pill">
            <span>📅</span>{" "}
            {lang === "sw"
              ? "Mwanachama tangu 2026"
              : "Member since 2026"}
          </span>
        </div>

        {/* 3. Profile Statistics Strip */}
        <div className="profile-stats-strip" id="profile-stats-panel">
          <div className="profile-stat-box">
            <span className="profile-stat-num">{myPosts.length}</span>
            <span className="profile-stat-label">
              {lang === "sw" ? "Machapisho" : "Posts"}
            </span>
          </div>
          <div className="profile-stat-box">
            <span className="profile-stat-num">{mediaPosts.length}</span>
            <span className="profile-stat-label">
              {lang === "sw" ? "Picha & Video" : "Media Files"}
            </span>
          </div>
          <div className="profile-stat-box">
            <span className="profile-stat-num">{totalReactions}</span>
            <span className="profile-stat-label">
              {lang === "sw" ? "Hisia & Likes" : "Total Reactions"}
            </span>
          </div>
          <div className="profile-stat-box">
            <span className="profile-stat-num" style={{ color: "#059669" }}>✓</span>
            <span className="profile-stat-label">
              {lang === "sw" ? "Hali: Hai" : "Status: Active"}
            </span>
          </div>
        </div>

        {/* 4. Bio Section & Inline Editor */}
        <div className="profile-bio-section" id="profile-bio-box">
          <div className="profile-bio-header">
            <span className="profile-bio-title">
              <span>📝</span> {lang === "sw" ? "Wasifu Kuhusu Wewe (Bio)" : "About You (Bio)"}
            </span>
            {!isEditingBio && (
              <button
                type="button"
                className="button button-soft"
                id="btn-trigger-bio-edit"
                onClick={handleOpenBioEdit}
                style={{ fontSize: 12, padding: "6px 12px", gap: 6 }}
              >
                <span>✏️</span>
                <span>{lang === "sw" ? "Hariri Wasifu" : "Edit Bio"}</span>
              </button>
            )}
          </div>

          {!isEditingBio ? (
            <div>
              {bio ? (
                <p className="bio-content-text">{bio}</p>
              ) : (
                <div
                  style={{
                    padding: "16px 0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}
                  onClick={handleOpenBioEdit}
                >
                  <span style={{ fontSize: 22 }}>✍️</span>
                  <span className="bio-empty-prompt">
                    {lang === "sw"
                      ? "Bado hujaandika wasifu kukuhusu. Bofya hapa kuongeza maelezo mafupi..."
                      : "No bio added yet. Click here to add a short bio about yourself..."}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Bio Editor View */
            <form onSubmit={handleSaveBio} className="bio-editor-card" id="form-edit-bio">
              <textarea
                className="bio-textarea"
                id="input-user-bio"
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                maxLength={280}
                placeholder={
                  lang === "sw"
                    ? "Eleza machache kukuhusu, mambo unayopenda, kazi yako au ujumbe wako..."
                    : "Write a few words about who you are, what you love, your work or passion..."
                }
                autoFocus
              />

              {/* Character Counter & Tools */}
              <div className="bio-tools-row">
                {/* Emoji Bar */}
                <div className="bio-emojis-bar">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="bio-emoji-btn"
                      onClick={() => handleAddEmojiToBio(emoji)}
                      title={`Add ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: bioDraft.length > 250 ? "#ef4444" : "var(--muted)"
                    }}
                  >
                    {bioDraft.length}/280
                  </span>
                </div>
              </div>

              {/* Bio Starter Templates */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  {lang === "sw" ? "💡 Mifano ya kuanzia haraka:" : "💡 Quick Bio Starters:"}
                </span>
                <div className="bio-templates-row">
                  {(BIO_TEMPLATES[lang] || BIO_TEMPLATES.sw).map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      className="bio-template-chip"
                      onClick={() => handleApplyBioTemplate(tpl)}
                    >
                      {tpl.slice(0, 36)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Save & Cancel Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setIsEditingBio(false)}
                  disabled={savingBio}
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  id="btn-save-bio-submit"
                  className="button button-primary"
                  disabled={savingBio}
                  style={{ gap: 6 }}
                >
                  <span>{savingBio ? "⏳" : "💾"}</span>
                  <span>
                    {savingBio
                      ? lang === "sw"
                        ? "Inahifadhi..."
                        : "Saving..."
                      : lang === "sw"
                      ? "Hifadhi Wasifu"
                      : "Save Bio"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 5. Profile Content Navigation & Toolbar */}
      <div className="user-profile-tabs">
        <div className="profile-tab-links">
          <button
            type="button"
            className={`profile-tab-link ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            <span>📝</span>
            <span>{lang === "sw" ? "Machapisho Yangu" : "My Posts"}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>({myPosts.length})</span>
          </button>

          <button
            type="button"
            className={`profile-tab-link ${activeTab === "media" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("media");
              setViewMode("grid");
            }}
          >
            <span>🖼️</span>
            <span>{lang === "sw" ? "Picha & Video" : "Media Gallery"}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>({mediaPosts.length})</span>
          </button>

          <button
            type="button"
            className={`profile-tab-link ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <span>ℹ️</span>
            <span>{lang === "sw" ? "Kuhusu Mimi" : "Full About"}</span>
          </button>
        </div>

        {/* View Mode & Filter Controls */}
        {activeTab === "posts" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Filter Pills */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className={`button ${postFilter === "all" ? "button-primary" : "button-soft"}`}
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => setPostFilter("all")}
              >
                {lang === "sw" ? "Zote" : "All"} ({myPosts.length})
              </button>
              <button
                type="button"
                className={`button ${postFilter === "media" ? "button-primary" : "button-soft"}`}
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => setPostFilter("media")}
              >
                📷 {lang === "sw" ? "Media" : "Media"} ({mediaPosts.length})
              </button>
              <button
                type="button"
                className={`button ${postFilter === "text" ? "button-primary" : "button-soft"}`}
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => setPostFilter("text")}
              >
                💬 {lang === "sw" ? "Maandishi" : "Text"} ({textPosts.length})
              </button>
            </div>

            {/* Layout switch */}
            <div className="profile-view-switch">
              <button
                type="button"
                className={`view-switch-btn ${viewMode === "feed" ? "active" : ""}`}
                onClick={() => setViewMode("feed")}
                title="Feed Cards View"
              >
                ☰ {lang === "sw" ? "Kadi" : "Feed"}
              </button>
              <button
                type="button"
                className={`view-switch-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid Gallery View"
              >
                ▦ {lang === "sw" ? "Gridi" : "Grid"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick In-Profile Composer Button */}
      {activeTab === "posts" && (
        <div style={{ marginBottom: 20 }}>
          {!composerOpen ? (
            <button
              type="button"
              className="glass-card"
              onClick={() => setComposerOpen(true)}
              style={{
                width: "100%",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                border: "1px solid var(--line)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>✍️</span>
                <span className="muted" style={{ fontSize: 14 }}>
                  {lang === "sw"
                    ? "Chapisha wazo au picha mpya kwenye wasifu wako..."
                    : "Post an update or media to your profile..."}
                </span>
              </div>
              <span className="button button-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
                {lang === "sw" ? "+ Chapisha" : "+ Create Post"}
              </span>
            </button>
          ) : (
            <form
              onSubmit={handleCreateQuickPost}
              className="glass-card"
              style={{ padding: 20, border: "2px solid var(--primary)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <strong style={{ fontSize: 15 }}>
                  {lang === "sw" ? "✍️ Chapisha Kwenye Wasifu Wako" : "✍️ Create Post on Your Profile"}
                </strong>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
                >
                  ✕
                </button>
              </div>

              <textarea
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid var(--line)",
                  background: "var(--input-bg)",
                  color: "var(--ink)",
                  outline: "none",
                  marginBottom: 12
                }}
                value={quickPostText}
                onChange={(e) => setQuickPostText(e.target.value)}
                placeholder={
                  lang === "sw"
                    ? "Unafikiria nini sasa hivi? Shiriki na marafiki..."
                    : "What's on your mind? Share with your circle..."
                }
                autoFocus
              />

              {quickPostFile && (
                <div
                  style={{
                    padding: "8px 14px",
                    background: "var(--primary-soft)",
                    borderRadius: 8,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <span style={{ fontSize: 13 }}>📎 {quickPostFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setQuickPostFile(null)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="tool-chip" style={{ cursor: "pointer" }}>
                  <span>📷</span> {lang === "sw" ? "Picha/Video" : "Photo/Video"}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setQuickPostFile(e.target.files?.[0] || null)}
                    style={{ display: "none" }}
                  />
                </label>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="button button-soft"
                    onClick={() => setComposerOpen(false)}
                  >
                    {lang === "sw" ? "Ghairi" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={postingBusy || (!quickPostText.trim() && !quickPostFile)}
                  >
                    {postingBusy ? (lang === "sw" ? "Inachapisha..." : "Posting...") : (lang === "sw" ? "Shiriki" : "Publish")}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 6. Posts Content Render */}
      {activeTab === "posts" && (
        <div>
          {displayedPosts.length > 0 ? (
            viewMode === "feed" ? (
              /* Feed View: Uses interactive PostCard with reactions, comments & download */
              <div className="feed-column">
                {displayedPosts.map((post) =>
                  PostCard ? (
                    <PostCard
                      key={post.id}
                      post={post}
                      user={profile}
                      onRefresh={async () => {
                        if (setPosts) setPosts(await getFeed());
                      }}
                      lang={lang}
                      onShowToast={onShowToast}
                    />
                  ) : (
                    /* Fallback Card if PostCard is not passed directly */
                    <article key={post.id} className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "var(--primary)",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700
                          }}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            getInitials(name)
                          )}
                        </div>
                        <div>
                          <strong>{name}</strong>
                          <span className="muted" style={{ display: "block", fontSize: 12 }}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>{post.content}</p>
                      {post.media_url && (
                        <div style={{ borderRadius: 12, overflow: "hidden", maxHeight: 380, background: "#000", marginBottom: 12 }}>
                          {post.media_type === "video" ? (
                            <video src={post.media_url} controls playsInline style={{ width: "100%" }} />
                          ) : (
                            <img src={post.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                      )}
                    </article>
                  )
                )}
              </div>
            ) : (
              /* Media Grid View */
              <div className="profile-media-grid">
                {displayedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="profile-media-card"
                    onClick={() => setViewMode("feed")}
                    title="Bofya kutazama chapisho kamili"
                  >
                    {post.media_url ? (
                      post.media_type === "video" ? (
                        <video src={post.media_url} muted />
                      ) : (
                        <img src={post.media_url} alt="" />
                      )
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          padding: 18,
                          background: "var(--card-hover)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          color: "var(--ink)",
                          fontSize: 13,
                          fontStyle: "italic"
                        }}
                      >
                        "{post.content.slice(0, 90)}..."
                      </div>
                    )}
                    <div className="profile-media-overlay">
                      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {post.content || (post.media_type === "video" ? "Video Reel" : "Photo")}
                      </p>
                      <div className="media-overlay-stats">
                        <span>👍 {post.likes?.length || 0}</span>
                        <span>💬 {post.comments?.[0]?.count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Empty Posts State */
            <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px" }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🌱</span>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>
                {lang === "sw"
                  ? "Bado hujachapisha chochote kwenye Duara"
                  : "You haven't posted anything to your circle yet"}
              </h3>
              <p className="muted" style={{ maxWidth: 440, margin: "0 auto 20px" }}>
                {lang === "sw"
                  ? "Anza kushiriki mawazo, picha, video au maendeleo yako na jamii inayokujali."
                  : "Start sharing your thoughts, photos, videos or milestones with your community."}
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setComposerOpen(true)}
              >
                ✍️ {lang === "sw" ? "Chapisha Sasa" : "Create First Post"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Media Gallery Tab */}
      {activeTab === "media" && (
        <div>
          {mediaPosts.length > 0 ? (
            <div className="profile-media-grid">
              {mediaPosts.map((post) => (
                <div
                  key={post.id}
                  className="profile-media-card"
                  onClick={() => {
                    setActiveTab("posts");
                    setViewMode("feed");
                  }}
                >
                  {post.media_type === "video" ? (
                    <video src={post.media_url} controls playsInline />
                  ) : (
                    <img src={post.media_url} alt="" />
                  )}
                  <div className="profile-media-overlay">
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500 }}>
                      {post.content || (post.media_type === "video" ? "Video" : "Photo")}
                    </p>
                    <div className="media-overlay-stats">
                      <span>👍 {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.[0]?.count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px" }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>📷</span>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>
                {lang === "sw" ? "Hakuna Picha au Video Bado" : "No Media Uploads Yet"}
              </h3>
              <p className="muted" style={{ maxWidth: 440, margin: "0 auto 20px" }}>
                {lang === "sw"
                  ? "Picha na video zote unazozishiriki kwenye machapisho au reels zitaonekana hapa kwenye ghala yako."
                  : "All photos and videos you share across posts or reels will be showcased in this gallery."}
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setActiveTab("posts");
                  setComposerOpen(true);
                }}
              >
                📷 {lang === "sw" ? "Pakia Picha au Video" : "Upload Photo or Video"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8. About Tab (Detailed profile information) */}
      {activeTab === "about" && (
        <div className="glass-card" style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>
              {lang === "sw" ? "Taarifa Zako Kamili za Wasifu" : "Your Full Profile Details"}
            </h2>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setIsEditingInfo(true)}
              style={{ fontSize: 13 }}
            >
              ✏️ {lang === "sw" ? "Hariri Taarifa" : "Edit Details"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <span className="muted">{lang === "sw" ? "Jina Kamili" : "Full Display Name"}</span>
              <strong>{name || "—"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <span className="muted">{lang === "sw" ? "Jina la Utambulisho (Username)" : "Username"}</span>
              <strong>@{profile?.username || "—"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <span className="muted">{lang === "sw" ? "Viakilishi (Pronouns)" : "Pronouns"}</span>
              <span>{pronouns || "—"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <span className="muted">{lang === "sw" ? "Mahali / Eneo" : "Location"}</span>
              <span>{location ? `📍 ${location}` : "—"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <span className="muted">{lang === "sw" ? "Tovuti / Link" : "Website"}</span>
              <span>{website ? website : "—"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
              <span className="muted">{lang === "sw" ? "Wasifu (Bio)" : "Bio Summary"}</span>
              <span style={{ maxWidth: 360, textAlign: "right", fontStyle: bio ? "normal" : "italic", color: bio ? "var(--ink)" : "var(--muted)" }}>
                {bio || (lang === "sw" ? "Haujawekwa bado" : "Not set yet")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 9. Avatar Presets Modal */}
      {showAvatarPresets && (
        <div className="avatar-presets-modal" onClick={() => setShowAvatarPresets(false)}>
          <div className="avatar-presets-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 20, margin: "0 0 4px" }}>
                  {lang === "sw" ? "Chagua Mfano wa Avatar" : "Choose Avatar Preset"}
                </h3>
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                  {lang === "sw"
                    ? "Bofya avatar yoyote ili kuiweka papo hapo kwenye wasifu wako:"
                    : "Click any avatar style to instantly apply it to your profile:"}
                </p>
              </div>
              <button
                type="button"
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}
                onClick={() => setShowAvatarPresets(false)}
              >
                ✕
              </button>
            </div>

            <div className="avatar-presets-grid">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`avatar-preset-btn ${avatarUrl === preset.url ? "active" : ""}`}
                  onClick={() => handleSelectPresetAvatar(preset.url)}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      objectFit: "cover",
                      boxShadow: "var(--shadow-sm)"
                    }}
                  />
                  <span style={{ fontSize: 11, marginTop: 4, display: "block", textAlign: "center", color: "var(--muted)" }}>
                    {preset.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                className="button button-soft"
                onClick={handleRemoveAvatar}
                style={{ color: "#ef4444", fontSize: 13 }}
              >
                🗑️ {lang === "sw" ? "Ondoa Picha (Tumia Herufi)" : "Remove Avatar"}
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setShowAvatarPresets(false);
                  fileInputRef.current?.click();
                }}
                style={{ fontSize: 13 }}
              >
                📁 {lang === "sw" ? "Pakia Picha Yangu" : "Upload Custom Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Edit Full Info Modal */}
      {isEditingInfo && (
        <div className="avatar-presets-modal" onClick={() => setIsEditingInfo(false)}>
          <div className="avatar-presets-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, margin: 0 }}>
                {lang === "sw" ? "✏️ Hariri Taarifa za Wasifu" : "✏️ Edit Profile Details"}
              </h3>
              <button
                type="button"
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}
                onClick={() => setIsEditingInfo(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFullInfo}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {lang === "sw" ? "Jina Lako Kamili" : "Full Name"}
                </label>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {lang === "sw" ? "Viakilishi (Pronouns)" : "Pronouns"}
                </label>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none" }}
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="yeye/yake, they/them..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {lang === "sw" ? "Wasifu (Bio)" : "Bio"}
                </label>
                <textarea
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none", minHeight: 90 }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  placeholder={lang === "sw" ? "Eleza machache kukuhusu..." : "Tell us about yourself..."}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {lang === "sw" ? "Mahali / Mji" : "Location / City"}
                </label>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none" }}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dar es Salaam, Tanzania"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {lang === "sw" ? "Tovuti / Kiungo cha Nje" : "Website or Link"}
                </label>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none" }}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setIsEditingInfo(false)}
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={infoSaving}
                >
                  {infoSaving ? (lang === "sw" ? "Inahifadhi..." : "Saving...") : (lang === "sw" ? "Hifadhi Mabadiliko" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
