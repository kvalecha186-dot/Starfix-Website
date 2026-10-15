import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("PAYMENTS_ALLOWED_ORIGIN") ?? "https://starfix-website.vercel.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function razorpayRequest(path: string, method: string, body?: unknown) {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error("Razorpay test keys are not configured");
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof json?.error?.description === "string" ? json.error.description : "Razorpay request failed");
  return json;
}

async function getUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

async function createOrder(req: Request) {
  const user = await getUser(req);
  if (!user) return response(401, { error: "Authentication required" });
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return response(503, { error: "Payment provider is not configured yet. Add Razorpay TEST keys to Supabase secrets." });
  }
  const body = await req.json().catch(() => null);
  const bookingId = typeof body?.booking_id === "string" ? body.booking_id : "";
  if (!bookingId) return response(400, { error: "booking_id is required" });

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select("id,student_id,mentor_id,session_type_id,status,currency")
    .eq("id", bookingId).maybeSingle();
  if (bookingError) throw bookingError;
  if (!booking || booking.student_id !== user.id) return response(404, { error: "Booking not found" });
  if (String(booking.status).toLowerCase() !== "pending") return response(409, { error: "Only pending bookings can be paid" });
  if (!booking.session_type_id || !booking.mentor_id) {
    return response(422, { error: "This booking has no verified session type. Recreate it using a mentor session option before payment." });
  }

  const { data: session, error: sessionError } = await admin
    .from("session_types")
    .select("id,mentor_id,title,price,currency,active")
    .eq("id", booking.session_type_id).maybeSingle();
  if (sessionError) throw sessionError;
  if (!session || !session.active || session.mentor_id !== booking.mentor_id) {
    return response(409, { error: "Selected mentor session is unavailable" });
  }
  const amountPaise = Math.round(Number(session.price) * 100);
  const currency = String(session.currency || "INR").toUpperCase();
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || currency !== "INR") {
    return response(422, { error: "Only positive INR-priced sessions can be paid online" });
  }

  const { data: existing, error: existingError } = await admin
    .from("payments").select("id,provider_order_id,amount_paise,currency,status")
    .eq("booking_id", booking.id).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.provider_order_id && ["created","pending"].includes(existing.status)) {
    return response(200, { order_id: existing.provider_order_id, amount: existing.amount_paise, currency: existing.currency, key_id: RAZORPAY_KEY_ID });
  }
  if (existing && ["paid","refunded"].includes(existing.status)) {
    return response(409, { error: "This booking already has a completed payment record" });
  }

  const order = await razorpayRequest("/orders", "POST", {
    amount: amountPaise,
    currency,
    receipt: booking.id,
    notes: { booking_id: booking.id, student_id: user.id },
  });
  const row = {
    booking_id: booking.id,
    student_id: user.id,
    provider: "razorpay",
    provider_order_id: order.id,
    amount_paise: amountPaise,
    currency,
    status: "created",
    provider_signature_verified: false,
    updated_at: new Date().toISOString(),
  };
  const { error: saveError } = await admin.from("payments").upsert(row, { onConflict: "booking_id" });
  if (saveError) throw saveError;
  return response(200, { order_id: order.id, amount: amountPaise, currency, key_id: RAZORPAY_KEY_ID });
}

async function confirmFreeBooking(req: Request) {
  const user = await getUser(req);
  if (!user) return response(401, { error: "Authentication required" });
  const body = await req.json().catch(() => null);
  const bookingId = typeof body?.booking_id === "string" ? body.booking_id : "";
  if (!bookingId) return response(400, { error: "booking_id is required" });
  const { data: booking, error: bookingError } = await admin.from("bookings")
    .select("id,student_id,mentor_id,session_type_id,status")
    .eq("id", bookingId).maybeSingle();
  if (bookingError) throw bookingError;
  if (!booking || booking.student_id !== user.id) return response(404, { error: "Booking not found" });
  if (String(booking.status).toLowerCase() !== "pending") return response(409, { error: "Only pending bookings can be confirmed" });
  if (!booking.session_type_id || !booking.mentor_id) return response(422, { error: "Booking has no verified session type" });
  const { data: session, error: sessionError } = await admin.from("session_types")
    .select("id,mentor_id,price,currency,active")
    .eq("id", booking.session_type_id).maybeSingle();
  if (sessionError) throw sessionError;
  if (!session || !session.active || session.mentor_id !== booking.mentor_id
      || Number(session.price) !== 0 || String(session.currency || "INR").toUpperCase() !== "INR") {
    return response(409, { error: "This is not an eligible free session" });
  }
  const { error: updateError } = await admin.from("bookings").update({ status: "confirmed" })
    .eq("id", booking.id).eq("student_id", user.id).eq("status", "pending");
  if (updateError) throw updateError;
  return response(200, { ok: true, status: "confirmed" });
}

