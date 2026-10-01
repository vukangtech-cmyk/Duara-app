import React, { useState, useEffect, useMemo } from "react";
import {
  getFeed,
  createPost,
  toggleLike,
  addComment,
  kickPost,
  uploadImage,
  followUser,
  getFollowedUserIds,
  getSuggestedUsers
} from "./api/api";
import { FB_REACTIONS, downloadMedia, getSavedMedia, saveMediaItem } from "./lib/feedHelpers";
import { useTranslation } from "./lib/translations";

const initials = (name = "Guest") =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

function Avatar({ name = "Guest", size = "md", avatarUrl }) {
  return (
    <div className={`avatar avatar-${size}`} id={`avatar-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      {avatarUrl ? <img src={avatarUrl} alt={`${name} profile`} /> : initials(name)}
    </div>
  );
}

function EmojiPicker({ onPick }) {
  const emojis = ["❤️", "👍", "🔥", "😂", "🎉", "👏", "🙌", "🇹🇿", "🇰🇪", "✨", "🤝", "💪", "👊", "🌟", "💡"];
  return (
    <div className="emoji-picker" id="feed-emoji-picker">
      {emojis.map((e) => (
        <button key={e} type="button" onClick={() => onPick(e)}>
          {e}
        </button>
      ))}
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="error-box">{message}</div>;
}

/**
 * Enhanced Post Card for MainFeed
 * Featuring Facebook Reactions popover, Media direct download & save bookmarks,
 * and In-Header Follow/Unfollow toggle for non-authors.
 */
function FeedPostCard({
  post,
  user,
  onRefresh,
  lang,
  onShowToast,
  isFollowed,
  onToggleFollow,
  onOpenLightbox,
  onViewUserProfile,
  onOpenDirectMessage
}) {
  const t = useTranslation(lang);
  const [activeReaction, setActiveReaction] = useState(() => {
    const isLiked = (post.likes || []).some((like) => like.user_id === user.id);
    return isLiked ? "love" : null;
  });
  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    return getSavedMedia().some((x) => x.id === post.id);
  });
  const [kicked, setKicked] = useState(false);
  const [comment, setComment] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [busy, setBusy] = useState(false);

  const authorName = post.profiles?.display_name || "Mwanachama";
  useEffect(() => {
    const liked = (post.likes || []).some((like) => like.user_id === user.id);
    setActiveReaction((current) => (liked ? current || "love" : null));
  }, [post.likes, user.id]);
  const authorUsername = post.profiles?.username || "circle";
  const isAuthor = post.author_id === user.id;

  const handleSelectReaction = async (reactionId) => {
    setShowReactionsBar(false);
    const newReaction = activeReaction === reactionId ? null : reactionId;
    setActiveReaction(newReaction);
    setBusy(true);

    const cfg = FB_REACTIONS.find((r) => r.id === reactionId);
    if (newReaction && cfg && onShowToast) {
      onShowToast(
        `${cfg.emoji} ${lang === "sw" ? "Umeacha hisia ya" : "Reacted with"} ${lang === "sw" ? cfg.labelSw : cfg.labelEn}`
      );
    }

    try {
      await toggleLike(user.id, post.id, !newReaction);
      onRefresh();
    } catch (err) {
      console.warn("Reaction error:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleSavePost = (e) => {
    if (e) e.stopPropagation();
    const savedNow = saveMediaItem({
      id: post.id,
      type: post.media_type || (post.media_url ? "image" : "post"),
      media_url: post.media_url,
      caption: post.content,
      author: authorName,
      authorAvatar: post.profiles?.avatar_url,
      username: authorUsername,
      created_at: post.created_at
    });
    setIsSaved(savedNow);
    if (onShowToast) {
      onShowToast(
        savedNow
          ? lang === "sw"
            ? "✓ Imehifadhiwa kwenye Mikusanyiko!"
            : "✓ Saved to your bookmarks!"
          : lang === "sw"
          ? "Imeondolewa kwenye Mikusanyiko"
          : "Removed from bookmarks"
      );
    }
  };

  const handleDownloadMedia = async (e) => {
    e.stopPropagation();
    if (!post.media_url) return;
    const ext = post.media_type === "video" ? "mp4" : "jpg";
    const filename = `circle_${post.id}.${ext}`;
    await downloadMedia(post.media_url, filename);
    if (onShowToast) {
      onShowToast(
        lang === "sw"
          ? "✓ Upakuaji wa faili umeanza kwenye kifaa chako!"
          : "✓ Media download started to your device!"
      );
    }
  };

  const kick = async () => {
    try {
      await kickPost(post.id, user.id, kicked);
      setKicked(!kicked);
      if (onShowToast) {
        onShowToast(
          kicked
            ? lang === "sw"
              ? "Umeondoa pigo la kigongo"
              : "Kick removed"
            : lang === "sw"
            ? "👊 Pigo la kigongo limerushwa!"
            : "👊 Kick delivered!"
        );
      }
    } catch (err) {
      console.warn("Kick error:", err);
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await addComment(user.id, post.id, comment.trim());
      setComment("");
      onRefresh();
      if (onShowToast) {
        onShowToast(lang === "sw" ? "✓ Jibu lako limetumwa!" : "✓ Reply sent!");
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(false);
    }
  };

  const currentReactionConfig = FB_REACTIONS.find((r) => r.id === activeReaction);
  const totalReactionsCount =
    (post.likes?.length || 0) +
    (activeReaction && !(post.likes || []).some((x) => x.user_id === user.id) ? 1 : 0);

  const openAuthorProfile = () => {
    if (onViewUserProfile) {
      onViewUserProfile({
        id: post.author_id,
        display_name: authorName,
        username: authorUsername,
        avatar_url: post.profiles?.avatar_url,
        bio: post.profiles?.bio,
        location: post.profiles?.location,
        role: post.profiles?.role
      });
    }
  };

  return (
    <article className="post-card" id={`post-card-${post.id}`}>
      {/* Post Header with Author, Timestamp, and Follow Button */}
      <div className="post-head">
        <div
          onClick={openAuthorProfile}
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flex: 1, minWidth: 0 }}
          title={lang === "sw" ? `Tazama akaunti ya @${authorUsername}` : `View @${authorUsername}`}
        >
          <Avatar name={authorName} avatarUrl={post.profiles?.avatar_url} size="md" />
          <div className="post-meta-group">
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="post-author-name">{authorName}</span>
              {isAuthor && (
                <span style={{ fontSize: 11, background: "var(--line)", padding: "2px 6px", borderRadius: 4, color: "var(--muted)", fontWeight: 600 }}>
                  {lang === "sw" ? "Wewe" : "You"}
                </span>
              )}
            </div>
            <span className="post-time-meta">
              @{authorUsername} ·{" "}
              {new Date(post.created_at).toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        </div>

        {/* Message & Follow Buttons for other creators */}
        {!isAuthor && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {onOpenDirectMessage && (
              <button
                type="button"
                className="post-follow-badge"
                onClick={() => onOpenDirectMessage(post.author_id, authorName, "")}
                title={lang === "sw" ? `Tuma ujumbe kwa @${authorUsername}` : `Message @${authorUsername}`}
              >
                <span>💬</span>
              </button>
            )}
            {onToggleFollow && (
              <button
                type="button"
                className={`post-follow-badge ${isFollowed ? "following" : "not-following"}`}
                onClick={() => onToggleFollow(post.author_id, authorName, isFollowed)}
              >
                <span>{isFollowed ? "✓" : "+"}</span>
                <span>{isFollowed ? (lang === "sw" ? "Unamfuata" : "Following") : (lang === "sw" ? "Fuata" : "Follow")}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <p className="post-body-text">{post.content}</p>

      {/* Media Attachment with Quick Download & Save Bar */}
      {post.media_url && (
        <div
          className="media-wrapper-relative"
          onClick={() => onOpenLightbox && onOpenLightbox({ url: post.media_url, type: post.media_type, title: post.content })}
          style={{ cursor: "pointer" }}
        >
          {post.media_type === "video" ? (
            <video src={post.media_url} controls playsInline />
          ) : (
            <img src={post.media_url} alt="Post Media Attachment" loading="lazy" />
          )}

          {/* Direct Media Save & Download Floating Bar */}
          <div className="media-quick-download-bar">
            <button
              type="button"
              className="media-action-pill"
              onClick={handleDownloadMedia}
              title={post.media_type === "video" ? t.downloadVideoBtn : t.downloadImageBtn}
            >
              <span>📥</span>
              <span>
                {post.media_type === "video"
                  ? lang === "sw"
                    ? "Pakua Video"
                    : "Download Video"
                  : lang === "sw"
                  ? "Pakua Picha"
                  : "Download Photo"}
              </span>
            </button>
            <button
              type="button"
              className="media-action-pill"
              onClick={handleSavePost}
              title={isSaved ? t.unbookmarkMedia : t.bookmarkMedia}
            >
              <span>{isSaved ? "🔖" : "💾"}</span>
              <span>{isSaved ? (lang === "sw" ? "Imehifadhiwa" : "Saved") : (lang === "sw" ? "Hifadhi" : "Save")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Facebook-style Reaction & Comments Count Summary */}
      <div className="reaction-summary-row">
        <div className="reaction-summary-emojis">
          <span className="reaction-mini-icon">👍</span>
          <span className="reaction-mini-icon">❤️</span>
          <span className="reaction-mini-icon">👊</span>
          <span className="reaction-count-text">
            {totalReactionsCount > 0 ? totalReactionsCount : activeReaction ? 1 : 0}
          </span>
        </div>
        {Boolean(post.comments?.[0]?.count) && (
          <span className="muted" style={{ fontSize: 13 }}>
            {post.comments[0].count} {t.comments}
          </span>
        )}
      </div>

      {/* Actions Bar with Facebook Reaction trigger and Save Post */}
      <div className="post-actions-bar">
        {/* Facebook Reaction Button with Floating Picker */}
        <div
          className="fb-reaction-wrapper"
          onMouseEnter={() => setShowReactionsBar(true)}
          onMouseLeave={() => setShowReactionsBar(false)}
        >
          {showReactionsBar && (
            <div className="fb-reaction-popover" id={`reactions-popover-${post.id}`}>
              {FB_REACTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="fb-reaction-btn"
                  onClick={() => handleSelectReaction(r.id)}
                >
                  <span>{r.emoji}</span>
                  <span className="fb-reaction-tooltip">
                    {lang === "sw" ? r.labelSw : r.labelEn}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            id={`btn-react-${post.id}`}
            onClick={() => handleSelectReaction(activeReaction ? activeReaction : "love")}
            disabled={busy}
            className={`action-btn ${activeReaction ? "liked" : ""}`}
            style={{ color: currentReactionConfig ? currentReactionConfig.color : undefined }}
          >
            <span>{currentReactionConfig ? currentReactionConfig.emoji : "🤍"}</span>
            <span>
              {currentReactionConfig
                ? lang === "sw"
                  ? currentReactionConfig.labelSw
                  : currentReactionConfig.labelEn
                : t.like}
            </span>
          </button>
        </div>

        {/* Kick Button */}
        <button
          type="button"
          id={`btn-kick-${post.id}`}
          onClick={kick}
          className={`action-btn ${kicked ? "kicked" : ""}`}
        >
          <span>👊</span>
          <span>{kicked ? t.kicked : t.kick}</span>
        </button>

        {/* Reply/Comments Button */}
        <button
          type="button"
          id={`btn-reply-${post.id}`}
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="action-btn"
        >
          <span>💬</span>
          <span>{t.reply}</span>
        </button>

        {/* Bookmark/Save Post Action */}
        <button
          type="button"
          id={`btn-bookmark-action-${post.id}`}
          onClick={handleSavePost}
          className={`action-btn ${isSaved ? "saved" : ""}`}
          title={isSaved ? t.unbookmarkMedia : t.bookmarkMedia}
        >
          <span>{isSaved ? "🔖" : "💾"}</span>
          <span>
            {isSaved ? (lang === "sw" ? "Imehifadhiwa" : "Saved") : (lang === "sw" ? "Hifadhi" : "Save")}
          </span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          id={`btn-share-${post.id}`}
          className="action-btn"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "THE CIRCLE", text: post.content, url: window.location.href });
            } else {
              navigator.clipboard?.writeText(window.location.href);
              if (onShowToast) onShowToast(lang === "sw" ? "Kiungo kimenakiliwa!" : "Link copied!");
            }
          }}
        >
          <span>↗</span>
          <span>{t.share}</span>
        </button>
      </div>

      {/* Inline Comment Input */}
      {showCommentBox && (
        <form className="inline-comment-form" onSubmit={sendComment}>
          <input
            id={`comment-input-${post.id}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.writeReply}
          />
          <button type="button" className="action-btn" onClick={() => setShowEmoji(!showEmoji)}>
            😊
          </button>
          <button type="submit" className="button button-primary" disabled={busy}>
            {t.send}
          </button>
        </form>
      )}

      {showEmoji && <EmojiPicker onPick={(emoji) => setComment((val) => `${val}${emoji}`)} />}
    </article>
  );
}

