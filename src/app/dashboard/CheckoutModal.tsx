import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  X, Check, ShieldCheck, CreditCard, QrCode, Building2,
  Calendar, Clock, Sparkles, Lock, ArrowRight, CheckCircle2,
  CalendarPlus, MessageSquare
} from "lucide-react";
import { C } from "./dashColors";
import type { Mentor } from "./pages/MentorsPage";
import type { SessionType } from "./mentorExtra";
import { createBookingAndPersist, type Booking } from "../lib/bookings";
import { supabase } from "../lib/supabase";
import { addXp } from "../lib/xpSystem";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  session: SessionType;
  availability: { date: string; slots: string[] }[];
  onSuccessBooking?: (booking: Booking) => void;
  onMessageMentor?: (mentorId: number) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  mentor,
  session,
  availability,
  onSuccessBooking,
  onMessageMentor,
}: CheckoutModalProps) {
  const defaultDate = availability[0]?.date || "Tomorrow";
  const defaultSlots = availability[0]?.slots || ["6:00 PM", "7:30 PM", "9:00 PM"];

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState(defaultSlots[0] || "6:00 PM");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const first = availability[0];
    if (!first) return;
    setSelectedDate(first.date);
    setSelectedSlot(first.slots[0] || "6:00 PM");
  }, [availability]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

  // Parse numerical price
  const isFree = session.price === "Free" || session.price === "₹0" || session.price === "0";
  const basePriceNum = isFree ? 0 : Number(session.price.replace(/[^0-9]/g, "")) || 0;
  const discountAmount = Math.round((basePriceNum * discountPercent) / 100);
  const finalPriceNum = Math.max(0, basePriceNum - discountAmount);
  const finalPriceStr = isFree || finalPriceNum === 0 ? "Free" : `₹${finalPriceNum.toLocaleString("en-IN")}`;

  // Current available slots for selected date
  const currentAvail = availability.find((a) => a.date === selectedDate);
  const currentSlots = currentAvail?.slots?.length ? currentAvail.slots : [];

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "STARFIX100" || code === "FREE" || code === "VIP") {
      setDiscountPercent(100);
      setPromoApplied(true);
      toast.success("100% Starfix VIP pass applied!");
    } else if (code === "STARFIX50" || code === "HALFOFF") {
      setDiscountPercent(50);
      setPromoApplied(true);
      toast.success("50% Starfix scholarship applied!");
    } else if (code === "FIRSTSESSION" || code === "WELCOME") {
      setDiscountPercent(30);
      setPromoApplied(true);
      toast.success("30% Welcome discount applied!");
    } else {
      toast.error("Invalid code. Try STARFIX50 or VIP");
    }
  };

  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    setProcessingStep("Creating a secure booking...");
    try {
      const booking = pendingBooking ?? await createBookingAndPersist({
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorTitle: mentor.title,
        mentorCompany: mentor.company,
        mentorColor: mentor.color,
        mentorInitials: mentor.initials,
        sessionType: session.name,
        duration: session.duration,
        price: finalPriceStr,
        bookingDate: selectedDate,
        bookingTime: selectedSlot,
        notes: notes.trim() || undefined,
      });
      if (!pendingBooking) setPendingBooking(booking);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Please sign in again before checkout.");

      const callPayment = async (action: string, body: Record<string, unknown>) => {
        const res = await fetch(`${supabase.supabaseUrl}/functions/v1/razorpay-payments?action=${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabase.supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.error || "Secure checkout could not be started.");
        return result;
      };

      if (isFree || finalPriceNum === 0) {
        setProcessingStep("Confirming your free session...");
        await callPayment("confirm-free-booking", { booking_id: booking.id });
      } else {
        setProcessingStep("Preparing secure Razorpay checkout...");
        const order = await callPayment("create-order", { booking_id: booking.id });
        if (!order.key_id || !order.order_id || !order.amount) {
          throw new Error("Payment provider returned an invalid order.");
        }

        await new Promise<void>((resolve, reject) => {
          const launch = () => {
            const RazorpayCtor = (window as any).Razorpay;
            if (!RazorpayCtor) return reject(new Error("Razorpay checkout could not load."));
            const checkout = new RazorpayCtor({
              key: order.key_id,
              amount: order.amount,
              currency: order.currency || "INR",
              name: "Starfix",
              description: `${session.name} with ${mentor.name}`,
              order_id: order.order_id,
              theme: { color: "#D4AF37" },
              handler: async (paymentResult: Record<string, string>) => {
                try {
                  setProcessingStep("Verifying payment securely...");
                  await callPayment("verify-payment", paymentResult);
                  resolve();
                } catch (error) { reject(error); }
              },
              modal: { ondismiss: () => reject(new Error("Checkout was closed. Your booking remains pending and you can try again.")) },
            });
            checkout.open();
          };
          if ((window as any).Razorpay) return launch();
          const existing = document.querySelector('script[data-starfix-razorpay="true"]') as HTMLScriptElement | null;
          if (existing) {
            existing.addEventListener("load", launch, { once: true });
            existing.addEventListener("error", () => reject(new Error("Razorpay checkout could not load.")), { once: true });
            return;
          }
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.dataset.starfixRazorpay = "true";
          script.onload = launch;
          script.onerror = () => reject(new Error("Razorpay checkout could not load."));
          document.body.appendChild(script);
        });
      }

      const confirmedBooking = { ...booking, status: "Booked" as const };
      addXp(50, `Booked ${session.name} with ${mentor.name}`);
      setIsProcessing(false);
      setCompletedBooking(confirmedBooking);
      setPendingBooking(null);
      onSuccessBooking?.(confirmedBooking);
      toast.success(isFree || finalPriceNum === 0 ? "Free mentorship session confirmed!" : "Payment verified and session confirmed!", {
        description: `${mentor.name} • ${selectedDate} at ${selectedSlot} (+50 XP)`,
      });
    } catch (error) {
      setIsProcessing(false);
      const message = error instanceof Error ? error.message : "Checkout failed. Please try again.";
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(5, 5, 16, 0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "min(680px, 98vw)",
          maxHeight: "92vh",
          background: "#08081A",
          border: "1px solid rgba(212, 175, 55, 0.35)",
          borderRadius: 24,
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(212, 175, 55, 0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            background: "linear-gradient(180deg, #101026 0%, #08081A 100%)",
            borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(212, 175, 55, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} color={C.gold} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                {completedBooking ? "Booking Confirmed" : "Book Mentorship Session"}
              </h3>
              <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.55)", fontSize: "0.74rem" }}>
                {completedBooking ? "Your calendar slot is locked" : "Starfix Concierge 1:1 Booking"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.6)",
              cursor: "pointer",
              padding: 6,
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
          {completedBooking ? (
            /* ════════ SUCCESS STATE ════════ */
            <div style={{ textAlign: "center", padding: "12px 10px 24px" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "2px solid #10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#10B981",
                }}
              >
                <CheckCircle2 size={38} />
              </motion.div>

              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: "#fff", margin: "0 0 8px" }}>
                You're Scheduled with {mentor.name}!
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.86rem", margin: "0 0 24px" }}>
                We've secured your session and sent a confirmation link to your dashboard.
              </p>

              {/* Booking Summary Box */}
              <div
                style={{
                  background: "#101026",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  textAlign: "left",
                  marginBottom: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>Session Type</span>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>{session.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>Date & Time</span>
                  <span style={{ color: C.gold, fontWeight: 700, fontSize: "0.85rem" }}>
                    {selectedDate} at {selectedSlot} ({session.duration})
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>Amount Paid</span>
                  <span style={{ color: "#10B981", fontWeight: 700, fontSize: "0.85rem" }}>{finalPriceStr}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>Reward</span>
                  <span style={{ color: C.gold, fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 5 }}>
                    <Sparkles size={13} /> +50 XP Earned
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Starfix Mentorship: ${mentor.name} (${session.name})`)}&details=${encodeURIComponent(`1:1 Mentorship call with ${mentor.name} on Starfix.`)}`;
                    window.open(url, "_blank");
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <CalendarPlus size={15} /> Add to Google Calendar
                </button>

                {onMessageMentor && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onMessageMentor(mentor.id);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      background: "rgba(212, 175, 55, 0.15)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      color: C.gold,
                      padding: "10px 18px",
                      borderRadius: 10,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <MessageSquare size={15} /> Message {mentor.name.split(" ")[0]}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: C.gold,
                    border: "none",
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: 10,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ════════ CHECKOUT FORM ════════ */
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Mentor & Session Summary Strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#101026",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: "14px 18px",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: `${mentor.color}25`,
                      border: `1.5px solid ${mentor.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: mentor.color,
                    }}
                  >
                    {mentor.initials}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>{mentor.name}</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.74rem" }}>
                      {mentor.title} · {mentor.company}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>{session.name}</div>
                  <div style={{ color: C.gold, fontSize: "0.85rem", fontWeight: 700 }}>
                    {finalPriceStr} <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.72rem", fontWeight: 400 }}>/ {session.duration}</span>
                  </div>
                </div>
              </div>

              {/* 1. Date & Time Selection */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: "0.82rem", fontWeight: 600, marginBottom: 8 }}>
                  <Calendar size={14} color={C.gold} /> Select Date
                </label>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                  {availability.map((a) => {
                    const isSelected = selectedDate === a.date;
                    return (
                      <button
                        key={a.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(a.date);
                          if (a.slots?.length) setSelectedSlot(a.slots[0]);
                        }}
                        style={{
                          background: isSelected ? "rgba(212, 175, 55, 0.2)" : "#101026",
                          border: `1px solid ${isSelected ? C.gold : "rgba(255, 255, 255, 0.1)"}`,
                          color: isSelected ? "#fff" : "rgba(255, 255, 255, 0.7)",
                          borderRadius: 10,
                          padding: "8px 14px",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.date}
                      </button>
                    );
                  })}
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: "0.82rem", fontWeight: 600, marginTop: 14, marginBottom: 8 }}>
                  <Clock size={14} color={C.gold} /> Select Time Slot
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {currentSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          background: isSelected ? C.gold : "#101026",
                          border: `1px solid ${isSelected ? C.gold : "rgba(255, 255, 255, 0.1)"}`,
                          color: isSelected ? "#050510" : "rgba(255, 255, 255, 0.8)",
                          borderRadius: 8,
                          padding: "7px 14px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Agenda / Note to Mentor */}
              <div>
                <label style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Agenda or Specific Questions for {mentor.name.split(" ")[0]} (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Code review on my microservices architecture, interview prep questions..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#101026",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "#fff",
                    fontSize: "0.8rem",
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>

              {/* Payment is handled by Razorpay Checkout; Starfix never collects card/UPI credentials. */}
              {!isFree && (
                <div style={{ background: "#101026", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 700, marginBottom: 6 }}>
                    <ShieldCheck size={16} color={C.gold} /> Secure payment by Razorpay
                  </div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", lineHeight: 1.6 }}>
                    UPI, cards and supported banking options are shown in the secure Razorpay checkout. Starfix does not store card numbers, CVV or UPI credentials. Final price is verified from the mentor's active session in the database.
                  </p>
                </div>
              )}
              {/* 4. Order Summary & Guarantee */}
              <div
                style={{
                  background: "#101026",
                  border: "1px solid rgba(212, 175, 55, 0.25)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>
                  <span>Session Fee ({session.duration})</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{session.price}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>
                  <span>Starfix Concierge Fee</span>
                  <span style={{ color: "#10B981", fontWeight: 600 }}>Waived (₹0)</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#10B981", fontSize: "0.8rem" }}>
                    <span>Promo Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>
                  <span>Total Payable</span>
                  <span style={{ color: C.gold }}>{finalPriceStr}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", marginTop: 4 }}>
                  <ShieldCheck size={14} color="#10B981" />
                  <span>Starfix 100% Satisfaction Guarantee. Free reschedule up to 2 hours prior.</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleConfirmAndPay}
                disabled={isProcessing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: C.gold,
                  border: "none",
                  color: "#050510",
                  padding: "14px",
                  borderRadius: 12,
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  cursor: isProcessing ? "wait" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: "0 4px 20px rgba(212, 175, 55, 0.35)",
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? (
                  <>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "2px solid rgba(0,0,0,0.2)",
                        borderTopColor: "#050510",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <span>{processingStep}</span>
                  </>
                ) : (
                  <>
                    <span>{isFree || finalPriceNum === 0 ? "Confirm Mentorship Booking" : `Pay ${finalPriceStr} & Lock Slot`}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
