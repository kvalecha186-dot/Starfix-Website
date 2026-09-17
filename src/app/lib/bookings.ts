/* ─── Real Scheduled Session Booking Store for Starfix ─────────────────────── */

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

import { supabase } from "./supabase";
import { insertBookingToDb, cancelBookingInDb, fetchBookingsFromDb } from "./supabaseDb";

export const BOOKINGS_CHANGED_EVENT = "starfix_bookings_changed";

const STORAGE_KEY = "starfix_bookings";

/* Sync bookings from Supabase into local cache if logged in */
export async function syncBookingsFromDb(): Promise<Booking[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return getBookings();

    const remoteBookings = await fetchBookingsFromDb(session.user.id);
    if (remoteBookings && remoteBookings.length > 0) {
      saveBookings(remoteBookings);
      return remoteBookings;
    }
  } catch (err) {
    console.warn("Could not sync bookings from Supabase:", err);
  }
  return getBookings();
}

/* Read all bookings from storage */
export function getBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Booking[];
  } catch (err) {
    console.error("Failed to read bookings from localStorage", err);
    return [];
  }
}

/* Save bookings to storage & dispatch change event */
export function saveBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
  } catch (err) {
    console.error("Failed to save bookings", err);
  }
}

/* Get upcoming booked sessions */
export function getUpcomingBookings(): Booking[] {
  return getBookings().filter((b) => b.status === "Booked");
}

/* Get session history (completed or cancelled) */
export function getBookingHistory(): Booking[] {
  return getBookings().filter((b) => b.status === "Completed" || b.status === "Cancelled");
}

/* Create a new booking */
export function createBooking(data: Omit<Booking, "id" | "createdAt" | "status">): Booking {
  const newBooking: Booking = {
    ...data,
    id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    status: "Booked",
    createdAt: new Date().toISOString(),
  };

  const bookings = getBookings();
  const updated = [newBooking, ...bookings];
  saveBookings(updated);

  // Asynchronously persist to Supabase if logged in
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      insertBookingToDb(session.user.id, newBooking).catch((err) =>
        console.warn("Async Supabase booking insert failed:", err)
      );
    }
  });

  return newBooking;
}

/* Cancel an upcoming booking */
export function cancelBooking(bookingId: string): boolean {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return false;

  bookings[index] = {
    ...bookings[index],
    status: "Cancelled",
  };

  saveBookings(bookings);

  // Asynchronously update in Supabase
  cancelBookingInDb(bookingId).catch((err) =>
    console.warn("Async Supabase booking cancellation failed:", err)
  );

  return true;
}

/* Check if a specific mentor & session combination is currently booked */
export function isSessionBooked(mentorId: number, sessionType: string): boolean {
  return getUpcomingBookings().some(
    (b) => b.mentorId === mentorId && b.sessionType === sessionType
  );
}

/* Update notes on a booking */
export function updateBookingNotes(bookingId: string, notes: string) {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index !== -1) {
    bookings[index].notes = notes;
    saveBookings(bookings);
  }
}
