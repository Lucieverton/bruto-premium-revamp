import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Base64url helpers ──────────────────────────────────────────────────────

function b64urlEncode(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── VAPID key generation ───────────────────────────────────────────────────

async function generateVAPIDKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const publicRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey)
  );
  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  return {
    publicKey: b64urlEncode(publicRaw),
    // Store the full JWK components for reliable re-import
    privateKeyD: privateJwk.d!,
    privateKeyX: publicJwk.x!,
    privateKeyY: publicJwk.y!,
  };
}

// ── VAPID JWT ──────────────────────────────────────────────────────────────

async function createVapidAuthHeader(
  audience: string,
  subject: string,
  privateKeyD: string,
  x: string,
  y: string,
  publicKeyB64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const enc = new TextEncoder();
  const hB64 = b64urlEncode(enc.encode(JSON.stringify(header)));
  const pB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const unsigned = `${hB64}.${pB64}`;

  // Import private key as JWK
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: privateKeyD, x, y },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned)
  );

  const jwt = `${unsigned}.${b64urlEncode(new Uint8Array(sigBuf))}`;
  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

// ── Send push to a single subscription ─────────────────────────────────────

async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  vapid: { publicKey: string; privateKeyD: string; x: string; y: string }
): Promise<{ ok: boolean; status?: number; err?: string }> {
  try {
    const url = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const authHeader = await createVapidAuthHeader(
      audience,
      "mailto:contato@barbeariabrutos.com",
      vapid.privateKeyD,
      vapid.x,
      vapid.y,
      vapid.publicKey
    );

    // Send a TTL-only push (no encrypted payload).
    // The SW will show a default notification.
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        TTL: "86400",
        "Content-Length": "0",
        Authorization: authHeader,
        Urgency: "high",
      },
    });

    if (res.status === 201 || res.status === 200) {
      return { ok: true, status: res.status };
    }
    if (res.status === 410 || res.status === 404) {
      return { ok: false, status: res.status, err: "expired" };
    }
    const body = await res.text();
    return { ok: false, status: res.status, err: body };
  } catch (e) {
    return { ok: false, err: String(e) };
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supaAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // ── GET → return VAPID public key (auto-generates on first call) ───
    if (req.method === "GET") {
      const { data: existing } = await supaAdmin
        .from("vapid_keys")
        .select("public_key")
        .limit(1)
        .single();

      if (existing) {
        return jsonRes({ publicKey: existing.public_key });
      }

      const keys = await generateVAPIDKeys();
      const { data, error } = await supaAdmin
        .from("vapid_keys")
        .insert({
          public_key: keys.publicKey,
          private_key: JSON.stringify({
            d: keys.privateKeyD,
            x: keys.privateKeyX,
            y: keys.privateKeyY,
          }),
        })
        .select("public_key")
        .single();

      if (error) throw error;
      console.log("[send-push] Generated new VAPID keys");
      return jsonRes({ publicKey: data.public_key });
    }

    // ── POST → send Web Push to barbers ────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();
      const { type, customer_name, barber_id, ticket_number } = body;
      console.log("[send-push] Incoming:", { type, customer_name, barber_id, ticket_number });

      // Load VAPID keys
      const { data: vk } = await supaAdmin
        .from("vapid_keys")
        .select("*")
        .limit(1)
        .single();

      if (!vk) {
        console.error("[send-push] No VAPID keys");
        return jsonRes({ error: "VAPID keys not configured" }, 500);
      }

      let privParts: { d: string; x: string; y: string };
      try {
        privParts = JSON.parse(vk.private_key);
      } catch {
        console.error("[send-push] Invalid private key format");
        return jsonRes({ error: "Invalid VAPID private key" }, 500);
      }

      const vapid = {
        publicKey: vk.public_key,
        privateKeyD: privParts.d,
        x: privParts.x,
        y: privParts.y,
      };

      // Determine target subscriptions
      let query = supaAdmin.from("push_subscriptions").select("*");
      if (barber_id) {
        query = query.eq("barber_id", barber_id);
      }
      // barber_id === null → all subscriptions (general queue)

      const { data: subs, error: subErr } = await query;
      if (subErr) {
        console.error("[send-push] DB error:", subErr);
        return jsonRes({ error: "DB error" }, 500);
      }

      if (!subs || subs.length === 0) {
        console.log("[send-push] No subscriptions found");
        return jsonRes({ message: "No subscriptions", sent: 0 });
      }

      console.log(`[send-push] Sending to ${subs.length} subscription(s)`);

      // Send in parallel
      const results = await Promise.allSettled(
        subs.map(async (sub) => {
          const result = await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            vapid
          );

          // Clean up expired subscriptions
          if (result.err === "expired") {
            await supaAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            console.log("[send-push] Removed expired sub:", sub.id);
          }

          return { barber: sub.barber_id, ...result };
        })
      );

      const summary = results.map((r) =>
        r.status === "fulfilled" ? r.value : { ok: false, err: String(r.reason) }
      );
      console.log("[send-push] Done:", JSON.stringify(summary));

      return jsonRes({ sent: subs.length, results: summary });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (e) {
    console.error("[send-push] Fatal:", e);
    return jsonRes({ error: String(e) }, 500);
  }
});

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
