/* ─────────────────────────────────────────────────────────────────────────
   Mentor messaging store — one persistent conversation per mentor the
   learner has ever messaged. Backed by localStorage (no backend in this
   project — see package.json), same read/write/validate pattern as
   watchQueue.ts and pathProgress.ts. Every write fires
   MESSAGES_CHANGED_EVENT so the sidebar unread badge and any open
   Messages view stay in sync without prop drilling.

   Conversations are never deleted on their own — only archived (kept in
   storage, hidden from the default list) — so history always survives a
   refresh or navigating away and back, exactly like a real inbox.
───────────────────────────────────────────────────────────────────────── */

export const MESSAGES_CHANGED_EVENT = "starfix:messages-changed";
const STORAGE_KEY = "starfix:conversations";

export interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  text: string;
  sentAt: string; // ISO
  status?: "sent" | "delivered" | "seen"; // learner-side messages only.
  // "seen" is reserved for when a real mentor actually opens the thread —
  // nothing in this app sets it today, on purpose, since there's no real
  // mentor backend yet. Never faked to look more responsive than it is.
}

export interface Conversation {
  mentorId: number;
  archived: boolean;
  createdAt: string;
  messages: ChatMessage[];
  unreadCount: number; // unread *mentor* messages, from the learner's side
}

function isValidConversation(v: any): v is Conversation {
  return v && typeof v === "object" &&
    typeof v.mentorId === "number" &&
    Array.isArray(v.messages) &&
    typeof v.createdAt === "string";
}
function readAll(): Record<number, Conversation> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<number, Conversation>) : {};
    let dropped = false;
    for (const key of Object.keys(parsed)) {
      const c = parsed[key as unknown as number];
      if (!isValidConversation(c)) { delete parsed[key as unknown as number]; dropped = true; continue; }
      if (c.archived === undefined) c.archived = false;
      if (c.unreadCount === undefined) c.unreadCount = 0;
    }
    if (dropped) { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch { /* ignore */ } }
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(data: Record<number, Conversation>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));
  } catch { /* ignore */ }
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* Every non-archived conversation, most-recently-active first — what the
   left-column conversation list renders. */
export function getConversations(): Conversation[] {
  return Object.values(readAll())
    .filter((c) => !c.archived)
    .sort((a, b) => {
      const at = a.messages.at(-1)?.sentAt ?? a.createdAt;
      const bt = b.messages.at(-1)?.sentAt ?? b.createdAt;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
}

export function getConversation(mentorId: number): Conversation | null {
  return readAll()[mentorId] ?? null;
}

export function totalUnreadCount(): number {
  return getConversations().reduce((sum, c) => sum + c.unreadCount, 0);
}
/* A short, warm opener from the mentor so a brand-new thread never opens
   completely blank — this is what "Message Mentor" creates on first click. */
function openerFor(mentorName: string): string {
  const first = mentorName.split(" ")[0];
  return `Hi! I'm ${first}, glad to be your mentor here. Feel free to ask me anything about your current milestone, or just say hello to get started.`;
}

/* Creates the conversation if it doesn't exist yet (with a mentor opener),
   or returns the existing one untouched. This is the single entry point
   "Message Mentor" calls — it never duplicates a thread. */
export function ensureConversation(mentorId: number, mentorName: string): Conversation {
  const all = readAll();
  let c = all[mentorId];
  if (c && c.archived) { c.archived = false; writeAll(all); return c; }
  if (c) return c;
  c = {
    mentorId,
    archived: false,
    createdAt: new Date().toISOString(),
    unreadCount: 0,
    messages: [{ id: uid(), sender: "mentor", text: openerFor(mentorName), sentAt: new Date().toISOString() }],
  };
  all[mentorId] = c;
  writeAll(all);
  return c;
}

export function sendMessage(mentorId: number, text: string): Conversation | null {
  const all = readAll();
  const c = all[mentorId];
  if (!c || !text.trim()) return c ?? null;
  c.messages.push({ id: uid(), sender: "user", text: text.trim(), sentAt: new Date().toISOString(), status: "sent" });
  writeAll(all);
  return c;
}

/* Flips a learner message from "sent" to "delivered" once it's safely
   persisted — this reflects the message reaching storage, not a mentor
   doing anything. "seen" is intentionally never set here; only a real
   mentor opening the thread should ever produce that state, and this demo
   has no real mentor backend to do that. */
export function markDelivered(mentorId: number, messageId: string) {
  const all = readAll();
  const c = all[mentorId];
  if (!c) return;
  const msg = c.messages.find((m) => m.id === messageId);
  if (!msg || msg.sender !== "user" || msg.status !== "sent") return;
  msg.status = "delivered";
  writeAll(all);
}

export function markRead(mentorId: number) {
  const all = readAll();
  const c = all[mentorId];
  if (!c || c.unreadCount === 0) return;
  c.unreadCount = 0;
  writeAll(all);
}

export function archiveConversation(mentorId: number) {
  const all = readAll();
  const c = all[mentorId];
  if (!c) return;
  c.archived = true;
  writeAll(all);
}
/* Quick-reply chips shown above the composer — clicking one inserts the
   prewritten text into the input rather than sending immediately, so the
   learner can still edit before sending. */
export const QUICK_CHIPS: { label: string; text: string }[] = [
  { label: "Review my progress", text: "Could you review my current progress and let me know if I'm on the right track?" },
  { label: "Explain this topic", text: "Could you explain this topic in a bit more detail? I want to make sure I really understand it." },
  { label: "Check my project", text: "Could you take a look at my project and share some feedback?" },
  { label: "Build a study plan", text: "Could you help me build a study plan for the next few weeks?" },
  { label: "Give me next steps", text: "What should my next steps be to keep making progress on my path?" },
  { label: "Prepare for interview", text: "Can you help me prepare for an upcoming interview?" },
];
