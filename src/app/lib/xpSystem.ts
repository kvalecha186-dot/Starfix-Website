/* ─────────────────────────────────────────────────────────────────────────
   Global XP wallet — a two-stage reward system, like a premium learning
   wallet where XP is first earned, then verified and settled.

     - totalXp   — permanent, lifetime balance. Only ever increases via a
                   settlement or a one-off irreversible award (session
                   attendance, milestone video, weekly challenge, path
                   completion — see addXp()).
     - pending[] — today's task XP, each entry timestamped the moment it
                   was earned. Sits here for SETTLE_MS (6 hours), then
                   automatically transfers into totalXp on its own —
                   settlement is per-entry, not tied to the calendar day.
     - todayXp   — always DERIVED as the sum of pending[] amounts, never
                   stored directly, so it can't drift out of sync with
                   what's actually still pending.

   Task completion routes through addTaskXp()/undoTaskXp(), keyed by a
   stable per-task id, so unchecking a task removes exactly that task's
   pending entry — or, if it already settled, reverses it out of totalXp
   instead (see undoTaskXp for the exact rule).

   Everything else (session join, milestone videos, weekly challenges,
   path completion, focus sessions) is a one-off, irreversible award and
   still goes straight into totalXp via addXp() — unaffected by the
   pending/settlement cycle, exactly as before.
───────────────────────────────────────────────────────────────────────── */

import { supabase } from "./supabase";
import { recordXpInDb, fetchUserXpFromDb } from "./supabaseDb";

const KEY = "starfix:xp";
export const XP_CHANGED_EVENT = "starfix:xp-changed";
export const XP_FLY_EVENT = "starfix:xp-fly";     // floating "+XP" badge
export const XP_GLOW_EVENT = "starfix:xp-glow";   // pulses the gold icon (earn)
export const XP_SETTLE_EVENT = "starfix:xp-settle"; // pending → total transfer

export const SETTLE_MS = 6 * 60 * 60 * 1000; // 6 hours

interface PendingEntry {
  key: string;      // stable per-task id, e.g. "mission:coding:2026-08-11:2"
  amount: number;
  addedAt: number;  // epoch ms
  label?: string;    // human-readable task text, for the Pending/History UI
}

interface LogEntry {
  id: string;
  label: string;
  amount: number;
  at: number; // epoch ms
}

interface StoredXpState {
  totalXp: number;
  pending: PendingEntry[];
  settledByKey: Record<string, number>; // lets undo reverse an already-settled task
  consistencyStreak: number;
  lastConsistencyDate: string;
  log: LogEntry[]; // reverse-chronological XP history — capped, see pushLog()
}

export interface XpState {
  totalXp: number;
  todayXp: number;      // derived — sum of still-pending amounts
  pendingCount: number;
  consistencyStreak: number;
}

function defaultState(): StoredXpState {
  return { totalXp: 0, pending: [], settledByKey: {}, consistencyStreak: 0, lastConsistencyDate: "", log: [] };
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return then.getFullYear() === yesterday.getFullYear() && then.getMonth() === yesterday.getMonth() && then.getDate() === yesterday.getDate();
}

function touchConsistency(state: StoredXpState, earnedPositive: boolean) {
  if (!earnedPositive) return;
  const today = todayStr();
  if (state.lastConsistencyDate !== today) {
    const isConsecutive = isYesterday(state.lastConsistencyDate);
    state.consistencyStreak = isConsecutive ? state.consistencyStreak + 1 : 1;
    state.lastConsistencyDate = today;
  }
}

const MAX_LOG = 200;
let logSeq = 0;

/* Appends a human-readable history entry. Every real XP event — task
   completion, task undo, milestone/session/challenge/review awards —
   routes through here, so the History section always reflects exactly
   what actually happened, never fabricated placeholder text. */
