import { supabase } from "./supabase";
import { insertBookingToDb, cancelBookingInDb, fetchBookingsFromDb } from "./supabaseDb";

export interface Booking {
  id: string;
  mentorId: number;
  mentorName: string;
  mentorTitle?: string;
  mentorCompany?: string;
  mentorColor: string;
  mentorInitials: string;
  sessionType: string;
  duration: string;
  price: string;
  bookingDate: string;
  bookingTime: string;
  status: "Booked" | "Completed" | "Cancelled";
  createdAt: string;
  notes?: string;
}

export const BOOKINGS_CHANGED_EVENT = "starfix_bookings_changed";
const STORAGE_KEY = "starfix_bookings";

function readLocal(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Booking[] : [];
  } catch { return []; }
}
export function getBookings(): Booking[] { return readLocal(); }

function writeLocal(bookings: Booking[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
  } catch { /* ignore */ }
}

function statusFromDb(status: string): Booking["status"] {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Booked";
}

function parseMoney(price: string): number {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseDurationMinutes(duration: string): number {
  const n = Number(String(duration).match(/\d+/)?.[0] || 60);
  return Number.isFinite(n) ? n : 60;
}
function buildScheduledStart(dateLabel: string, timeLabel: string): Date | null {
  const now = new Date();
  let base = new Date(now);
  const lower = String(dateLabel).toLowerCase();
  if (lower.includes("tomorrow")) base.setDate(base.getDate() + 1);
  else if (!lower.includes("today")) {
    const parsed = new Date(dateLabel);
    if (!Number.isNaN(parsed.getTime())) base = parsed;
  }
  const match = String(timeLabel).match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) { base.setHours(18, 0, 0, 0); return base; }
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const ampm = (match[3] || "").toLowerCase();
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  base.setHours(hour, minute, 0, 0);
  return base;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
async function persistBooking(booking: Booking): Promise<void> {
  const studentId = await currentUserId();
  if (!studentId) return;
  const { data: mentor } = await supabase.from("mentors").select("id").eq("legacy_id", booking.mentorId).maybeSingle();
  if (!mentor?.id) return;
  const { data: sessionType } = await supabase.from("session_types").select("id").eq("mentor_id", mentor.id).eq("title", booking.sessionType).maybeSingle();
  const start = buildScheduledStart(booking.bookingDate, booking.bookingTime);
  const end = start ? new Date(start.getTime() + parseDurationMinutes(booking.duration) * 60000) : null;
  const { data, error } = await supabase.rpc("create_student_booking", {
    p_mentor_id: mentor.id,
    p_session_type_id: sessionType?.id ?? null,
    p_availability_id: null,
    p_scheduled_start: start?.toISOString() ?? null,
    p_scheduled_end: end?.toISOString() ?? null,
    p_amount: parseMoney(booking.price), p_currency: "INR", p_external_id: booking.id,
    p_mentor_num: booking.mentorId, p_mentor_name: booking.mentorName,
    p_mentor_title: booking.mentorTitle ?? null, p_mentor_company: booking.mentorCompany ?? null,
    p_mentor_color: booking.mentorColor, p_mentor_initials: booking.mentorInitials,
    p_session_type: booking.sessionType, p_duration: booking.duration, p_price: booking.price,
    p_booking_date: booking.bookingDate, p_booking_time: booking.bookingTime,
  });
  if (error) { console.warn("Starfix booking sync:", error.message); return; }
  if (data?.id) {
    const all = readLocal();
    const i = all.findIndex((b) => b.id === booking.id);
    if (i !== -1) { all[i] = { ...all[i], id: String(data.id), status: statusFromDb(data.status), createdAt: data.created_at || all[i].createdAt }; writeLocal(all); }
  }
}
export async function hydrateBookings(userId?: string): Promise<void> {
  const uid = userId || await currentUserId();
  if (!uid) return;
  const { data, error } = await supabase.from("bookings")
    .select("id,external_id,mentor_num,mentor_name,mentor_title,mentor_company,mentor_color,mentor_initials,session_type,duration,price,booking_date,booking_time,status,created_at,notes")
    .eq("student_id", uid).order("created_at", { ascending: false });
  if (error || !data) return;
  const remote = data.map((b: any): Booking => ({
    id: String(b.external_id || b.id), mentorId: Number(b.mentor_num || 0), mentorName: b.mentor_name || "Starfix Mentor",
    mentorTitle: b.mentor_title || undefined, mentorCompany: b.mentor_company || undefined,
    mentorColor: b.mentor_color || "#D4AF37", mentorInitials: b.mentor_initials || "SM",
    sessionType: b.session_type || "Mentorship Session", duration: b.duration || "60 min", price: b.price || "Free",
    bookingDate: b.booking_date || (b.scheduled_start ? new Date(b.scheduled_start).toLocaleDateString() : "Scheduled"),
    bookingTime: b.booking_time || (b.scheduled_start ? new Date(b.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""),
    status: statusFromDb(b.status), createdAt: b.created_at || new Date().toISOString(), notes: b.notes || undefined,
  }));
  const remoteIds = new Set(remote.map((b) => b.id));
  writeLocal([...remote, ...readLocal().filter((b) => !remoteIds.has(b.id))]);
}

export function getUpcomingBookings(): Booking[] { return readLocal().filter((b) => b.status === "Booked"); }
export function getBookingHistory(): Booking[] { return readLocal().filter((b) => b.status === "Completed" || b.status === "Cancelled"); }

export function createBooking(data: Omit<Booking, "id" | "createdAt" | "status">): Booking {
  const booking: Booking = { ...data, id: `booking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: "Booked", createdAt: new Date().toISOString() };
  writeLocal([booking, ...readLocal()]);
  void persistBooking(booking);
  return booking;
}
export function cancelBooking(bookingId: string): boolean {
  const bookings = readLocal(); const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return false;
  bookings[index] = { ...bookings[index], status: "Cancelled" }; writeLocal(bookings);
  void (async () => { const uid = await currentUserId(); if (!uid) return; await supabase.from("bookings").update({ status: "cancelled" }).eq("student_id", uid).or(`id.eq.${bookingId},external_id.eq.${bookingId}`); })();
  return true;
}

export function isSessionBooked(mentorId: number, sessionType: string): boolean {
  return readLocal().some((b) => b.status === "Booked" && b.mentorId === mentorId && b.sessionType === sessionType);
}

export function updateBookingNotes(bookingId: string, notes: string) {
  const bookings = readLocal(); const index = bookings.findIndex((b) => b.id === bookingId);
  if (index !== -1) { bookings[index].notes = notes; writeLocal(bookings); }
  void (async () => { const uid = await currentUserId(); if (!uid) return; await supabase.from("bookings").update({ notes }).eq("student_id", uid).or(`id.eq.${bookingId},external_id.eq.${bookingId}`); })();
}

export function clearBookings(): void {
  writeLocal([]);
}
