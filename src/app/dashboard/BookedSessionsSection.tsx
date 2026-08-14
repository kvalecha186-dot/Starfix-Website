import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Clock, Star, ArrowRight, X,
  AlertCircle, Video, MessageSquare, Tag, FileText, CheckCircle2, XCircle, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { C } from "./dashColors";
import { useViewport } from "../lib/useViewport";
import type { DashPage } from "./DashboardLayout";
import {
  getBookings, getUpcomingBookings, getBookingHistory, cancelBooking,
  BOOKINGS_CHANGED_EVENT, type Booking
} from "../lib/bookings";

function LABEL(extra?: React.CSSProperties): React.CSSProperties {
  return {
    fontSize: "0.68rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: C.textFaint,
    fontFamily: "'Inter', sans-serif",
    ...extra,
  };
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 10px 28px rgba(212,165,20,0.10)" }}
      style={{
        background: C.surface,
        border: "1px solid rgba(212,165,20,0.10)",
        boxShadow: "0 4px 16px rgba(212,165,20,0.05)",
        borderRadius: 20,
        transition: "box-shadow 200ms ease, transform 200ms ease",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

function Avatar({ initials, color, size = 48 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(155deg, ${color}26, ${color}0c)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: size * 0.36, fontWeight: 700, color }}>
        {initials}
      </span>
    </div>
  );
}

/* ─── Session Details Modal ─────────────────────────────────────────── */
export function BookingDetailsModal({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  if (!booking) return null;

  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancelSession = () => {
    const ok = cancelBooking(booking.id);
    if (ok) {
      toast.success("Session cancelled", {
        description: `Your ${booking.sessionType} with ${booking.mentorName} has been cancelled.`,
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(5, 5, 16, 0.65)",
          backdropFilter: "blur(4px)",
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: C.surface,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 24,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
            width: "100%",
            maxWidth: 520,
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: `1px solid ${C.border}`,
              background: C.surfaceAlt,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Calendar size={18} color={C.gold} />
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: C.text }}>
                Session Details
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: C.textMuted,
                cursor: "pointer",
                padding: 4,
                display: "flex",
                borderRadius: 8,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Mentor info */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar initials={booking.mentorInitials} color={booking.mentorColor} size={54} />
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text }}>{booking.mentorName}</div>
                <div style={{ fontSize: "0.8rem", color: C.textMuted }}>
                  {booking.mentorTitle ? `${booking.mentorTitle} · ${booking.mentorCompany}` : "Starfix Mentor"}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div>
                <div style={LABEL({ marginBottom: 3 })}>Session Type</div>
                <div style={{ fontSize: "0.86rem", fontWeight: 600, color: C.text }}>{booking.sessionType}</div>
              </div>
              <div>
                <div style={LABEL({ marginBottom: 3 })}>Status</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: booking.status === "Booked" ? C.goldLight : booking.status === "Cancelled" ? "#FFF5F5" : "#EAF7EF",
                      color: booking.status === "Booked" ? C.gold : booking.status === "Cancelled" ? "#E53E3E" : "#1E8449",
                      border: `1px solid ${booking.status === "Booked" ? C.goldBorder : booking.status === "Cancelled" ? "#FEB2B2" : "#A3E635"}`,
                    }}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
              <div>
                <div style={LABEL({ marginBottom: 3 })}>Date & Time</div>
                <div style={{ fontSize: "0.84rem", color: C.text }}>
                  {booking.bookingDate} · {booking.bookingTime}
                </div>
              </div>
              <div>
                <div style={LABEL({ marginBottom: 3 })}>Duration & Price</div>
                <div style={{ fontSize: "0.84rem", color: C.text }}>
                  {booking.duration} · {booking.price}
                </div>
              </div>
            </div>

            {/* Actions */}
            {booking.status === "Booked" && (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                {!confirmCancel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      color: "#E53E3E",
                      border: "1px solid #FEB2B2",
                      borderRadius: 12,
                      padding: "10px 0",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "background 150ms ease",
                    }}
                  >
                    Cancel Booking
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: C.textMuted }}>
                      Are you sure you want to cancel this booking?
                    </span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleCancelSession}
                        style={{
                          flex: 1,
                          background: "#E53E3E",
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          padding: "9px 0",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Yes, Cancel Session
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        style={{
                          flex: 1,
                          background: C.surfaceAlt,
                          color: C.text,
                          border: `1px solid ${C.border}`,
                          borderRadius: 10,
                          padding: "9px 0",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Keep Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── Dashboard Upcoming Sessions Section ───────────────────────────── */
export function UpcomingSessionsSection({ onNavigate }: { onNavigate?: (p: DashPage) => void }) {
  const [upcoming, setUpcoming] = useState<Booking[]>(getUpcomingBookings());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { isDesktop } = useViewport();

  useEffect(() => {
    const handleUpdate = () => setUpcoming(getUpcomingBookings());
    window.addEventListener(BOOKINGS_CHANGED_EVENT, handleUpdate);
    return () => window.removeEventListener(BOOKINGS_CHANGED_EVENT, handleUpdate);
  }, []);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: C.text,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Upcoming Sessions
        </h2>
        {upcoming.length > 0 && (
          <span style={{ fontSize: "0.76rem", fontWeight: 600, color: C.gold, background: C.goldLight, border: `1px solid ${C.goldBorder}`, padding: "3px 10px", borderRadius: 20 }}>
            {upcoming.length} {upcoming.length === 1 ? "session" : "sessions"} scheduled
          </span>
        )}
      </div>

      {upcoming.length === 0 ? (
        /* Empty State */
        <SectionCard style={{ padding: "32px 28px", textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: C.goldLight,
              border: `1px solid ${C.goldBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Calendar size={22} color={C.gold} />
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
            No upcoming sessions
          </h3>
          <p style={{ fontSize: "0.84rem", color: C.textMuted, margin: "0 0 18px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
            Book a mentor session to get personalized guidance.
          </p>
          <button
            onClick={() => onNavigate?.("mentors")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: C.gold,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Book a Mentor <ArrowRight size={14} />
          </button>
        </SectionCard>
      ) : (
        /* Grid of Booked Sessions */
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(320px, 1fr))" : "1fr", gap: 16 }}>
          {upcoming.map((b) => (
            <motion.div
              key={b.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedBooking(b)}
              style={{
                background: C.surface,
                border: `1px solid ${C.goldBorder}`,
                boxShadow: "0 8px 24px rgba(212,169,31,0.08)",
                borderRadius: 20,
                padding: "20px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={b.mentorInitials} color={b.mentorColor} size={46} />
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text }}>{b.mentorName}</div>
                    <div style={{ fontSize: "0.76rem", color: C.textMuted }}>{b.sessionType}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: C.gold,
                    background: C.goldLight,
                    border: `1px solid ${C.goldBorder}`,
                    padding: "3px 9px",
                    borderRadius: 20,
                  }}
                >
                  {b.status}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.78rem", color: C.textMuted, background: C.surfaceAlt, padding: "10px 14px", borderRadius: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} color={C.gold} /> {b.bookingDate} · {b.bookingTime}
                </span>
                <span>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={13} /> {b.duration}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", paddingTop: 8, paddingBottom: 2 }}>
                <motion.div
                  whileHover={{ y: -1, boxShadow: "0 6px 20px rgba(230, 194, 106, 0.32)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "#FFFFFF",
                    border: "1px solid #E6C26A",
                    borderRadius: 999,
                    padding: "9px 26px",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "#C89B2B",
                    fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                    boxShadow: "0 2px 12px rgba(230, 194, 106, 0.18), 0 0 0 1px rgba(230, 194, 106, 0.08)",
                    cursor: "pointer",
                    transition: "all 180ms ease",
                    letterSpacing: "0.01em",
                  }}
                >
                  <span>View Details</span>
                  <span style={{ fontSize: "0.88rem", transition: "transform 180ms ease" }}>→</span>
                  <Sparkles
                    size={11}
                    color="#E6C26A"
                    style={{
                      position: "absolute",
                      top: -4,
                      right: 12,
                      filter: "drop-shadow(0 0 4px rgba(230, 194, 106, 0.6))",
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}

/* ─── Dashboard Session History Section ─────────────────────────────── */
export function SessionHistorySection() {
  const [history, setHistory] = useState<Booking[]>(getBookingHistory());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const handleUpdate = () => setHistory(getBookingHistory());
    window.addEventListener(BOOKINGS_CHANGED_EVENT, handleUpdate);
    return () => window.removeEventListener(BOOKINGS_CHANGED_EVENT, handleUpdate);
  }, []);

  if (history.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.3rem",
          fontWeight: 700,
          color: C.text,
          margin: "0 0 14px",
          letterSpacing: "-0.01em",
        }}
      >
        Session History
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {history.map((b) => (
          <div
            key={b.id}
            onClick={() => setSelectedBooking(b)}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "border 150ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar initials={b.mentorInitials} color={b.mentorColor} size={40} />
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: C.text }}>{b.mentorName}</div>
                <div style={{ fontSize: "0.76rem", color: C.textMuted }}>
                  {b.sessionType} · {b.bookingDate} at {b.bookingTime}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: b.status === "Cancelled" ? "#FFF5F5" : "#EAF7EF",
                  color: b.status === "Cancelled" ? "#E53E3E" : "#1E8449",
                  border: `1px solid ${b.status === "Cancelled" ? "#FEB2B2" : "#A3E635"}`,
                }}
              >
                {b.status}
              </span>
              <span style={{ fontSize: "0.76rem", color: C.textFaint }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
