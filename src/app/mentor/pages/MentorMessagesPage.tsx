import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  CalendarPlus,
  Check,
  CheckCheck,
  Sparkles,
  MessageCircle,
  Clock,
  ArrowRight,
  MoreVertical,
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type { Mentee } from "../lib/mentorDataService";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

interface MessageItem {
  id: string;
  sender: "mentor" | "user";
  text: string;
  sentAt: string;
  status?: "sent" | "delivered" | "seen";
}

interface Thread {
  menteeId: string;
  menteeName: string;
  menteeEmail?: string;
  careerGoal?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: MessageItem[];
}

interface Props {
  mentees: Mentee[];
  openMenteeId?: string | null;
  onOpenScheduleModal: (mentee: Mentee) => void;
}

export function MentorMessagesPage({
  mentees,
  openMenteeId,
  onOpenScheduleModal,
}: Props) {
  const { isMobile, isCompact } = useViewport();
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [activeMenteeId, setActiveMenteeId] = useState<string>(
    openMenteeId || mentees[0]?.id || "mentee_1"
  );
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversations from mentees
  useEffect(() => {
    const initial: Record<string, Thread> = {};

    const defaultConversations: Record<string, MessageItem[]> = {
      mentee_1: [
        {
          id: "m1",
          sender: "user",
          text: "Hi! Looking forward to our system architecture deep dive tomorrow.",
          sentAt: "10:30 AM",
          status: "seen",
        },
        {
          id: "m2",
          sender: "mentor",
          text: "Hi Aarav! Looking forward to it. Have you had a chance to prepare the microservice diagram?",
          sentAt: "10:45 AM",
          status: "seen",
        },
        {
          id: "m3",
          sender: "user",
          text: "Yes, I uploaded the schema and API specs to our drive. We can walk through them first.",
          sentAt: "11:15 AM",
          status: "delivered",
        },
      ],
      mentee_2: [
        {
          id: "m4",
          sender: "user",
          text: "Could you share the PyTorch deployment slides from our previous discussion?",
          sentAt: "Yesterday",
          status: "seen",
        },
        {
          id: "m5",
          sender: "mentor",
          text: "Sent! Check your email or the resources tab on Starfix.",
          sentAt: "Yesterday",
          status: "seen",
        },
      ],
      mentee_4: [
        {
          id: "m6",
          sender: "user",
          text: "Hello mentor, excited for our intro roadmap alignment on Saturday!",
          sentAt: "2 days ago",
          status: "delivered",
        },
      ],
    };

    mentees.forEach((m) => {
      const msgs = defaultConversations[m.id] || [
        {
          id: `init_${m.id}`,
          sender: "user",
          text: `Hi, thank you for connecting with me on Starfix!`,
          sentAt: "Recently",
          status: "seen",
        },
      ];
      initial[m.id] = {
        menteeId: m.id,
        menteeName: m.name,
        menteeEmail: m.email,
        careerGoal: m.careerGoal,
        lastMessage: msgs[msgs.length - 1]?.text || "",
        lastMessageAt: msgs[msgs.length - 1]?.sentAt || "Recent",
        unreadCount: m.id === "mentee_1" ? 1 : 0,
        messages: msgs,
      };
    });

    setThreads(initial);
  }, [mentees]);

  // If openMenteeId is provided, switch to that mentee
  useEffect(() => {
    if (openMenteeId && threads[openMenteeId]) {
      setActiveMenteeId(openMenteeId);
    }
  }, [openMenteeId, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMenteeId, threads]);

  const activeThread = threads[activeMenteeId];
  const activeMentee = mentees.find((m) => m.id === activeMenteeId);

  const handleSendMessage = (textToSend?: string) => {
    const body = (textToSend || inputText).trim();
    if (!body || !activeMenteeId) return;

    const newMsg: MessageItem = {
      id: `msg_${Date.now()}`,
      sender: "mentor",
      text: body,
      sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "delivered",
    };

    setThreads((prev) => {
      const current = prev[activeMenteeId];
      if (!current) return prev;
      return {
        ...prev,
        [activeMenteeId]: {
          ...current,
          messages: [...current.messages, newMsg],
          lastMessage: body,
          lastMessageAt: "Just now",
          unreadCount: 0,
        },
      };
    });

    setInputText("");

    // Optimistically sync to Supabase messages
    void (async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          // If a conversation exists, insert into messages
          const { data: conv } = await supabase
            .from("conversations")
            .select("id")
            .eq("student_id", activeMenteeId)
            .maybeSingle();

          if (conv?.id) {
            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender: "mentor",
              body,
              status: "delivered",
            });
          }
        }
      } catch (err) {
        console.warn("Message sync notice:", err);
      }
    })();
  };

  const quickReplies = [
    "Looking forward to our session!",
    "Feel free to review the materials beforehand.",
    "Let's reschedule to a time that works better for you.",
    "Great work on completing the milestone!",
  ];

  const filteredThreads = Object.values(threads).filter((t) =>
    t.menteeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Page Header ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: M.gold, fontWeight: 700 }}>
            Real-Time Communications
          </span>
        </div>
        <h1 style={{ fontFamily: M.serif, fontSize: "1.85rem", fontWeight: 700, color: M.text, margin: 0 }}>
          Mentee Messages
        </h1>
      </div>

      {/* ── Chat Container: Split Pane ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "320px 1fr",
          background: M.surface,
          border: `1px solid ${M.border}`,
          borderRadius: M.radiusLg,
          overflow: "hidden",
          minHeight: 560,
          maxHeight: "calc(100vh - 200px)",
          boxShadow: M.shadowLg,
        }}
      >
        {/* Left Pane: Conversation List (Hide on mobile if thread active and mobile) */}
        <div
          style={{
            borderRight: `1px solid ${M.border}`,
            background: M.surfaceAlt,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${M.border}` }}>
            <div style={{ position: "relative" }}>
              <Search size={15} color={M.textFaint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 12px 8px 34px",
                  borderRadius: M.radiusSm,
                  background: M.surface,
                  border: `1px solid ${M.borderSubtle}`,
                  color: M.text,
                  fontSize: "0.82rem",
                  fontFamily: M.sans,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filteredThreads.map((thread) => {
              const isSelected = thread.menteeId === activeMenteeId;
              return (
                <div
                  key={thread.menteeId}
                  onClick={() => {
                    setActiveMenteeId(thread.menteeId);
                    setThreads((prev) => ({
                      ...prev,
                      [thread.menteeId]: { ...prev[thread.menteeId], unreadCount: 0 },
                    }));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: M.radiusSm,
                    background: isSelected ? M.goldBg : "transparent",
                    border: `1px solid ${isSelected ? M.goldBorder : "transparent"}`,
                    cursor: "pointer",
                    marginBottom: 4,
                    transition: "all 0.16s ease",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: isSelected ? M.gold : "rgba(255,255,255,0.06)",
                      color: isSelected ? "#11101a" : M.gold,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.86rem",
                      flexShrink: 0,
                    }}
                  >
                    {thread.menteeName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.88rem", color: M.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {thread.menteeName}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: M.textFaint }}>
                        {thread.lastMessageAt}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                      <span style={{ fontSize: "0.78rem", color: M.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 }}>
                        {thread.lastMessage}
                      </span>
                      {thread.unreadCount > 0 && (
                        <span
                          style={{
                            background: M.gold,
                            color: "#11101a",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: "1px 6px",
                          }}
                        >
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Active Chat Thread */}
        <div style={{ display: "flex", flexDirection: "column", background: M.surface }}>
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: `1px solid ${M.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: M.surfaceAlt,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: M.goldBg,
                      border: `1px solid ${M.goldBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: M.gold,
                    }}
                  >
                    {activeThread.menteeName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <div>
                    <h3 style={{ fontSize: "0.96rem", fontWeight: 700, color: M.text, margin: 0 }}>
                      {activeThread.menteeName}
                    </h3>
                    <div style={{ fontSize: "0.76rem", color: M.goldLight, marginTop: 2 }}>
                      {activeThread.careerGoal || "Software Engineering"} · Online
                    </div>
                  </div>
                </div>

                {activeMentee && (
                  <button
                    onClick={() => onOpenScheduleModal(activeMentee)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: M.radiusSm,
                      background: "rgba(212,175,55,0.10)",
                      border: `1px solid ${M.goldBorder}`,
                      color: M.gold,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: M.sans,
                    }}
                  >
                    <CalendarPlus size={14} /> Schedule 1:1
                  </button>
                )}
              </div>

              {/* Message Bubble Stream */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {activeThread.messages.map((msg) => {
                  const isMentor = msg.sender === "mentor";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMentor ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "74%",
                          padding: "12px 16px",
                          borderRadius: isMentor ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isMentor ? "rgba(212,175,55,0.16)" : M.surfaceAlt,
                          border: `1px solid ${isMentor ? M.goldBorder : M.border}`,
                          color: M.text,
                          fontSize: "0.88rem",
                          lineHeight: 1.5,
                          boxShadow: M.shadow,
                        }}
                      >
                        {msg.text}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, padding: "0 4px" }}>
                        <span style={{ fontSize: "0.7rem", color: M.textFaint }}>
                          {msg.sentAt}
                        </span>
                        {isMentor && (
                          <CheckCheck size={12} color={msg.status === "seen" ? M.gold : M.textFaint} />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div style={{ padding: "8px 18px", display: "flex", gap: 8, overflowX: "auto", borderTop: `1px solid ${M.borderSubtle}` }}>
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(reply)}
                    style={{
                      whiteSpace: "nowrap",
                      padding: "4px 10px",
                      borderRadius: M.radiusPill,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${M.border}`,
                      color: M.textMuted,
                      fontSize: "0.74rem",
                      cursor: "pointer",
                      fontFamily: M.sans,
                      transition: "all 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = M.goldBorder;
                      e.currentTarget.style.color = M.gold;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = M.border;
                      e.currentTarget.style.color = M.textMuted;
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <div style={{ padding: "14px 18px", borderTop: `1px solid ${M.border}`, display: "flex", gap: 10 }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Write a message to ${activeThread.menteeName}…`}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.88rem",
                    fontFamily: M.sans,
                    outline: "none",
                  }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: M.radiusSm,
                    background: inputText.trim() ? M.gold : "rgba(255,255,255,0.08)",
                    border: "none",
                    color: inputText.trim() ? "#11101a" : M.textFaint,
                    cursor: inputText.trim() ? "pointer" : "default",
                    transition: "all 0.16s ease",
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: M.textMuted }}>
              Select a mentee to view conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
