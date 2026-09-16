import { supabase } from "./supabase";

export const MESSAGES_CHANGED_EVENT = "starfix:messages-changed";
const STORAGE_KEY = "starfix:conversations";

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
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT)); } catch { /* ignore */ }
}
function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

export function getConversations(): Conversation[] {
  return Object.values(readAll()).filter((c) => !c.archived).sort((a,b) => new Date(b.messages.at(-1)?.sentAt || b.createdAt).getTime() - new Date(a.messages.at(-1)?.sentAt || a.createdAt).getTime());
}
export function getConversation(mentorId: number): Conversation | null { return readAll()[mentorId] ?? null; }
export function totalUnreadCount(): number { return getConversations().reduce((sum,c) => sum + c.unreadCount, 0); }

async function currentUserId() { const { data } = await supabase.auth.getUser(); return data.user?.id ?? null; }
async function mentorUuid(mentorId: number): Promise<string | null> {
  const { data } = await supabase.from("mentors").select("id").eq("legacy_id", mentorId).maybeSingle();
  return data?.id ?? null;
}

async function persistConversation(mentorId: number, conversation: Conversation) {
  const studentId = await currentUserId(); const mentorIdDb = await mentorUuid(mentorId);
  if (!studentId || !mentorIdDb) return;
  const { data: existing } = await supabase.from("conversations").select("id").eq("student_id", studentId).eq("mentor_id", mentorIdDb).maybeSingle();
  let conversationId = existing?.id;
  if (!conversationId) {
    const { data } = await supabase.from("conversations").insert({ student_id: studentId, mentor_id: mentorIdDb, archived: conversation.archived, external_id: String(mentorId) }).select("id").single();
    conversationId = data?.id;
  }
  if (!conversationId) return;
  for (const message of conversation.messages) {
    await supabase.from("messages").upsert({
      conversation_id: conversationId, sender: message.sender, body: message.text,
      status: message.status || "sent", created_at: message.sentAt, external_id: message.id,
    }, { onConflict: "conversation_id,external_id" });
  }
}

export async function hydrateMessages(userId?: string) {
  const uidUser = userId || await currentUserId(); if (!uidUser) return;
  const { data: convos } = await supabase.from("conversations").select("id,mentor_id,archived,created_at,external_id").eq("student_id", uidUser).order("created_at", { ascending: false });
  if (!convos?.length) return;
  const mentorIds = [...new Set(convos.map((c:any) => c.mentor_id))];
  const { data: mentors } = await supabase.from("mentors").select("id,legacy_id").in("id", mentorIds);
  const legacyByUuid = new Map((mentors || []).map((m:any) => [m.id, Number(m.legacy_id)]));
  const ids = convos.map((c:any) => c.id);
  const { data: msgs } = await supabase.from("messages").select("id,conversation_id,sender,body,status,created_at,external_id").in("conversation_id", ids).order("created_at", { ascending: true });
  const all: Record<number, Conversation> = {};
  for (const c of convos as any[]) {
    const mentorId = legacyByUuid.get(c.mentor_id); if (!mentorId) continue;
    all[mentorId] = { mentorId, archived: !!c.archived, createdAt: c.created_at, unreadCount: 0, messages: (msgs || []).filter((m:any) => m.conversation_id === c.id).map((m:any) => ({ id: m.external_id || m.id, sender: m.sender, text: m.body, sentAt: m.created_at, status: m.status })) };
  }
  const local = readAll();
  for (const [id,c] of Object.entries(local)) if (!all[Number(id)]) all[Number(id)] = c;
  writeAll(all);
}

export function ensureConversation(mentorId: number, _mentorName: string): Conversation {
  const all = readAll();
  let c = all[mentorId];
  if (c) { if (c.archived) { c.archived = false; writeAll(all); void persistConversation(mentorId,c); } return c; }
  c = { mentorId, archived: false, createdAt: new Date().toISOString(), unreadCount: 0, messages: [] };
  all[mentorId] = c; writeAll(all); void persistConversation(mentorId,c); return c;
}

export function sendMessage(mentorId: number, text: string): Conversation | null {
  const all = readAll(); const c = all[mentorId]; if (!c || !text.trim()) return c ?? null;
  const message: ChatMessage = { id: uid(), sender: "user", text: text.trim(), sentAt: new Date().toISOString(), status: "sent" };
  c.messages.push(message); writeAll(all); void persistConversation(mentorId,c); return c;
}

export function markDelivered(mentorId: number, messageId: string) {
  const all = readAll(); const c = all[mentorId]; if (!c) return;
  const msg = c.messages.find((m) => m.id === messageId); if (!msg || msg.sender !== "user") return;
  msg.status = "delivered"; writeAll(all);
  void (async () => { const uidUser = await currentUserId(); if (!uidUser) return; const mentor = await mentorUuid(mentorId); if (!mentor) return; const { data: convo } = await supabase.from("conversations").select("id").eq("student_id", uidUser).eq("mentor_id", mentor).maybeSingle(); if (convo) await supabase.from("messages").update({ status: "delivered" }).eq("conversation_id", convo.id).eq("external_id", messageId); })();
}

export function markRead(mentorId: number) { const all = readAll(); const c = all[mentorId]; if (!c) return; c.unreadCount = 0; writeAll(all); }
export function archiveConversation(mentorId: number) { const all = readAll(); const c = all[mentorId]; if (!c) return; c.archived = true; writeAll(all); void persistConversation(mentorId,c); }

export const QUICK_CHIPS: { label: string; text: string }[] = [
  { label: "Review my progress", text: "Could you review my current progress and let me know if I'm on the right track?" },
  { label: "Explain this topic", text: "Could you explain this topic in a bit more detail? I want to make sure I really understand it." },
  { label: "Check my project", text: "Could you take a look at my project and share some feedback?" },
  { label: "Build a study plan", text: "Could you help me build a study plan for the next few weeks?" },
  { label: "Give me next steps", text: "What should my next steps be to keep making progress on my path?" },
  { label: "Prepare for interview", text: "Can you help me prepare for an upcoming interview?" },
];
