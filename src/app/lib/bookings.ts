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

export const BOOKINGS_CHANGED_EVENT = "starfix_bookings_changed";

const STORAGE_KEY = "starfix_bookings";

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