function pushLog(state: StoredXpState, label: string, amount: number) {
  if (amount === 0) return;
  state.log = state.log ?? [];
  state.log.unshift({ id: `${Date.now()}-${++logSeq}`, label, amount, at: Date.now() });
  if (state.log.length > MAX_LOG) state.log.length = MAX_LOG;
}

/* Moves any pending entry older than SETTLE_MS into totalXp. Mutates
   `state` in place and returns the amount settled (0 if none) — called
   from every read() so app load always recalculates pending XP from
   real timestamps before anything renders. */
function settle(state: StoredXpState): number {
  const now = Date.now();
  const stillPending: PendingEntry[] = [];
  let settledSum = 0;
  for (const p of state.pending) {
    if (now - p.addedAt >= SETTLE_MS) {
      state.totalXp += p.amount;
      state.settledByKey[p.key] = p.amount;
      settledSum += p.amount;
    } else {
      stillPending.push(p);
    }
  }
  state.pending = stillPending;
  return settledSum;
}

function read(): StoredXpState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as any;

    let state: StoredXpState;
    if (parsed.totalXp === undefined && (parsed.baseTotalXp !== undefined || parsed.todayMissionXp !== undefined)) {
      // Migrate the older baseTotalXp/todayMissionXp shape — historical
      // XP rolls straight into the new permanent totalXp, since there's
      // no per-task timestamp to reconstruct into pending entries.
      state = {
        totalXp: Math.max(0, (parsed.baseTotalXp ?? 0) + (parsed.todayMissionXp ?? 0)),
        pending: [],
        settledByKey: {},
        consistencyStreak: parsed.consistencyStreak ?? 0,
        lastConsistencyDate: parsed.lastConsistencyDate ?? "",
        log: [],
      };
    } else {
      state = {
        totalXp: parsed.totalXp ?? 0,
        pending: Array.isArray(parsed.pending) ? parsed.pending : [],
        settledByKey: parsed.settledByKey ?? {},
        consistencyStreak: parsed.consistencyStreak ?? 0,
        lastConsistencyDate: parsed.lastConsistencyDate ?? "",
        log: Array.isArray(parsed.log) ? parsed.log : [],
      };
    }
    settle(state); // quiet — persisted by the caller, no event dispatch here
    return state;
  } catch {
    return defaultState();
  }
}

function persist(state: StoredXpState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function write(state: StoredXpState) {
  persist(state);
  window.dispatchEvent(new CustomEvent(XP_CHANGED_EVENT));
}

export function getXpState(): XpState {
  const s = read();
  persist(s); // save any settlement that just happened on this read
  const todayXp = s.pending.reduce((sum, p) => sum + p.amount, 0);
  return { totalXp: s.totalXp, todayXp, pendingCount: s.pending.length, consistencyStreak: s.consistencyStreak };
}

/* ── Ranks — learning-focused, not combat-game flavored. This is the one
   place rank names/ranges/descriptions live; the Dashboard XP corner and
   the dedicated XP Points page both read getRank()/RANKS, so they can
   never drift out of sync with each other. ── */
export const RANKS = [
  { name: "Explorer",     min: 0,     description: "Just getting started — your first steps count." },
  { name: "Learner",      min: 500,   description: "Building a real, consistent habit." },
  { name: "Builder",      min: 1500,  description: "Shipping real work, not just watching." },
  { name: "Practitioner", min: 3500,  description: "Depth is showing — you apply what you learn." },
  { name: "Achiever",     min: 7000,  description: "Milestones completed, momentum compounding." },
  { name: "Expert",       min: 12000, description: "Deep, sustained mastery across your path." },
  { name: "Rising Star",  min: 20000, description: "Long-term growth, recognized." },
] as const;

export interface RankInfo {
  name: string;
  min: number;
  next: { name: string; min: number } | null;
  progressPct: number; // progress toward next rank, 100 if maxed
}

/* Progress toward next rank is computed on totalXp only — pending
   (unsettled) task XP doesn't count toward rank yet. */
export function getRank(totalXp: number): RankInfo {
  let current = RANKS[0];
  let next: (typeof RANKS)[number] | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXp >= RANKS[i].min) current = RANKS[i];
    next = totalXp < RANKS[i].min ? RANKS[i] : null;
    if (totalXp < RANKS[i].min) { next = RANKS[i]; break; }
  }
  if (totalXp >= RANKS[RANKS.length - 1].min) next = null;
  const progressPct = next
    ? Math.round(((totalXp - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { name: current.name, min: current.min, next, progressPct: Math.max(0, Math.min(100, progressPct)) };
}

/* ── XP source amounts — the reference table every call site should use ── */
export const XP_SOURCES = {
  milestoneVideo: 15,
  actionTask: 20,
  miniProject: 40,
  mentorQuestion: 10,
  projectReview: 50,
  dailyConsistency: 5,
  weeklyChallenge: 150,
  focusSession: 25,
} as const;

/* ── One-off / irreversible awards (session join, milestone video, path
   completion, weekly challenge, focus sessions, etc.) — these go straight
   into the permanent totalXp, bypassing the pending/settlement cycle
   entirely. Can be given a negative amount for the rare symmetric "undo"
   case, which still nets out correctly since it's just addition. ── */
export function addXp(amount: number, reason?: string) {
  const s = read();
  s.totalXp = Math.max(0, s.totalXp + amount);
  touchConsistency(s, amount > 0);
  pushLog(s, reason ?? (amount >= 0 ? "XP awarded" : "XP adjusted"), amount);
  write(s);

  if (amount > 0) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        recordXpInDb(session.user.id, amount, reason ?? "XP awarded", "award").catch((err) =>
          console.warn("Async Supabase XP record failed:", err)
        );
      }
    });
  }
}