async function verifyCheckout(req: Request) {
  const user = await getUser(req);
  if (!user) return response(401, { error: "Authentication required" });
  if (!RAZORPAY_KEY_SECRET) return response(503, { error: "Payment provider is not configured" });
  const body = await req.json().catch(() => null);
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !signature) return response(400, { error: "Missing Razorpay checkout fields" });

  const expected = await hmacHex(RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
  if (!safeEqual(expected, signature)) return response(400, { error: "Payment signature verification failed" });

  const { data: payment, error: paymentError } = await admin
    .from("payments").select("*").eq("provider_order_id", orderId).maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment || payment.student_id !== user.id) return response(404, { error: "Payment order not found" });
  if (payment.status === "paid") return response(200, { ok: true, status: "paid" });

  const providerPayment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, "GET");
  if (providerPayment.order_id !== orderId || providerPayment.status !== "captured"
    || Number(providerPayment.amount) !== Number(payment.amount_paise)
    || String(providerPayment.currency).toUpperCase() !== payment.currency) {
    return response(409, { error: "Payment is not captured for the expected order and amount" });
  }

  const { error: updateError } = await admin.from("payments").update({
    provider_payment_id: paymentId,
    status: "paid",
    provider_signature_verified: true,
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", payment.id).neq("status", "paid");
  if (updateError) throw updateError;
  const { error: bookingUpdateError } = await admin.from("bookings").update({ status: "confirmed" })
    .eq("id", payment.booking_id).eq("student_id", user.id).eq("status", "pending");
  if (bookingUpdateError) throw bookingUpdateError;
  return response(200, { ok: true, status: "paid" });
}

async function webhook(req: Request) {
  if (!RAZORPAY_WEBHOOK_SECRET) return response(503, { error: "Webhook secret is not configured" });
  const signature = req.headers.get("x-razorpay-signature") || "";
  const raw = await req.text();
  const expected = await hmacHex(RAZORPAY_WEBHOOK_SECRET, raw);
  if (!signature || !safeEqual(expected, signature)) return response(401, { error: "Invalid webhook signature" });
  const event = JSON.parse(raw);
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  if (!orderId) return response(200, { received: true, ignored: true });

  const { data: payment, error } = await admin.from("payments")
    .select("*").eq("provider_order_id", orderId).maybeSingle();
  if (error) throw error;
  if (!payment) return response(200, { received: true, ignored: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (paymentEntity && Number(paymentEntity.amount) !== Number(payment.amount_paise)) {
      return response(400, { error: "Captured amount does not match order" });
    }
    if (payment.status !== "paid") {
      const { error: updateError } = await admin.from("payments").update({
        provider_payment_id: paymentEntity?.id || payment.provider_payment_id,
        status: "paid",
        provider_signature_verified: true,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", payment.id).neq("status", "paid");
      if (updateError) throw updateError;
      await admin.from("bookings").update({ status: "confirmed" })
        .eq("id", payment.booking_id).eq("status", "pending");
    }
  } else if (event.event === "payment.failed" && payment.status !== "paid") {
    await admin.from("payments").update({
      provider_payment_id: paymentEntity?.id || null,
      status: "failed",
      failure_reason: String(paymentEntity?.error_description || "Payment failed").slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id).neq("status", "paid");
  }
  return response(200, { received: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return response(405, { error: "Method not allowed" });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (action === "webhook") return await webhook(req);
    if (action === "create-order") return await createOrder(req);
    if (action === "confirm-free-booking") return await confirmFreeBooking(req);
    if (action === "verify-payment") return await verifyCheckout(req);
    return response(400, { error: "Use action=create-order, verify-payment, or webhook" });
  } catch (error) {
    console.error("razorpay-payments error", error);
    return response(500, { error: "Payment processing failed. Check the function logs." });
  }
});
