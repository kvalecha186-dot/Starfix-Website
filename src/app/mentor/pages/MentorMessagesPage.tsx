import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  CalendarPlus,
  CheckCheck,
  ArrowLeft,
  MessageCircle,
  BookOpen,
  Share2,
  FileText,
  Target,
  Clock,
  ExternalLink,
  Sparkles,
  Check,
  X,
  Plus,
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type { Mentee } from "../lib/mentorDataService";
import { saveMenteeNotes, getMenteeNotes, fetchMentorConversations, ensureMentorConversation, sendMentorChatMessage, markMentorConversationRead } from "../lib/mentorDataService";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

interface MessageItem {
  id: string;
  sender: "mentor" | "user";
  text: string;
  sentAt: string;
  status?: "sent" | "delivered" | "seen";
  resourceAttachment?: {
    title: string;
    type: string;
    url: string;
  };
}

interface Thread {
  conversationId?: string;
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
  mentorId: string;
  mentees: Mentee[];
  openMenteeId?: string | null;
  onOpenScheduleModal: (mentee: Mentee) => void;
  onUpdateMentee?: (menteeId: string, patch: Partial<Mentee>) => void;
}

const STARFIX_CURATED_RESOURCES = [
  {
    title: "Designing Data-Intensive Applications (DDIA Summary)",
    type: "Architecture Doc",
    url: "https://starfix.app/resources/ddia-summary",
    description: "First-principles deep dive into distributed consensus, replication, and sharding.",
  },
  {
    title: "High-Throughput Redis Caching & Cache-Aside Patterns",
    type: "Guide & Code",
    url: "https://starfix.app/resources/redis-patterns",
    description: "Production strategies for handling cache thundering herds and key invalidation.",
  },
  {
    title: "PyTorch Multi-Head Attention From Scratch",
    type: "Interactive Lab",
    url: "https://starfix.app/resources/pytorch-attention",
    description: "Hands-on implementation of scaled dot-product attention and tensor broadcasting.",
  },
  {
    title: "Kubernetes Multi-Region Failover Architecture",
    type: "SRE Blueprint",
    url: "https://starfix.app/resources/k8s-failover",
    description: "Zero-downtime routing with global traffic directors and cross-cluster sync.",
  },
  {
    title: "React Concurrent Rendering & Performance Profiling",
    type: "Frontend Video",
    url: "https://starfix.app/resources/react-perf",
    description: "Analyzing flamegraphs, memory leaks, and optimizing long render tasks.",
  },
];