/**
 * MainFeed Component
 * Displays posts from followed users, incorporates reaction system,
 * direct media saving/downloads, and quick creator discovery.
 */
export function MainFeed({
  profile,
  posts,
  setPosts,
  onPost,
  lang,
  onShowToast,
  setActive,
  StatusRail,
  onViewUserProfile,
  onOpenDirectMessage
}) {
  const t = useTranslation(lang);

  // Feed Filter States - Default to 'for_you' (Duara Zote) so feed is immediately rich & active on mobile
  const [feedMode, setFeedMode] = useState("for_you"); // 'for_you' | 'following' | 'media'
  const [includeMyPosts, setIncludeMyPosts] = useState(true);
  const [selectedCreatorId, setSelectedCreatorId] = useState(null);
  const [composerExpanded, setComposerExpanded] = useState(false);

  // Follow States
  const [followedIds, setFollowedIds] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [loadingFollows, setLoadingFollows] = useState(true);

  // Composer States
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Lightbox State
  const [lightboxItem, setLightboxItem] = useState(null);

  // Live saved media count
  const [savedCount, setSavedCount] = useState(() => getSavedMedia().length);

  // Load followed user IDs and suggested creators
  useEffect(() => {
    let mounted = true;
    async function loadFollowData() {
      setLoadingFollows(true);
      try {
        const [ids, suggested] = await Promise.all([
          getFollowedUserIds(profile.id),
          getSuggestedUsers(profile.id)
        ]);
        if (mounted) {
          setFollowedIds(ids);
          setSuggestedCreators(suggested);
        }
      } catch (err) {
        console.warn("Failed to load follow data:", err);
      } finally {
        if (mounted) setLoadingFollows(false);
      }
    }
    loadFollowData();
    return () => {
      mounted = false;
    };
  }, [profile.id]);

  // Keep saved count synced
  const updateSavedCount = () => {
    setSavedCount(getSavedMedia().length);
  };

  // Follow / Unfollow handler
  const handleToggleFollow = async (creatorId, creatorName, isCurrentlyFollowing) => {
    const nextFollowingState = !isCurrentlyFollowing;
    try {
      await followUser(profile.id, creatorId, isCurrentlyFollowing);

      if (nextFollowingState) {
        setFollowedIds((prev) => Array.from(new Set([...prev, creatorId])));
        if (onShowToast) {
          onShowToast(
            lang === "sw"
              ? `✓ Sasa unamfuata ${creatorName}!`
              : `✓ You are now following ${creatorName}!`
          );
        }
      } else {
        setFollowedIds((prev) => prev.filter((id) => id !== creatorId));
        if (onShowToast) {
          onShowToast(
            lang === "sw"
              ? `Umeacha kumfuata ${creatorName}`
              : `Unfollowed ${creatorName}`
          );
        }
      }
    } catch (err) {
      console.warn("Error toggling follow:", err);
    }
  };

  // Publish new post
  const submitPost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setBusy(true);
    setMessage("");
    try {
      let media = null;
      const mediaType = file ? (file.type.startsWith("video/") ? "video" : "image") : null;
      if (file) media = await uploadImage(profile.id, file);
      const post = await onPost(
        content.trim() || (mediaType === "video" ? t.newVideo : t.newPhoto),
        media,
        mediaType
      );
      setPosts((current) => [{ ...post, profiles: profile, likes: [], comments: [] }, ...current]);
      setContent("");
      setFile(null);
      if (onShowToast) {
        onShowToast(lang === "sw" ? "✓ Chapisho lako limeshirikiwa!" : "✓ Your post is live!");
      }
    } catch (err) {
      setMessage(err.message || t.postSendFailed);
    } finally {
      setBusy(false);
    }
  };

  const refreshFeed = async () => {
    try {
      const fresh = await getFeed();
      setPosts(fresh);
      updateSavedCount();
    } catch (err) {
      setMessage(err.message || t.feedReadFailed);
    }
  };

  // Compute creators that user follows from current posts & suggestions
  const followedProfiles = useMemo(() => {
    const map = new Map();
    posts.forEach((p) => {
      if (p.author_id && followedIds.includes(p.author_id) && p.profiles) {
        map.set(p.author_id, p.profiles);
      }
    });
    suggestedCreators.forEach((s) => {
      if (followedIds.includes(s.id)) {
        map.set(s.id, s);
      }
    });
    return Array.from(map.values());
  }, [posts, followedIds, suggestedCreators]);

  // Filter posts based on active feedMode and creator selection
  const filteredPosts = useMemo(() => {
    let result = posts;

    if (feedMode === "following") {
      result = result.filter((p) => {
        const isFollowedAuthor = followedIds.includes(p.author_id);
        const isSelf = includeMyPosts && p.author_id === profile.id;
        return isFollowedAuthor || isSelf;
      });
    } else if (feedMode === "media") {
      result = result.filter((p) => Boolean(p.media_url));
    }

    if (selectedCreatorId) {
      result = result.filter((p) => p.author_id === selectedCreatorId);
    }

    return result;
  }, [posts, feedMode, followedIds, includeMyPosts, selectedCreatorId, profile.id]);

  return (
    <div className="feed-container" id="main-feed-container">
      <div className="feed-column">
        {/* Status / Stories Rail */}
        {StatusRail && <StatusRail profile={profile} lang={lang} />}

        {/* Sleek Compact Mobile-First Post Composer */}
        <section className="composer-card duara-composer-card" id="main-feed-composer">
          <form onSubmit={submitPost} id="create-post-form">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <textarea
                  id="post-textarea"
                  className={`composer-textarea ${composerExpanded || content || file ? "expanded" : "compact"}`}
                  value={content}
                  onFocus={() => setComposerExpanded(true)}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={lang === "sw" ? "Andika chapisho..." : "What's happening?"}
                  maxLength={600}
                  rows={composerExpanded || content || file ? 3 : 1}
                />
              </div>
              {!composerExpanded && !content && !file && (
                <label className="tool-chip" style={{ flexShrink: 0, padding: "7px 11px" }}>
                  <span>📷</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setComposerExpanded(true);
                    }}
                  />
                </label>
              )}
            </div>

            {file && (
              <div className="composer-file-pill" style={{ marginTop: 10 }}>
                <span>{file.type.startsWith("video/") ? "🎬" : "🖼️"}</span>
                <span className="composer-file-name">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="composer-file-remove"
                >
                  ✕
                </button>
              </div>
            )}

            {(composerExpanded || content || file) && (
              <>
                <div className="composer-divider" />
                <div className="composer-bottom">
                  <div className="composer-tools-group">
                    <label className="tool-chip" id="btn-upload-media">
                      <span>📷</span> <span>{t.photoVideo}</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <button
                      type="button"
                      id="btn-post-emoji"
                      className="tool-chip"
                      onClick={() => setShowEmoji(!showEmoji)}
                    >
                      <span>😊</span>
                    </button>
                  </div>

                  <div className="composer-submit-group">
                    <button
                      type="submit"
                      id="btn-publish-post"
                      className="button button-primary composer-submit-btn"
                      disabled={busy}
                      style={{ padding: "8px 18px", fontSize: 13 }}
                    >
                      {busy ? "..." : t.shareBtn}
                    </button>
                  </div>
                </div>
                {showEmoji && <EmojiPicker onPick={(emoji) => setContent((val) => `${val}${emoji}`)} />}
              </>
            )}
          </form>

          <ErrorBox message={message} />
        </section>

        {/* Followed Creators Quick Filter Rail */}
        {followedProfiles.length > 0 && (
          <div className="followed-creators-rail" id="followed-creators-rail">
            <button
              type="button"
              className={`followed-creator-chip ${!selectedCreatorId ? "selected" : ""}`}
              onClick={() => setSelectedCreatorId(null)}
            >
              <div className="avatar avatar-sm" style={{ background: "var(--primary)", color: "#fff", fontWeight: 700 }}>
                🌟
              </div>
              <span className="followed-creator-name">{lang === "sw" ? "Wote" : "All"}</span>
            </button>

            {followedProfiles.map((creator) => (
              <button
                key={creator.id}
                type="button"
                className={`followed-creator-chip ${selectedCreatorId === creator.id ? "selected" : ""}`}
                onClick={() =>
                  setSelectedCreatorId(selectedCreatorId === creator.id ? null : creator.id)
                }
                title={creator.display_name}
              >
                <Avatar name={creator.display_name} avatarUrl={creator.avatar_url} size="sm" />
                <span className="followed-creator-name">{creator.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Feed View Tabs Bar (For You / Following / Media) */}
        <div className="feed-tabs-header" id="feed-tabs-header">
          <div className="feed-tabs-group">
            <button
              type="button"
              id="tab-feed-foryou"
              className={`feed-tab-btn ${feedMode === "for_you" ? "active" : ""}`}
              onClick={() => {
                setFeedMode("for_you");
                setSelectedCreatorId(null);
              }}
            >
              <span>🌍</span>
              <span>{lang === "sw" ? "Duara" : "For You"}</span>
            </button>

            <button
              type="button"
              id="tab-feed-following"
              className={`feed-tab-btn ${feedMode === "following" ? "active" : ""}`}
              onClick={() => {
                setFeedMode("following");
                setSelectedCreatorId(null);
              }}
            >
              <span>🌟</span>
              <span>{lang === "sw" ? "Unaowafuata" : "Following"}</span>
            </button>

            <button
              type="button"
              id="tab-feed-media"
              className={`feed-tab-btn ${feedMode === "media" ? "active" : ""}`}
              onClick={() => {
                setFeedMode("media");
                setSelectedCreatorId(null);
              }}
            >
              <span>🎬</span>
              <span>{lang === "sw" ? "Media" : "Media"}</span>
            </button>
          </div>
        </div>

        {/* Feed Posts List */}
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              user={profile}
              onRefresh={async () => {
                setPosts(await getFeed());
                updateSavedCount();
              }}
              lang={lang}
              onShowToast={onShowToast}
              isFollowed={followedIds.includes(post.author_id)}
              onToggleFollow={handleToggleFollow}
              onOpenLightbox={setLightboxItem}
              onViewUserProfile={onViewUserProfile}
              onOpenDirectMessage={onOpenDirectMessage}
            />
          ))
        ) : (
          /* Empty Following State with One-Click Suggested Creators */
          <div className="empty-following-state" id="empty-feed-following-state">
            <span className="empty-following-icon">
              {feedMode === "following" ? "👥" : "🌱"}
            </span>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>
              {feedMode === "following"
                ? lang === "sw"
                  ? " bado hujamfuata mtu"
                  : "No posts from followed accounts yet"
                : t.emptyFeedTitle}
            </h3>

            {/* Suggested Creators Quick Grid */}
            <div className="suggested-creators-grid">
              {suggestedCreators.map((creator) => {
                const isFollowing = followedIds.includes(creator.id);
                return (
                  <div key={creator.id} className="suggested-creator-card">
                    <div
                      className="suggested-creator-info"
                      onClick={() => onViewUserProfile && onViewUserProfile(creator)}
                      style={{ cursor: "pointer" }}
                    >
                      <Avatar name={creator.display_name} avatarUrl={creator.avatar_url} size="md" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{creator.display_name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>@{creator.username}</div>
                      </div>
                    </div>
                    {creator.bio && <p className="suggested-creator-bio">{creator.bio}</p>}
                    <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                      <button
                        type="button"
                        className={`button ${isFollowing ? "button-outline" : "button-primary"}`}
                        style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
                        onClick={() =>
                          handleToggleFollow(creator.id, creator.display_name, isFollowing)
                        }
                      >
                        {isFollowing
                          ? lang === "sw"
                            ? "✓ Unamfuata"
                            : "Following"
                          : lang === "sw"
                          ? "+ Fuata"
                          : "+ Follow"}
                      </button>
                      {onOpenDirectMessage && (
                        <button
                          type="button"
                          className="button button-soft"
                          style={{ fontSize: 12, padding: "6px 10px" }}
                          onClick={() => onOpenDirectMessage(creator.id, creator.display_name, "")}
                        >
                          💬
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setFeedMode("for_you")}
              >
                🌍 {lang === "sw" ? "Gundua Machapisho Yote (Duara Zote)" : "Explore All Posts (For You)"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Rail with Suggestions */}
      <aside className="right-rail" id="feed-right-rail">
        <div className="glass-card" style={{ padding: 16 }}>
          <h4 style={{ fontSize: 15, marginBottom: 12 }}>
            {lang === "sw" ? "Akaunti za Kufuata" : "Accounts to Follow"}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {suggestedCreators.slice(0, 6).map((person) => {
              const isFollowing = followedIds.includes(person.id);
              return (
                <div key={person.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    onClick={() => onViewUserProfile && onViewUserProfile(person)}
                    style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}
                  >
                    <Avatar name={person.display_name} avatarUrl={person.avatar_url} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {person.display_name}
                      </div>
                      <div className="muted" style={{ fontSize: 11 }}>@{person.username}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`button ${isFollowing ? "button-outline" : "button-primary"}`}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999 }}
                    onClick={() => handleToggleFollow(person.id, person.display_name, isFollowing)}
                  >
                    {isFollowing ? "✓" : "+"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* High-Resolution Media Lightbox Modal */}
      {lightboxItem && (
        <div className="feed-lightbox-backdrop" onClick={() => setLightboxItem(null)}>
          <div className="feed-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="feed-lightbox-close"
              onClick={() => setLightboxItem(null)}
            >
              ✕
            </button>

            {lightboxItem.type === "video" ? (
              <video
                src={lightboxItem.url}
                controls
                autoPlay
                className="feed-lightbox-media"
              />
            ) : (
              <img
                src={lightboxItem.url}
                alt="Enlarged media"
                className="feed-lightbox-media"
              />
            )}

            <div className="feed-lightbox-bar">
              <button
                type="button"
                className="media-action-pill"
                onClick={() => {
                  const ext = lightboxItem.type === "video" ? "mp4" : "jpg";
                  downloadMedia(lightboxItem.url, `circle_preview.${ext}`);
                  if (onShowToast) {
                    onShowToast(
                      lang === "sw" ? "✓ Upakuaji umeanza!" : "✓ Download started!"
                    );
                  }
                }}
              >
                <span>📥</span>
                <span>{lang === "sw" ? "Pakua Faili" : "Download File"}</span>
              </button>

              <button
                type="button"
                className="media-action-pill"
                onClick={() => {
                  saveMediaItem({
                    id: `lightbox_${Date.now()}`,
                    type: lightboxItem.type || "image",
                    media_url: lightboxItem.url,
                    caption: lightboxItem.title || "Media",
                    author: "Duara",
                    created_at: new Date().toISOString()
                  });
                  updateSavedCount();
                  if (onShowToast) {
                    onShowToast(
                      lang === "sw"
                        ? "✓ Imehifadhiwa kwenye Mikusanyiko!"
                        : "✓ Saved to your bookmarks!"
                    );
                  }
                }}
              >
                <span>💾</span>
                <span>{lang === "sw" ? "Hifadhi" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainFeed;
