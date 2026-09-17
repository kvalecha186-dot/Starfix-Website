import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Video, Maximize2, Minimize2, ExternalLink, PhoneOff,
  Radio, Sparkles, Check, Clock
} from "lucide-react";
import { C } from "./dashColors";
import { toast } from "sonner";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingUrl: string;
  mentorName: string;
  mentorInitials?: string;
  mentorColor?: string;
  pathTitle?: string;
  onSessionReflection?: () => void;
}

export function VideoCallModal({
  isOpen,
  onClose,
  meetingUrl,
  mentorName,
  mentorInitials = "SM",
  mentorColor = "#C9A227",
  pathTitle = "Mentorship Session",
  onSessionReflection,
}: VideoCallModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Timer while call is active
  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      setLoadingIframe(true);
      setShowReflectionPrompt(false);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Handle Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((f) => !f);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    if (elapsedSeconds > 10) {
      setShowReflectionPrompt(true);
    } else {
      onClose();
    }
  };

  const handleCompleteAndClose = () => {
    if (onSessionReflection) {
      onSessionReflection();
    }
    toast.success("Session finished!", { description: "+30 XP earned for completing your 1:1 call" });
    setShowReflectionPrompt(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(5, 5, 16, 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isFullscreen ? 0 : 20,
        }}
      >
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: isFullscreen ? "100vw" : "min(1240px, 96vw)",
            height: isFullscreen ? "100vh" : "min(840px, 92vh)",
            background: "#08081A",
            border: isFullscreen ? "none" : "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: isFullscreen ? 0 : 24,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top Bar Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 22px",
              background: "linear-gradient(180deg, #101026 0%, #08081A 100%)",
              borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {/* Left: Mentor & Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: `${mentorColor}22`,
                  border: `1.5px solid ${mentorColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: mentorColor,
                }}
              >
                {mentorInitials}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                    {mentorName}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(220, 38, 38, 0.2)",
                      border: "1px solid rgba(220, 38, 38, 0.4)",
                      color: "#F87171",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      letterSpacing: "0.05em",
                    }}
                  >
                    <Radio size={10} className="animate-pulse" /> LIVE 1:1
                  </span>
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "0.75rem", marginTop: 2 }}>
                  {pathTitle}
                </div>
              </div>
            </div>

            {/* Center: Live Call Timer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                padding: "6px 14px",
                borderRadius: 999,
                color: "#E2E8F0",
                fontSize: "0.82rem",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
              }}
            >
              <Clock size={13} color={C.gold} />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            {/* Right: Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => window.open(meetingUrl, "_blank", "noopener,noreferrer")}
                title="Open meeting in new tab"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  padding: "7px 13px",
                  borderRadius: 8,
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "background 0.2s",
                }}
              >
                <ExternalLink size={13} />
                <span>New Tab</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                  border: "none",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
                }}
              >
                <PhoneOff size={14} />
                <span>Leave Call</span>
              </button>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div style={{ flex: 1, position: "relative", background: "#050510", minHeight: 0 }}>
            {loadingIframe && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#08081A",
                  color: "rgba(255, 255, 255, 0.8)",
                  gap: 14,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: "3px solid rgba(212, 175, 55, 0.2)",
                    borderTopColor: C.gold,
                    animation: "spin 1s linear infinite",
                  }}
                />
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Connecting to secure Starfix room...</div>
                <div style={{ fontSize: "0.76rem", color: "rgba(255, 255, 255, 0.5)" }}>
                  WebRTC end-to-end encrypted audio and video
                </div>
              </div>
            )}

            <iframe
              src={`${meetingUrl}#config.prejoinConfig.enabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              onLoad={() => setLoadingIframe(false)}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
              title={`Starfix Live Video Call with ${mentorName}`}
            />
          </div>

          {/* Reflection Prompt overlay when call ends */}
          <AnimatePresence>
            {showReflectionPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "min(500px, 90%)",
                  background: "#12122A",
                  border: "1px solid rgba(212, 175, 55, 0.5)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.2)",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(212, 175, 55, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Sparkles size={16} color={C.gold} />
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>
                      Session Complete!
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.76rem" }}>
                      Great call with {mentorName}. Earn +30 XP by completing your reflection.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "rgba(255, 255, 255, 0.8)",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Close Call
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteAndClose}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: C.gold,
                      border: "none",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "8px 18px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <Check size={14} /> Mark Reflection (+30 XP)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
