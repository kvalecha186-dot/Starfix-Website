import { supabase } from "./supabase";

export const MESSAGES_CHANGED_EVENT = "starfix:messages-changed";
export const TYPING_CHANGED_EVENT = "starfix:typing-changed";

const STORAGE_KEY = "starfix:conversations";
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export function isMentorTyping(_mentorId: number): boolean {
  return false;
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
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function writeAll(data: Record<number, Conversation>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));
  } catch {}
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

async function mentorUuid(mentorId: number): Promise<string | null> {
  const { data } = await supabase.from("mentors").select("id").eq("legacy_id", mentorId).maybeSingle();
  return data?.id || null;
}

async function remoteConversation(mentorId: number, create: boolean): Promise<string | null> {
  const studentId = await currentUserId();
  const mid = await mentorUuid(mentorId);
  if (!studentId || !mid) return null;
  const existing = (await supabase.from("conversations").select("id").eq("student_id", studentId).eq("mentor_id", mid).maybeSingle()).data;
  if (existing?.id) return String(existing.id);
  if (!create) return null;
  const inserted = await supabase.from("conversations").insert({
    student_id: studentId,
    mentor_id: mid,
    archived: false,
    external_id: String(mentorId),
  }).select("id").single();
  return inserted.data?.id ? String(inserted.data.id) : null;
}

export function getConversations(): Conversation[] {
  return Object.values(readAll())
    .filter((c) => !c.archived)
    .sort((a, b) => new Date(b.messages.at(-1)?.sentAt || b.createdAt).getTime() - new Date(a.messages.at(-1)?.sentAt || a.createdAt).getTime());
}

export function getConversation(mentorId: number): Conversation | null {
  return readAll()[mentorId] || null;
}

export function totalUnreadCount(): number {
  return getConversations().reduce((n, c) => n + c.unreadCount, 0);
}

export async function hydrateMessages(userId?: string): Promise<void> {
  const uidUser = userId || await currentUserId();
  if (!uidUser) return;
  const { data: cs } = await supabase.from("conversations").select("id,mentor_id,archived,created_at,external_id").eq("student_id", uidUser).order("created_at", { ascending: false });
  if (!cs?.length) return;

  const mentorIds = [...new Set(cs.map((c: any) => c.mentor_id))];
  const mentors = (await supabase.from("mentors").select("id,legacy_id").in("id", mentorIds)).data || [];
  const legacy = new Map(mentors.map((m: any) => [m.id, Number(m.legacy_id)]));
  const cids = cs.map((c: any) => c.id);
  const msgs = (await supabase.from("messages").select("id,conversation_id,sender,body,status,created_at").in("conversation_id", cids).order("created_at", { ascending: true })).data || [];

  const all: Record<number, Conversation> = {};
  for (const c of cs as any[]) {
    const mid = legacy.get(c.mentor_id);
    if (!mid) continue;
    const rows = msgs.filter((m: any) => m.conversation_id === c.id);
    all[mid] = {
      mentorId: mid,
      archived: !!c.archived,
      createdAt: c.created_at,
      unreadCount: rows.filter((m: any) => String(m.sender) !== uidUser && m.status !== "seen").length,
      messages: rows.map((m: any) => ({
        id: String(m.id),
        sender: String(m.sender) === uidUser ? "user" : "mentor",
        text: m.body || "",
        sentAt: m.created_at,
        status: m.status || "sent",
      })),
    };
  }
  writeAll(all);
}

export function startMessageRealtime(userId: string) {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel("starfix-student-messages-" + userId)
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
      void hydrateMessages(userId);
    })
    .subscribe();
}

export function stopMessageRealtime() {
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

export function ensureConversation(mentorId: number, _mentorName: string): Conversation {
  const all = readAll();
  let c = all[mentorId];
  if (c) {
    if (c.archived) { c.archived = false; writeAll(all); }
    void remoteConversation(mentorId, true);
    return c;
  }
  c = { mentorId, archived: false, createdAt: new Date().toISOString(), unreadCount: 0, messages: [] };
  all[mentorId] = c;
  writeAll(all);
  void remoteConversation(mentorId, true);
  return c;
}

export function sendMessage(mentorId: number, text: string): Conversation | null {
  const all = readAll();
  const c = all[mentorId];
  if (!c || !text.trim()) return c || null;
  const localId = uid();
  const message: ChatMessage = { id: localId, sender: "user", text: text.trim(), sentAt: new Date().toISOString(), status: "sent" };
  c.messages.push(message);
  writeAll(all);

  void (async () => {
    const studentId = await currentUserId();
    const conversationId = await remoteConversation(mentorId, true);
    if (!studentId || !conversationId) return;
    const result = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender: studentId,
      body: message.text,
      status: "sent",
      external_id: localId,
    }).select("id,created_at").single();
    if (!result.error) {
      message.id = String(result.data?.id || localId);
      message.status = "delivered";
      writeAll(all);
    }
  })();
  return c;
}

export function markDelivered(mentorId: number, messageId: string) {
  const all = readAll();
  const c = all[mentorId];
  const m = c?.messages.find((x) => x.id === messageId);
  if (!m || m.sender !== "user") return;
  m.status = "delivered";
  writeAll(all);
}

export function markRead(mentorId: number) {
  const all = readAll();
  const c = all[mentorId];
  if (!c) return;
  c.unreadCount = 0;
  c.messages.forEach((m) => { if (m.sender === "mentor") m.status = "seen"; });
  writeAll(all);
  void (async () => {
    const conversationId = await remoteConversation(mentorId, false);
    const uidUser = await currentUserId();
    if (conversationId && uidUser) {
      await supabase.from("messages").update({ status: "seen" }).eq("conversation_id", conversationId).neq("sender", uidUser);
    }
  })();
}

export function archiveConversation(mentorId: number) {
  const all = readAll();
  const c = all[mentorId];
  if (!c) return;
  c.archived = true;
  writeAll(all);
  void (async () => {
    const conversationId = await remoteConversation(mentorId, false);
    if (conversationId) await supabase.from("conversations").update({ archived: true }).eq("id", conversationId);
  })();
}

export const QUICK_CHIPS = [
  { label: "Review my progress", text: "Could you review my current progress and let me know if I'm on the right track?" },
  { label: "Explain this topic", text: "Could you explain this topic in a bit more detail? I want to make sure I really understand it." },
  { label: "Check my project", text: "Could you take a look at my project and share some feedback?" },
  { label: "Build a study plan", text: "Could you help me build a study plan for the next few weeks?" },
  { label: "Give me next steps", text: "What should my next steps be to keep making progress on my path?" },
  { label: "Prepare for interview", text: "Can you help me prepare for an upcoming interview?" },
];

export function clearConversations(): void {
  writeAll({});
}
