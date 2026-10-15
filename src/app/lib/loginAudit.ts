import { supabase } from "./supabase";

export interface UserLoginEvent {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "student" | "mentor" | "admin";
  loginMethod:
    | "Email & Password"
    | "OTP Verification Code"
    | "Password Reset Recovery"
    | "Google OAuth"
    | "1-Click Student Mode"
    | "1-Click Mentor Mode"
    | "Admin Console";
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  status: "Active" | "Signed Out";
}

const STORAGE_KEY = "starfix:live_logins";
const BROADCAST_CHANNEL = "starfix_audit_channel";

function detectClient() {
  if (typeof window === "undefined" || !navigator) {
    return { browser: "Browser", os: "OS", device: "Desktop" };
  }
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "OS";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const device = isMobile ? "Mobile Device" : "Desktop Computer";

  return { browser, os, device };
}

let cachedIp = "";
async function getClientIp(): Promise<string> {
  if (cachedIp) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      cachedIp = data.ip || "127.0.0.1";
      return cachedIp;
    }
  } catch {
    // fallback if offline or timeout
  }
  return "Local Connection";
}

/**
 * Record a user login systematically across Supabase, Realtime, BroadcastChannel, and localStorage.
 */
export async function recordUserLogin(params: {
  userId?: string;
  email: string;
  name?: string;
  role?: "student" | "mentor" | "admin";
  loginMethod: UserLoginEvent["loginMethod"];
  country?: string;
}): Promise<UserLoginEvent> {
  const { browser, os, device } = detectClient();
  const ip = await getClientIp();

  const event: UserLoginEvent = {
    id: "login_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    userId: params.userId || "usr_" + Math.random().toString(36).slice(2, 9),
    email: params.email.trim(),
    name: params.name || params.email.split("@")[0] || "Starfix User",
    role: params.role || "student",
    loginMethod: params.loginMethod,
    device: `${device} (${browser} on ${os})`,
    browser,
    os,
    ipAddress: ip,
    location: params.country || "India",
    timestamp: new Date().toISOString(),
    status: "Active",
  };

  // 1. Persist to shared localStorage so Admin Dashboard sees it immediately
  try {
    if (typeof window !== "undefined") {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const list: UserLoginEvent[] = existingRaw ? JSON.parse(existingRaw) : [];
      // prepend latest, keep up to 100
      const updated = [event, ...list.filter((x) => x.id !== event.id)].slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Broadcast to other open tabs / admin window
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL);
        bc.postMessage({ type: "STARFIX_USER_LOGIN", payload: event });
        bc.close();
      }
      window.dispatchEvent(new CustomEvent("starfix:new-login", { detail: event }));
    }
  } catch {
    // ignore storage issues
  }

  // 2. Attempt to save to Supabase user_logins table
  try {
    await supabase.from("user_logins").insert({
      user_id: event.userId,
      email: event.email,
      name: event.name,
      role: event.role,
      login_method: event.loginMethod,
      ip_address: event.ipAddress,
      device: event.device,
      browser: event.browser,
      os: event.os,
      location: event.location,
      status: event.status,
      created_at: event.timestamp,
    });
  } catch (err) {
    // If table doesn't exist yet, it is already safely captured in client broadcast and local store
    console.debug("user_logins Supabase insert skipped:", err);
  }

  // 3. Update profiles table last_sign_in_at if userId is valid UUID
  if (params.userId && params.userId.includes("-")) {
    try {
      await supabase
        .from("profiles")
        .update({
          last_sign_in_at: event.timestamp,
          updated_at: event.timestamp,
        })
        .eq("id", params.userId);
    } catch {
      // ignore
    }
  }

  // 4. Emit via Supabase Realtime channel
  try {
    const channel = supabase.channel("starfix_live_events");
    channel.send({
      type: "broadcast",
      event: "user_login",
      payload: event,
    });
  } catch {
    // ignore
  }

  return event;
}

/**
 * Get all stored live logins, merging Supabase and local cache.
 */
export async function getLiveLogins(): Promise<UserLoginEvent[]> {
  const localList: UserLoginEvent[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localList.push(...JSON.parse(raw));
    } catch {}
  }

  try {
    const { data, error } = await supabase
      .from("user_logins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && Array.isArray(data) && data.length > 0) {
      const dbList: UserLoginEvent[] = data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        email: d.email,
        name: d.name || d.email.split("@")[0],
        role: d.role || "student",
        loginMethod: d.login_method || "Email & Password",
        device: d.device || "Desktop",
        browser: d.browser || "Chrome",
        os: d.os || "Windows",
        ipAddress: d.ip_address || "127.0.0.1",
        location: d.location || "India",
        timestamp: d.created_at,
        status: d.status || "Active",
      }));

      // Merge and deduplicate by id/email+timestamp
      const combined = [...dbList];
      for (const loc of localList) {
        if (!combined.some((c) => c.id === loc.id || (c.email === loc.email && Math.abs(Date.parse(c.timestamp) - Date.parse(loc.timestamp)) < 2000))) {
          combined.push(loc);
        }
      }
      return combined.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    }
  } catch {}

  return localList;
}
