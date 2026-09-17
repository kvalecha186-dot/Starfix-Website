import { supabase } from "./supabase";
import { addNotification } from "./notifications";

export const MESSAGES_CHANGED_EVENT = "starfix:messages-changed";
export const TYPING_CHANGED_EVENT = "starfix:typing-changed";
const STORAGE_KEY = "starfix:conversations";
let realtimeStarted = false;

const typingMentors = new Set<number>();

export function isMentorTyping(mentorId: number): boolean {
  return typingMentors.has(mentorId);
}

export interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  text: string;
  sentAt: string;
  status?: "sent" | "delivered" | "seen";
}

export interface Conversation {
  mentorId: number;
  archived: boolean;
  createdAt: string;
  messages: ChatMessage[];
  unreadCount: number;
}

function readAll(): Record<number, Conversation> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(data: Record<number, Conversation>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));
  } catch {
    /* ignore storage errors */
  }
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getConversations(): Conversation[] {
  return Object.values(readAll())
    .filter((c) => !c.archived)
    .sort(
      (a, b) =>
        new Date(b.messages.at(-1)?.sentAt || b.createdAt).getTime() -
        new Date(a.messages.at(-1)?.sentAt || a.createdAt).getTime()
    );
}

export function getConversation(mentorId: number): Conversation | null {
  return readAll()[mentorId] ?? null;
}