export function MentorMessagesPage({
  mentorId,
  mentees,
  openMenteeId,
  onOpenScheduleModal,
  onUpdateMentee,
}: Props) {
  const { isCompact, isDesktop } = useViewport();
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [activeMenteeId, setActiveMenteeId] = useState<string>(
    openMenteeId || mentees[0]?.id || "mentee_1"
  );
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Private note editing in right panel
  const [contextNote, setContextNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick reply chips
  const quickReplies = [
    "I've reviewed your schema. Let's discuss it in our next session.",
    "Great milestone submission! Keep up the solid momentum.",
    "Could you push the latest commit before our call tomorrow?",
    "Check out the architecture doc I shared on distributed caching.",
  ];

  const reloadRemoteThreads = async () => {
    const remote = await fetchMentorConversations(mentorId);
    const next: Record<string, Thread> = {};
    remote.forEach((t) => {
      const msgs: MessageItem[] = t.messages.map((m) => ({
        id: m.id,
        sender: m.sender === "mentor" ? "mentor" : "user",
        text: m.text,
        sentAt: new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: (m.status as any) || "sent",
      }));
      next[t.studentId] = {
        conversationId: t.conversationId,
        menteeId: t.studentId,
        menteeName: t.studentName,
        menteeEmail: t.studentEmail,
        careerGoal: t.careerGoal,
        lastMessage: msgs[msgs.length - 1]?.text || "",
        lastMessageAt: msgs.length ? "Recent" : "New",
        unreadCount: t.unreadCount,
        messages: msgs,
      };
    });
    mentees.forEach((m) => {
      if (!next[m.id]) {
        next[m.id] = {
          menteeId: m.id,
          menteeName: m.name,
          menteeEmail: m.email,
          careerGoal: m.careerGoal,
          lastMessage: "",
          lastMessageAt: "New",
          unreadCount: 0,
          messages: [],
        };
      }
    });
    setThreads(next);
  };

  useEffect(() => {
    void reloadRemoteThreads();
    const channel = supabase
      .channel("mentor-chat-" + mentorId)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => { void reloadRemoteThreads(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [mentorId, mentees.length]);

  // If openMenteeId is provided, switch to that mentee
  useEffect(() => {
    if (openMenteeId && threads[openMenteeId]) {
      setActiveMenteeId(openMenteeId);
      setMobileShowThread(true);
    }
  }, [openMenteeId, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMenteeId, threads]);

  // Sync context note when active mentee changes
  useEffect(() => {
    if (activeMenteeId) {
      setContextNote(getMenteeNotes(activeMenteeId));
    }
  }, [activeMenteeId]);

  const activeThread = threads[activeMenteeId];
  const activeMentee = mentees.find((m) => m.id === activeMenteeId);

  const handleSaveContextNote = () => {
    if (!activeMenteeId) return;
    setSavingNote(true);
    saveMenteeNotes(activeMenteeId, contextNote);
    if (onUpdateMentee) {
      onUpdateMentee(activeMenteeId, { notes: contextNote });
    }
    setTimeout(() => {
      setSavingNote(false);
      toast.success("Private coaching note updated.");
    }, 200);
  };

  const handleSendMessage = async (textToSend?: string, resourceAttachment?: { title: string; type: string; url: string }) => {
    const body = (textToSend || inputText).trim();
    if (!body && !resourceAttachment) return;
    if (!activeMenteeId) return;
    const thread = threads[activeMenteeId];
    if (!thread) return;

    const conversationId = thread.conversationId || await ensureMentorConversation(mentorId, activeMenteeId);
    if (!conversationId) {
      toast.error("This student is not connected to your mentor account yet.");
      return;
    }
    const textBody = body || 'Recommended learning resource: "' + resourceAttachment?.title + '"';
    const ok = await sendMentorChatMessage(conversationId, textBody);
    if (!ok) {
      toast.error("Message could not be sent.");
      return;
    }
    await markMentorConversationRead(conversationId);
    setInputText("");
    setShowResourcePicker(false);
    await reloadRemoteThreads();
  };

  const filteredThreadKeys = Object.keys(threads).filter((id) => {
    const t = threads[id];
    return (
      t.menteeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.careerGoal && t.careerGoal.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "calc(100vh - 100px)" }}>
      {/* ── Chat Container ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          background: M.surface,
          border: `1px solid ${M.border}`,
          borderRadius: M.radiusLg,
          overflow: "hidden",
          boxShadow: M.shadow,
          minHeight: 0,
        }}
      >
        {/* ── Left Pane: Conversation List (Locked 290px, flexShrink: 0) ── */}
        <aside
          style={{
            width: isCompact ? (mobileShowThread ? "0" : "100%") : 290,
            display: isCompact && mobileShowThread ? "none" : "flex",
            flexDirection: "column",
            borderRight: `1px solid ${M.border}`,
            background: M.surface,
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${M.borderSubtle}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: M.serif, fontWeight: 700, fontSize: "1.1rem", color: M.text }}>
                  Conversations
                </span>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: M.goldBg,
                    color: M.gold,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {mentees.length}
                </span>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <Search
                size={14}
                color={M.textFaint}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 12px 8px 32px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.82rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredThreadKeys.map((key) => {
              const thread = threads[key];
              const active = key === activeMenteeId;
              return (
                <div
                  key={key}
                  onClick={() => {
                    setActiveMenteeId(key);
                    setMobileShowThread(true);
                  }}
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    background: active ? M.goldBg : "transparent",
                    borderBottom: `1px solid ${M.borderSubtle}`,
                    borderLeft: `3px solid ${active ? M.gold : "transparent"}`,
                    transition: "all 0.16s ease",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: active ? M.gold : "rgba(255,255,255,0.06)",
                      border: `1px solid ${active ? M.goldBorder : M.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.86rem",
                      color: active ? "#11101a" : M.gold,
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
                      <div
                        style={{
                          fontWeight: active ? 700 : 600,
                          fontSize: "0.86rem",
                          color: active ? M.gold : M.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {thread.menteeName}
                      </div>
                      <span style={{ fontSize: "0.7rem", color: M.textFaint }}>
                        {thread.lastMessageAt}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.76rem",
                        color: active ? M.text : M.textMuted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 3,
                      }}
                    >
                      {thread.lastMessage}
                    </div>
                  </div>

                  {thread.unreadCount > 0 && (
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: M.gold,
                        color: "#11101a",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Center Pane: Active Message Thread (flex: 1, minWidth: 0) ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: isCompact && !mobileShowThread ? "none" : "flex",
            flexDirection: "column",
            height: "100%",
            background: M.bg,
          }}
        >
          {activeThread ? (
            <>
              {/* Chat Thread Header */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: `1px solid ${M.border}`,
                  background: M.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  {isCompact && (
                    <button
                      onClick={() => setMobileShowThread(false)}
                      style={{ background: "none", border: "none", color: M.textMuted, cursor: "pointer", padding: 4 }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: M.goldBg,
                      border: `1px solid ${M.goldBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.86rem",
                      fontWeight: 700,
                      color: M.gold,
                      flexShrink: 0,
                    }}
                  >
                    {activeThread.menteeName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: "0.96rem", fontWeight: 700, color: M.text, margin: 0 }}>
                      {activeThread.menteeName}
                    </h3>
                    <div style={{ fontSize: "0.76rem", color: M.goldLight, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeThread.careerGoal || "Software Engineering"} · Online
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setShowResourcePicker(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: M.radiusSm,
                      background: "rgba(212,175,55,0.08)",
                      border: `1px solid ${M.goldBorder}`,
                      color: M.gold,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: M.sans,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <BookOpen size={13} /> Share Resource
                  </button>

                  {activeMentee && (
                    <button
                      onClick={() => onOpenScheduleModal(activeMentee)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: M.radiusSm,
                        background: M.gold,
                        border: "none",
                        color: "#11101a",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: M.sans,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <CalendarPlus size={13} /> Schedule 1:1
                    </button>
                  )}
                </div>
              </div>

              {/* Message Bubble Stream */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 0,
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
                          maxWidth: "75%",
                          padding: "12px 16px",
                          borderRadius: isMentor ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isMentor ? "rgba(212,175,55,0.16)" : M.surfaceAlt,
                          border: `1px solid ${isMentor ? M.goldBorder : M.border}`,
                          color: M.text,
                          fontSize: "0.88rem",
                          lineHeight: 1.5,
                          boxShadow: M.shadow,
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.text}

                        {/* Rich Resource Card attachment if present */}
                        {msg.resourceAttachment && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: "10px 12px",
                              borderRadius: M.radiusSm,
                              background: M.surface,
                              border: `1px solid ${M.goldBorder}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "0.7rem", color: M.gold, textTransform: "uppercase", fontWeight: 700 }}>
                                {msg.resourceAttachment.type}
                              </div>
                              <div style={{ fontSize: "0.84rem", fontWeight: 600, color: M.text, marginTop: 2 }}>
                                {msg.resourceAttachment.title}
                              </div>
                            </div>
                            <a
                              href={msg.resourceAttachment.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 8px",
                                borderRadius: M.radiusSm,
                                background: M.goldBg,
                                color: M.gold,
                                fontSize: "0.74rem",
                                textDecoration: "none",
                                fontWeight: 600,
                              }}
                            >
                              Open <ExternalLink size={11} />
                            </a>
                          </div>
                        )}
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
              <div
                style={{
                  padding: "8px 16px",
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  borderTop: `1px solid ${M.borderSubtle}`,
                  flexShrink: 0,
                  maxWidth: "100%",
                }}
              >
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(reply)}
                    style={{
                      whiteSpace: "nowrap",
                      padding: "5px 12px",
                      borderRadius: M.radiusPill,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${M.border}`,
                      color: M.textMuted,
                      fontSize: "0.76rem",
                      cursor: "pointer",
                      fontFamily: M.sans,
                      transition: "all 0.16s ease",
                      flexShrink: 0,
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
              <div style={{ padding: "14px 18px", borderTop: `1px solid ${M.border}`, display: "flex", gap: 10, flexShrink: 0, background: M.surface }}>
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
                    minWidth: 0,
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
                    flexShrink: 0,
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

        {/* ── Right Pane: Contextual Mentee Panel (270px, flexShrink: 0, desktop only) ── */}
        {isDesktop && activeMentee && (
          <aside
            style={{
              width: 270,
              flexShrink: 0,
              background: M.surface,
              borderLeft: `1px solid ${M.border}`,
              display: "flex",
              flexDirection: "column",
              padding: "18px 20px",
              gap: 16,
              overflowY: "auto",
            }}
          >
            <div>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: M.gold, fontWeight: 700 }}>
                Mentee Context
              </span>
              <h4 style={{ fontSize: "0.96rem", fontWeight: 700, color: M.text, margin: "3px 0 0" }}>
                {activeMentee.name}
              </h4>
              <div style={{ fontSize: "0.78rem", color: M.textMuted, marginTop: 2 }}>
                {activeMentee.email}
              </div>
            </div>

            {/* Growth Path Progress */}
            <div style={{ padding: "12px 14px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: M.textFaint, marginBottom: 4 }}>
                <span style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>Growth Track</span>
                <strong style={{ color: M.gold }}>{activeMentee.progressPercent}%</strong>
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: M.text, marginBottom: 6 }}>
                {activeMentee.pathTitle || activeMentee.careerGoal}
              </div>
              <div style={{ width: "100%", height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${activeMentee.progressPercent}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${M.gold} 0%, ${M.goldLight} 100%)`,
                    borderRadius: 999,
                  }}
                />
              </div>
              <div style={{ fontSize: "0.72rem", color: M.textFaint, marginTop: 8 }}>
                Next: <strong style={{ color: M.textMuted }}>{activeMentee.nextMilestone}</strong>
              </div>
            </div>

            {/* Upcoming Session */}
            <div style={{ padding: "12px 14px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
              <div style={{ fontSize: "0.72rem", color: M.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                Next 1:1 Call
              </div>
              {activeMentee.nextSessionDate ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: M.gold, fontSize: "0.82rem", fontWeight: 600 }}>
                  <Clock size={13} /> {activeMentee.nextSessionDate}
                </div>
              ) : (
                <div style={{ fontSize: "0.8rem", color: M.textMuted }}>
                  No upcoming session booked
                </div>
              )}
            </div>

            {/* Quick Private Notes */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: "0.74rem", color: M.textMuted, fontWeight: 600 }}>
                  Private Mentoring Notes
                </label>
                <button
                  onClick={handleSaveContextNote}
                  disabled={savingNote}
                  style={{
                    background: "none",
                    border: "none",
                    color: M.gold,
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {savingNote ? "Saving…" : "Save"}
                </button>
              </div>
              <textarea
                rows={4}
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                placeholder="Private observation notes for this mentee…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>
          </aside>
        )}
      </div>

      {/* ── Share Curated Resource Modal ── */}
      {showResourcePicker && (
        <div
          onClick={() => setShowResourcePicker(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 540,
              background: M.surface,
              border: `1px solid ${M.goldBorder}`,
              borderRadius: M.radiusLg,
              padding: "24px 26px",
              boxShadow: M.shadowLg,
              color: M.text,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: M.gold, fontWeight: 700 }}>
                  Curated Catalog
                </span>
                <h3 style={{ fontFamily: M.serif, fontSize: "1.25rem", color: M.text, margin: "2px 0 0" }}>
                  Share Resource with {activeThread?.menteeName}
                </h3>
              </div>
              <button onClick={() => setShowResourcePicker(false)} style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
              {STARFIX_CURATED_RESOURCES.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    handleSendMessage(
                      `I'm recommending you review this resource before our next session: "${res.title}"`,
                      res
                    );
                    toast.success(`Shared "${res.title}" in chat.`);
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.borderSubtle}`,
                    cursor: "pointer",
                    transition: "all 0.16s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = M.goldBorder;
                    e.currentTarget.style.background = M.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = M.borderSubtle;
                    e.currentTarget.style.background = M.surfaceAlt;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.86rem", color: M.text }}>
                      {res.title}
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 6px",
                        borderRadius: M.radiusPill,
                        background: M.goldBg,
                        color: M.gold,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {res.type}
                    </span>
                  </div>
                  <p style={{ color: M.textMuted, fontSize: "0.78rem", margin: "4px 0 0", lineHeight: 1.4 }}>
                    {res.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