/* ── Task completion (Today's Mission / workspace action tasks) ─────────
   Adds XP to todayXp (pending) immediately — NOT to totalXp. `key` must
   be a stable identifier for this exact task (e.g. `mission:coding:2026-
   08-11:2` or `pathtask:coding:t3`) so undoTaskXp can find it again by
   the same key, whether it's still pending or has already settled.
   `label` is the human-readable task text, shown in Pending XP + History. ── */
export function addTaskXp(key: string, amount: number, label?: string) {
  const s = read();
  s.pending = s.pending.filter((p) => p.key !== key); // replace any stale entry for this key
  delete s.settledByKey[key];
  s.pending.push({ key, amount, addedAt: Date.now(), label });
  touchConsistency(s, amount > 0);
  pushLog(s, label ?? "Task completed", amount);
  write(s);

  if (amount > 0) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        recordXpInDb(session.user.id, amount, label ?? "Task completed", "task", key).catch((err) =>
          console.warn("Async Supabase task XP record failed:", err)
        );
      }
    });
  }
}

/* Unchecking a task. If its XP is still pending, the entry is simply
   removed — todayXp drops immediately, totalXp untouched. If it already
   settled into totalXp (more than 6 hours passed), the undo reverses it
   out of totalXp instead, so unchecking a task always fully undoes it,
   no matter how long ago it was completed. */
export function undoTaskXp(key: string) {
  const s = read();
  const idx = s.pending.findIndex((p) => p.key === key);
  if (idx >= 0) {
    pushLog(s, `Undid: ${s.pending[idx].label ?? "task"}`, -Math.abs(s.pending[idx].amount));
    s.pending.splice(idx, 1);
  } else if (s.settledByKey[key] !== undefined) {
    pushLog(s, "Undid a completed task", -Math.abs(s.settledByKey[key]));
    s.totalXp = Math.max(0, s.totalXp - s.settledByKey[key]);
    delete s.settledByKey[key];
  }
  write(s);
}

/* ── Read-only accessors for the XP Points page ──────────────────────── */

/** Still-pending items for today, most-recent first — powers the
    "Pending XP (today)" timeline. */
