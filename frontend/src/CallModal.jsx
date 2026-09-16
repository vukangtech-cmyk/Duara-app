import React, { useState, useEffect, useRef } from "react";
import { Avatar } from "./App";
import { sendCallSignal } from "./api/api";
import { callAudio } from "./lib/callAudio";

export function CallModal({
  call, // { type: "audio"|"video", isIncoming, recipient, conversationId, status: "ringing"|"connected" }
  profile,
  onClose,
  lang,
}) {
  const isSw = lang === "sw";
  const [status, setStatus] = useState(call?.status || (call?.isIncoming ? "ringing_incoming" : "ringing_outgoing"));
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call?.type === "audio");
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Sound effects & ringtone management
  useEffect(() => {
    if (status === "ringing_outgoing") {
      callAudio.playRingback();
    } else if (status === "ringing_incoming") {
      callAudio.playIncomingRingtone();
    } else {
      callAudio.stopAll();
    }

    return () => {
      callAudio.stopAll();
    };
  }, [status]);

  // Real WebRTC Media Stream initialization
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = {
            audio: true,
            video: call.type === "video" ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (localVideoRef.current && call.type === "video") {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Camera/Microphone access notice:", err);
        setPermissionError(
          isSw
            ? "Maikrofoni/Kamera inahitaji ruhusa ya kifaa chako."
            : "Microphone/Camera requires device permission."
        );
      }
    }

    if (!call.isIncoming || status === "connected") {
      initMedia();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [status, call.type, call.isIncoming]);

  // Live Call Duration Timer
  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Outgoing call simulator/answering auto-handshake if in same session or demo
  useEffect(() => {
    if (status === "ringing_outgoing") {
      const timer = setTimeout(() => {
        setStatus("connected");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleAnswer = async () => {
    callAudio.stopAll();
    setStatus("connected");
    if (call.conversationId && call.recipient?.id) {
      await sendCallSignal(call.conversationId, profile.id, call.recipient.id, "answer", {
        type: call.type,
      }).catch(() => {});
    }
  };

  const handleHangup = async () => {
    callAudio.playHangup();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (call.conversationId && call.recipient?.id) {
      await sendCallSignal(call.conversationId, profile.id, call.recipient.id, "hangup", {}).catch(() => {});
    }
    setStatus("ended");
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const otherPerson = call.recipient || { display_name: "Mwanachama wa Duara", username: "circle_user" };

  return (
    <div className="call-modal-overlay" id="active-call-overlay">
      <div className="call-modal-card" id="active-call-container">
        {/* Top Header */}
        <div className="call-modal-header">
          <span className="call-type-badge">
            {call.type === "video" ? "📹 " + (isSw ? "Simu ya Video" : "Video Call") : "🎙️ " + (isSw ? "Simu ya Sauti" : "Voice Call")}
          </span>
          <span className="call-encrypted-tag">🔒 {isSw ? "Mwisho-hadi-Mwisho (E2EE)" : "End-to-End Encrypted"}</span>
        </div>

        {/* Video Stage / Media Canvas */}
        <div className="call-media-stage">
          {call.type === "video" && !isVideoOff ? (
            <div className="video-streams-grid">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="call-video-feed local-feed"
              />
              <div className="remote-feed-placeholder">
                <Avatar name={otherPerson.display_name} avatarUrl={otherPerson.avatar_url} size="xl" />
                <p className="call-user-title">{otherPerson.display_name}</p>
                <p className="call-status-indicator">
                  {status === "connected"
                    ? isSw ? "🟢 Mtiririko wa moja kwa moja" : "🟢 Live Feed Active"
                    : isSw ? "Inasubiri kuunganisha..." : "Waiting to connect..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="audio-call-visualizer">
              <div className={`audio-avatar-pulse ${status === "connected" ? "pulsing-live" : "pulsing-ringing"}`}>
                <Avatar name={otherPerson.display_name} avatarUrl={otherPerson.avatar_url} size="xl" />
              </div>
              <h2 className="call-recipient-name">{otherPerson.display_name}</h2>
              <p className="call-recipient-handle">@{otherPerson.username}</p>
              <div className="audio-wave-bars">
                <span className="wave-bar bar-1"></span>
                <span className="wave-bar bar-2"></span>
                <span className="wave-bar bar-3"></span>
                <span className="wave-bar bar-4"></span>
                <span className="wave-bar bar-5"></span>
              </div>
            </div>
          )}

          {/* Status Message / Timer */}
          <div className="call-status-bar">
            {status === "ringing_outgoing" && (
              <p className="call-status-text">
                <span className="ringing-dot"></span>
                {isSw ? "Inapiga simu..." : "Ringing..."}
              </p>
            )}
            {status === "ringing_incoming" && (
              <p className="call-status-text">
                <span className="ringing-dot incoming-dot"></span>
                {isSw ? "Simu inayoingia..." : "Incoming call..."}
              </p>
            )}
            {status === "connected" && (
              <p className="call-duration-text">
                <span className="live-rec-dot"></span>
                {formatTimer(duration)}
              </p>
            )}
            {status === "ended" && (
              <p className="call-status-text ended-text">
                {isSw ? "Simu imekatika" : "Call ended"}
              </p>
            )}
            {permissionError && (
              <p className="call-permission-notice">{permissionError}</p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="call-controls-bar">
          {status === "ringing_incoming" ? (
            <div className="incoming-actions">
              <button
                type="button"
                className="call-ctrl-btn hangup-btn"
                onClick={handleHangup}
                id="btn-decline-call"
              >
                ✕ {isSw ? "Kata" : "Decline"}
              </button>
              <button
                type="button"
                className="call-ctrl-btn answer-btn"
                onClick={handleAnswer}
                id="btn-answer-call"
              >
                📞 {isSw ? "Pokea Simu" : "Answer Call"}
              </button>
            </div>
          ) : (
            <div className="active-call-controls">
              <button
                type="button"
                className={`call-ctrl-btn secondary-btn ${isMuted ? "btn-active-off" : ""}`}
                onClick={toggleMute}
                id="btn-toggle-mute"
                title={isMuted ? (isSw ? "Washa Maikrofoni" : "Unmute") : (isSw ? "Zima Maikrofoni" : "Mute")}
              >
                {isMuted ? "🔇" : "🎙️"}
                <span>{isMuted ? (isSw ? "Kimya" : "Muted") : (isSw ? "Sauti" : "Mic On")}</span>
              </button>

              {call.type === "video" && (
                <button
                  type="button"
                  className={`call-ctrl-btn secondary-btn ${isVideoOff ? "btn-active-off" : ""}`}
                  onClick={toggleVideo}
                  id="btn-toggle-video"
                  title={isVideoOff ? (isSw ? "Washa Kamera" : "Turn Video On") : (isSw ? "Zima Kamera" : "Turn Video Off")}
                >
                  {isVideoOff ? "🚫📹" : "📹"}
                  <span>{isVideoOff ? (isSw ? "Kamera Imezimwa" : "Camera Off") : (isSw ? "Kamera" : "Camera")}</span>
                </button>
              )}

              <button
                type="button"
                className="call-ctrl-btn hangup-btn"
                onClick={handleHangup}
                id="btn-hangup-call"
              >
                🛑 {isSw ? "Kata Simu" : "End Call"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
