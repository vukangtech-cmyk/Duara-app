import React, { useEffect, useRef, useState } from "react";
import { Avatar } from "./App";
import { sendCallSignal, subscribeToConversation } from "./api/api";
import { callAudio } from "./lib/callAudio";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

export function CallModal({ call, profile, onClose, lang }) {
  const isSw = lang === "sw";
  const [status, setStatus] = useState(call?.status || (call?.isIncoming ? "ringing_incoming" : "ringing_outgoing"));
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call?.type === "audio");
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState("");
  const [connectionError, setConnectionError] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const pendingIceRef = useRef([]);
  const endedRef = useRef(false);
  const initialSignalRef = useRef(call?.initialSignal || null);

  const otherPerson = call.recipient || { display_name: "Mwanachama wa Duara", username: "circle_user" };
  const recipientId = otherPerson.id;

  const sendSignal = async (signalType, payload = {}) => {
    if (!call.conversationId || !recipientId || !profile?.id) return;
    await sendCallSignal(call.conversationId, profile.id, recipientId, signalType, payload);
  };

  const attachLocalStream = (stream) => {
    streamRef.current = stream;
    if (localVideoRef.current && call.type === "video") localVideoRef.current.srcObject = stream;
    const peer = peerRef.current;
    if (peer) stream.getTracks().forEach((track) => peer.addTrack(track, stream));
  };

  const flushPendingIce = async () => {
    const peer = peerRef.current;
    if (!peer?.remoteDescription) return;
    const queued = pendingIceRef.current.splice(0);
    for (const candidate of queued) {
      try { await peer.addIceCandidate(candidate); } catch (err) { console.warn("Queued ICE candidate failed", err); }
    }
  };

  const setConnected = () => {
    if (!endedRef.current) {
      callAudio.stopAll();
      setStatus("connected");
    }
  };

  const handleSignal = async (signal) => {
    if (!signal || signal.sender_id === profile?.id) return;
    const peer = peerRef.current;
    if (!peer) return;
    try {
      if (signal.signal_type === "offer") {
        if (!peer.remoteDescription) {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await flushPendingIce();
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await sendSignal("answer", { type: answer.type, sdp: answer.sdp });
        }
      } else if (signal.signal_type === "answer") {
        if (!peer.remoteDescription) {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await flushPendingIce();
        }
      } else if (signal.signal_type === "ice" && signal.payload?.candidate) {
        const candidate = new RTCIceCandidate(signal.payload.candidate);
        if (peer.remoteDescription) await peer.addIceCandidate(candidate);
        else pendingIceRef.current.push(candidate);
      } else if (signal.signal_type === "hangup" || signal.signal_type === "declined") {
        finish(false);
      }
    } catch (err) {
      console.error("WebRTC signaling error", err);
      setConnectionError(isSw ? "Imeshindikana kuunganisha simu." : "The call connection failed.");
    }
  };

  const createPeer = () => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection(RTC_CONFIG);
    peerRef.current = peer;
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal("ice", { candidate: candidate.toJSON ? candidate.toJSON() : candidate }).catch(console.warn);
    };
    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play?.().catch(() => {});
      }
      setConnected();
    };
    peer.onconnectionstatechange = () => {
      if (["connected"].includes(peer.connectionState)) setConnected();
      if (["failed", "disconnected", "closed"].includes(peer.connectionState) && !endedRef.current) {
        setConnectionError(isSw ? "Muunganisho umekatika." : "Connection lost.");
      }
    };
    return peer;
  };

  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      try {
        if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("WebRTC is not supported by this browser");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: call.type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false
        });
        if (cancelled || endedRef.current) return stream.getTracks().forEach((track) => track.stop());
        const peer = createPeer();
        attachLocalStream(stream);

        // The first offer can arrive before this modal subscribes; process it after media is ready.
        if (call.isIncoming && initialSignalRef.current?.signal_type === "offer") {
          await handleSignal(initialSignalRef.current);
          initialSignalRef.current = null;
        } else if (!call.isIncoming) {
          const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: call.type === "video" });
          await peer.setLocalDescription(offer);
          await sendSignal("offer", {
            type: offer.type,
            sdp: offer.sdp,
            callType: call.type,
            caller: { id: profile.id, display_name: profile.display_name, username: profile.username, avatar_url: profile.avatar_url }
          });
        }
      } catch (err) {
        console.error("WebRTC media setup failed", err);
        setPermissionError(isSw ? "Ruhusu microphone na kamera kwenye browser ili kupiga simu." : "Allow microphone and camera access in your browser to call.");
      }
    };
    setup();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!call.conversationId) return undefined;
    return subscribeToConversation(call.conversationId, () => {}, (payload) => handleSignal(payload.new || payload));
  }, [call.conversationId]);

  useEffect(() => {
    if (status === "ringing_outgoing") callAudio.playRingback();
    else if (status === "ringing_incoming") callAudio.playIncomingRingtone();
    else callAudio.stopAll();
    return () => callAudio.stopAll();
  }, [status]);

  useEffect(() => {
    if (status !== "connected") return undefined;
    const timer = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const finish = async (notify = true) => {
    if (endedRef.current) return;
    endedRef.current = true;
    callAudio.playHangup();
    if (notify) await sendSignal("hangup").catch(() => {});
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    setStatus("ended");
    setTimeout(onClose, 500);
  };

  const handleAnswer = () => {
    callAudio.stopAll();
    setStatus("connecting");
  };

  const toggleMute = () => {
    const track = streamRef.current?.getAudioTracks?.()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled); }
  };

  const formatTimer = (secs) => `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="call-modal-overlay" id="active-call-overlay">
      <div className="call-modal-card" id="active-call-container">
        <div className="call-modal-header">
          <span className="call-type-badge">{call.type === "video" ? "📹 " + (isSw ? "Simu ya Video" : "Video Call") : "🎙️ " + (isSw ? "Simu ya Sauti" : "Voice Call")}</span>
          <span className="call-encrypted-tag">🔒 {isSw ? "WebRTC Salama" : "Secure WebRTC"}</span>
        </div>
        <div className="call-media-stage">
          {call.type === "video" ? (
            <div className="video-streams-grid">
              <video ref={remoteVideoRef} autoPlay playsInline className="call-video-feed remote-feed" />
              <video ref={localVideoRef} autoPlay muted playsInline className="call-video-feed local-feed" />
              {!remoteVideoRef.current?.srcObject && <div className="remote-feed-placeholder"><Avatar name={otherPerson.display_name} avatarUrl={otherPerson.avatar_url} size="xl" /><p className="call-user-title">{otherPerson.display_name}</p></div>}
            </div>
          ) : (
            <div className="audio-call-visualizer"><div className={`audio-avatar-pulse ${status === "connected" ? "pulsing-live" : "pulsing-ringing"}`}><Avatar name={otherPerson.display_name} avatarUrl={otherPerson.avatar_url} size="xl" /></div><h2 className="call-recipient-name">{otherPerson.display_name}</h2><p className="call-recipient-handle">@{otherPerson.username}</p></div>
          )}
          <div className="call-status-bar">
            {(status === "ringing_outgoing" || status === "ringing_incoming") && <p className="call-status-text"><span className="ringing-dot" />{status === "ringing_incoming" ? (isSw ? "Simu inayoingia..." : "Incoming call...") : (isSw ? "Inasubiri kupokea..." : "Waiting for answer...")}</p>}
            {status === "connecting" && <p className="call-status-text">⏳ {isSw ? "Inaunganisha..." : "Connecting..."}</p>}
            {status === "connected" && <p className="call-duration-text"><span className="live-rec-dot" />{formatTimer(duration)}</p>}
            {status === "ended" && <p className="call-status-text ended-text">{isSw ? "Simu imekatika" : "Call ended"}</p>}
            {(permissionError || connectionError) && <p className="call-permission-notice">{permissionError || connectionError}</p>}
          </div>
        </div>
        <div className="call-controls-bar">
          {status === "ringing_incoming" ? <div className="incoming-actions"><button type="button" className="call-ctrl-btn hangup-btn" onClick={() => finish(true)} id="btn-decline-call">✕ {isSw ? "Kata" : "Decline"}</button><button type="button" className="call-ctrl-btn answer-btn" onClick={handleAnswer} id="btn-answer-call">📞 {isSw ? "Pokea Simu" : "Answer Call"}</button></div> : <div className="active-call-controls"><button type="button" className={`call-ctrl-btn secondary-btn ${isMuted ? "btn-active-off" : ""}`} onClick={toggleMute} id="btn-toggle-mute">{isMuted ? "🔇" : "🎙️"}</button>{call.type === "video" && <button type="button" className={`call-ctrl-btn secondary-btn ${isVideoOff ? "btn-active-off" : ""}`} onClick={toggleVideo} id="btn-toggle-video">{isVideoOff ? "🚫📹" : "📹"}</button>}<button type="button" className="call-ctrl-btn hangup-btn" onClick={() => finish(true)} id="btn-hangup-call">🛑 {isSw ? "Kata Simu" : "End Call"}</button></div>}
        </div>
      </div>
    </div>
  );
}

export default CallModal;