export function getPendingEntries(): { key: string; amount: number; addedAt: number; label: string }[] {
  const s = read();
  persist(s); // save any settlement that just happened on this read
  return [...s.pending]
    .sort((a, b) => b.addedAt - a.addedAt)
    .map((p) => ({ key: p.key, amount: p.amount, addedAt: p.addedAt, label: p.label ?? "Task" }));
}

/** Epoch ms when the oldest still-pending entry will settle into totalXp,
    or null if nothing is pending — powers the "Transfers to total in…"
    countdown. */
export function getNextSettleAt(): number | null {
  const s = read();
  persist(s);
  if (s.pending.length === 0) return null;
  return Math.min(...s.pending.map((p) => p.addedAt)) + SETTLE_MS;
}

/** Full XP history, most-recent first, capped at 200 entries — powers
    the "XP History" activity feed. Every entry here is a real event
    (task completion/undo, milestone, session, challenge, review, path
    completion) — nothing is fabricated for display. */
export function getXpLog(): { id: string; label: string; amount: number; at: number }[] {
  const s = read();
  persist(s);
  return s.log ?? [];
}

/* ── Visual-only fly animation + glow trigger (see XpCorner.tsx) ─────
   amount may be negative (undo) — the fly badge renders "-20 XP" in a
   muted tone with no celebratory glow; only positive amounts pulse the
   corner card's icon and glow it gold. */
export function flyXp(amount: number, x: number, y: number) {
  if (amount === 0) return;
  window.dispatchEvent(new CustomEvent(XP_FLY_EVENT, { detail: { amount, x, y } }));
  if (amount > 0) window.dispatchEvent(new CustomEvent(XP_GLOW_EVENT));
}

/** One call for the common one-off case: add XP to totalXp AND show
    the fly + (if positive) glow animation. */
export function celebrateXp(amount: number, reason: string, originEvent?: { clientX: number; clientY: number }) {
  addXp(amount, reason);
  const x = originEvent?.clientX ?? window.innerWidth - 160;
  const y = originEvent?.clientY ?? window.innerHeight / 2;
  flyXp(amount, x, y);
}

/** Task completion: adds to todayXp (pending) + shows the fly-and-pulse
    animation. Use for Today's Mission tasks and per-path workspace tasks.
    `label` is the human-readable task text (e.g. "Practice Python
    fundamentals") — shown verbatim in Pending XP and History. */
export function celebrateTaskXp(key: string, amount: number, originEvent?: { clientX: number; clientY: number }, label?: string) {
  addTaskXp(key, amount, label);
  const x = originEvent?.clientX ?? window.innerWidth - 160;
  const y = originEvent?.clientY ?? window.innerHeight / 2;
  flyXp(amount, x, y);
}

/** Undoing a task: reverses todayXp (or totalXp, if already settled) +
    shows a muted "-XP" fly badge, no glow. */
export function uncelebrateTaskXp(key: string, amount: number, originEvent?: { clientX: number; clientY: number }) {
  undoTaskXp(key);
  const x = originEvent?.clientX ?? window.innerWidth - 160;
  const y = originEvent?.clientY ?? window.innerHeight / 2;
  flyXp(-Math.abs(amount), x, y);
}

export async function hydrateXp(userId?: string): Promise<number> {
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id;
    }
    if (!uid) return getXpState().totalXp;

    const res = await fetchUserXpFromDb(uid);
    if (res && typeof res.totalXp === "number") {
      const s = read();
      s.totalXp = Math.max(s.totalXp, res.totalXp);
      if (res.log && res.log.length > 0) {
        const existingIds = new Set((s.log || []).map((l) => l.id));
        const newEntries = res.log.filter((l) => !existingIds.has(l.id));
        s.log = [...newEntries, ...(s.log || [])].slice(0, MAX_LOG);
      }
      write(s);
      return s.totalXp;
    }
  } catch (err) {
    console.warn("Could not hydrate XP from Supabase:", err);
  }
  return getXpState().totalXp;
}

export function clearXp(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(XP_CHANGED_EVENT));
}