export function totalUnreadCount(): number {
  return getConversations().reduce((n, c) => n + c.unreadCount, 0);
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function mentorUuid(mentorId: number): Promise<string | null> {
  const { data } = await supabase
    .from("mentors")
    .select("id")
    .eq("legacy_id", mentorId)
    .maybeSingle();
  return data?.id ?? null;
}

async function persistConversation(mentorId: number, c: Conversation): Promise<void> {
  const studentId = await currentUserId();
  const mid = await mentorUuid(mentorId);
  if (!studentId || !mid) return;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("student_id", studentId)
    .eq("mentor_id", mid)
    .maybeSingle();

  let cid = existing?.id;
  if (!cid) {
    const { data } = await supabase
      .from("conversations")
      .insert({
        student_id: studentId,
        mentor_id: mid,
        archived: c.archived,
        external_id: String(mentorId),
      })
      .select("id")
      .single();
    cid = data?.id;
  }
  if (!cid) return;

  for (const m of c.messages) {
    await supabase.from("messages").upsert(
      {
        conversation_id: cid,
        sender: m.sender,
        body: m.text,
        status: m.status || "sent",
        created_at: m.sentAt,
        external_id: m.id,
      },
      { onConflict: "conversation_id,external_id" }
    );
  }
}

export async function hydrateMessages(userId?: string): Promise<void> {
  const uidUser = userId || (await currentUserId());
  if (!uidUser) return;

  const { data: cs } = await supabase
    .from("conversations")
    .select("id,mentor_id,archived,created_at,external_id")
    .eq("student_id", uidUser)
    .order("created_at", { ascending: false });

  if (!cs?.length) return;

  const mids = [...new Set(cs.map((c: any) => c.mentor_id))];
  const { data: ms } = await supabase
    .from("mentors")
    .select("id,legacy_id")
    .in("id", mids);

  const legacy = new Map((ms || []).map((m: any) => [m.id, Number(m.legacy_id)]));
  const cids = cs.map((c: any) => c.id);

  const { data: msgs } = await supabase
    .from("messages")
    .select("id,conversation_id,sender,body,status,created_at,external_id")
    .in("conversation_id", cids)
    .order("created_at", { ascending: true });

  const all: Record<number, Conversation> = {};
  for (const c of cs as any[]) {
    const mid = legacy.get(c.mentor_id);
    if (!mid) continue;
    all[mid] = {
      mentorId: mid,
      archived: !!c.archived,
      createdAt: c.created_at,
      unreadCount: 0,
      messages: (msgs || [])
        .filter((m: any) => m.conversation_id === c.id)
        .map((m: any) => ({
          id: m.external_id || m.id,
          sender: m.sender,
          text: m.body,
          sentAt: m.created_at,
          status: m.status,
        })),
    };
  }

  const local = readAll();
  for (const [id, c] of Object.entries(local)) {
    if (!all[Number(id)]) all[Number(id)] = c;
  }
  writeAll(all);
}

export function startMessageRealtime(userId: string) {
  if (realtimeStarted) return;
  realtimeStarted = true;
  supabase
    .channel(`starfix-messages-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
      void hydrateMessages(userId);
    })
    .subscribe();
}

export function ensureConversation(mentorId: number, _mentorName: string): Conversation {
  const all = readAll();
  let c = all[mentorId];
  if (c) {
    if (c.archived) {
      c.archived = false;
      writeAll(all);
      void persistConversation(mentorId, c);
    }
    return c;
  }
  c = {
    mentorId,
    archived: false,
    createdAt: new Date().toISOString(),
    unreadCount: 0,
    messages: [],
  };
  all[mentorId] = c;
  writeAll(all);
  void persistConversation(mentorId, c);
  return c;
}

const MENTOR_PERSONAS: Record<number, { name: string; title: string; field: string }> = {
  1: { name: "Aria Chen", title: "Senior ML Engineer at Google", field: "AI/ML and PyTorch" },
  2: { name: "Marcus Webb", title: "Growth Coach at a16z Portfolio", field: "Startup Strategy & Growth" },
  3: { name: "Priya Sharma", title: "Lead UX Designer at Figma", field: "Product & UI/UX Design" },
  4: { name: "Daniel Park", title: "Certified Financial Planner at Fidelity", field: "Personal Finance & Investing" },
  5: { name: "Sofia Torres", title: "Software Engineer at Stripe", field: "System Design & Full-Stack" },
  6: { name: "Rahul Gupta", title: "IELTS & Language Trainer", field: "Languages & Communication" },
  7: { name: "Emma Walsh", title: "Content Strategist at HubSpot", field: "Content Systems & Audience" },
  8: { name: "Maya Lin", title: "Executive Leadership Coach", field: "Executive Presence & Storytelling" },
  9: { name: "Alex Rivera", title: "Performance Fitness Coach", field: "Athletic Performance & Habits" },
  10: { name: "Elena Rostova", title: "Mindfulness & Meditation Coach", field: "Mindfulness & Deep Work" },
};

function generateMentorReply(mentorId: number, userText: string): string {
  const p = MENTOR_PERSONAS[mentorId] || { name: "Your Mentor", title: "Starfix Mentor", field: "your path" };
  const lower = userText.toLowerCase();

  if (lower.includes("progress") || lower.includes("track") || lower.includes("review my progress")) {
    return `Hi! I've been checking your latest progress. Your momentum is fantastic, especially how you've tackled the recent milestone tasks. Let's make sure you solidify test coverage and clean abstractions before our next checkpoint!`;
  }
  if (lower.includes("explain") || lower.includes("detail") || lower.includes("understand")) {
    return `Great question. When breaking this down in ${p.field}, the most crucial element is the mental model. It's less about the specific syntax and more about the trade-offs at scale. Let's do a live screenshare on our next call so I can walk you through real production examples!`;
  }
  if (lower.includes("project") || lower.includes("feedback") || lower.includes("check my project")) {
    return `I'd love to review your work! Drop the repository or design link right here. As I look through it, I'll pay special attention to architecture, readability, and performance. Keep pushing!`;
  }
  if (lower.includes("study plan") || lower.includes("plan") || lower.includes("schedule")) {
    return `Consistency always beats marathon cramming. I recommend a locked-in 45-minute deep work block each day. Try tackling 1 milestone every 3–4 days, and book our 1:1 call as soon as you finish your upcoming challenge.`;
  }
  if (lower.includes("interview") || lower.includes("prepare") || lower.includes("mock")) {
    return `For interview readiness, the secret is structuring your thoughts out loud before jumping into solutions. Practice stating your assumptions and clarifying constraints upfront. We can run a full mock interview on our next session!`;
  }
  if (lower.includes("next step") || lower.includes("what should")) {
    return `Your immediate next step is to finalize your active milestone and test your implementation under realistic constraints. Once that's complete, review the reflection prompt in your workspace. You're doing great!`;
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hey! Great to connect with you on Starfix. I'm here to support you in ${p.field}. What's currently at the top of your mind, or what are you aiming to build this week?`;
  }

  return `Thanks for reaching out! I've noted your question regarding ${p.field}. Keep up the great work on your learning path, and don't hesitate to book a 1:1 slot on my calendar if you'd like to work through this together live!`;
}

export function sendMessage(mentorId: number, text: string): Conversation | null {
  const all = readAll();
  const c = all[mentorId];
  if (!c || !text.trim()) return c ?? null;

  const userMsgId = uid();
  const m: ChatMessage = {
    id: userMsgId,
    sender: "user",
    text: text.trim(),
    sentAt: new Date().toISOString(),
    status: "sent",
  };

  c.messages.push(m);
  writeAll(all);
  void persistConversation(mentorId, c);

  // 1. Advance to delivered after 600ms
  window.setTimeout(() => {
    markDelivered(mentorId, userMsgId);
  }, 600);

  // 2. Advance to seen after 1400ms
  window.setTimeout(() => {
    const current = readAll();
    const targetConvo = current[mentorId];
    if (targetConvo) {
      const targetMsg = targetConvo.messages.find((x) => x.id === userMsgId);
      if (targetMsg && targetMsg.sender === "user") {
        targetMsg.status = "seen";
        writeAll(current);
        void persistConversation(mentorId, targetConvo);
      }
    }
  }, 1400);

  // 3. Trigger mentor typing indicator after 1600ms
  window.setTimeout(() => {
    typingMentors.add(mentorId);
    window.dispatchEvent(new Event(TYPING_CHANGED_EVENT));
  }, 1600);

  // 4. Mentor intelligent auto-reply after 3600ms
  window.setTimeout(() => {
    typingMentors.delete(mentorId);
    window.dispatchEvent(new Event(TYPING_CHANGED_EVENT));

    const current = readAll();
    const targetConvo = current[mentorId];
    if (!targetConvo) return;

    const replyText = generateMentorReply(mentorId, text);
    const mentorMsg: ChatMessage = {
      id: uid(),
      sender: "mentor",
      text: replyText,
      sentAt: new Date().toISOString(),
      status: "delivered",
    };

    targetConvo.messages.push(mentorMsg);
    targetConvo.unreadCount += 1;
    writeAll(current);
    void persistConversation(mentorId, targetConvo);

    const persona = MENTOR_PERSONAS[mentorId] || { name: "Your Mentor" };
    addNotification(
      "mentor_replied",
      `${persona.name} sent you a message`,
      replyText.length > 70 ? `${replyText.slice(0, 67)}...` : replyText
    );
  }, 3600);

  return c;
}

export function markDelivered(mentorId: number, messageId: string) {
  const all = readAll();
  const c = all[mentorId];
  if (!c) return;
  const m = c.messages.find((x) => x.id === messageId);
  if (!m || m.sender !== "user") return;
  m.status = "delivered";
  writeAll(all);
  void persistConversation(mentorId, c);
}

export function markRead(mentorId: number) {
  const all = readAll();
  const c = all[mentorId];
  if (!c) return;
  c.unreadCount = 0;
  writeAll(all);
}

export function archiveConversation(mentorId: number) {
  const all = readAll();
  const c = all[mentorId];
  if (!c) return;
  c.archived = true;
  writeAll(all);
  void persistConversation(mentorId, c);
}

export const QUICK_CHIPS = [
  { label: "Review my progress", text: "Could you review my current progress and let me know if I'm on the right track?" },
  { label: "Explain this topic", text: "Could you explain this topic in a bit more detail? I want to make sure I really understand it." },
  { label: "Check my project", text: "Could you take a look at my project and share some feedback?" },
  { label: "Build a study plan", text: "Could you help me build a study plan for the next few weeks?" },
  { label: "Give me next steps", text: "What should my next steps be to keep making progress on my path?" },
  { label: "Prepare for interview", text: "Can you help me prepare for an upcoming interview?" },
];
