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

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

// ── VAPID key generation ───────────────────────────────────────────────────

async function generateVAPIDKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );

  const publicRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );
  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  return {
    publicKey: b64urlEncode(publicRaw),
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
  publicKeyB64: string,
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const enc = new TextEncoder();
  const hB64 = b64urlEncode(enc.encode(JSON.stringify(header)));
  const pB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const unsigned = `${hB64}.${pB64}`;

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: privateKeyD, x, y },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned),
  );

  const jwt = `${unsigned}.${b64urlEncode(new Uint8Array(sigBuf))}`;
  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

// ── Payload encryption (RFC 8291 — aes128gcm) ──────────────────────────────

async function hmac(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, data as unknown as ArrayBuffer));
}

/** HKDF-Expand with a single output block (length <= 32) */
async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const out = await hmac(prk, concat(info, new Uint8Array([1])));
  return out.slice(0, length);
}

async function encryptPayload(
  plaintext: string,
  p256dhB64: string,
  authB64: string,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const uaPublic = b64urlDecode(p256dhB64);
  const authSecret = b64urlDecode(authB64);

  // Ephemeral (application server) ECDH key pair
  const asKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const asPublic = new Uint8Array(
    await crypto.subtle.exportKey("raw", asKeys.publicKey),
  );

  const uaKey = await crypto.subtle.importKey(
    "raw",
    uaPublic as unknown as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: uaKey },
      asKeys.privateKey,
      256,
    ),
  );

  // IKM
  const prkKey = await hmac(authSecret, sharedSecret);
  const keyInfo = concat(
    enc.encode("WebPush: info\0"),
    uaPublic,
    asPublic,
  );
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  // Content encryption key + nonce
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cekBytes = await hkdfExpand(
    prk,
    enc.encode("Content-Encoding: aes128gcm\0"),
    16,
  );
  const nonce = await hkdfExpand(
    prk,
    enc.encode("Content-Encoding: nonce\0"),
    12,
  );

  const cek = await crypto.subtle.importKey(
    "raw",
    cekBytes as unknown as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  // Padding delimiter 0x02 (last record)
  const body = concat(enc.encode(plaintext), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as unknown as ArrayBuffer, tagLength: 128 },
      cek,
      body as unknown as ArrayBuffer,
    ),
  );

  // Header: salt(16) | rs(4) | idlen(1) | as_public(65)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const header = concat(salt, rs, new Uint8Array([asPublic.length]), asPublic);

  return concat(header, ciphertext);
}

// ── Send push to a single subscription ─────────────────────────────────────

async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  vapid: { publicKey: string; privateKeyD: string; x: string; y: string },
  payload: Record<string, unknown>,
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
      vapid.publicKey,
    );

    const headers: Record<string, string> = {
      TTL: "86400",
      Authorization: authHeader,
      Urgency: "high",
    };

    let bodyBytes: Uint8Array | null = null;
    try {
      if (sub.p256dh && sub.auth) {
        bodyBytes = await encryptPayload(
          JSON.stringify(payload),
          sub.p256dh,
          sub.auth,
        );
        headers["Content-Encoding"] = "aes128gcm";
        headers["Content-Type"] = "application/octet-stream";
        headers["Content-Length"] = String(bodyBytes.length);
      }
    } catch (e) {
      console.error("[send-push] Encryption failed, falling back:", String(e));
      bodyBytes = null;
    }

    if (!bodyBytes) headers["Content-Length"] = "0";

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers,
      body: bodyBytes ? (bodyBytes as unknown as BodyInit) : undefined,
    });

    if (res.status === 201 || res.status === 200 || res.status === 202) {
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // ── GET → return VAPID public key (auto-generates on first call) ───
    if (req.method === "GET") {
      const { data: existing } = await supaAdmin
        .from("vapid_keys")
        .select("public_key")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.public_key) {
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

    // ── POST → send Web Push ───────────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { type, customer_name, barber_id, ticket_number, service_names } = body as {
        type?: string;
        customer_name?: string;
        barber_id?: string | null;
        ticket_number?: string;
        service_names?: string;
      };
      console.log("[send-push] Incoming:", { type, barber_id, ticket_number });

      const isTest = type === "test";

      if (isTest) {
        // Test pushes require a signed-in user
        const authHeader = req.headers.get("Authorization") ?? "";
        const jwt = authHeader.replace(/^Bearer\s+/i, "");
        const { data: userRes } = await supaAdmin.auth.getUser(jwt);
        if (!userRes?.user) {
          return jsonRes({ error: "Não autorizado" }, 401);
        }
      } else {
        // ── Anti-abuse: ticket must exist in today's queue ──
        if (!ticket_number || typeof ticket_number !== "string") {
          return jsonRes({ error: "Missing ticket_number" }, 400);
        }

        const { data: ticketExists, error: ticketErr } = await supaAdmin
          .from("queue_items")
          .select("id")
          .eq("ticket_number", ticket_number)
          .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
          .limit(1)
          .maybeSingle();

        if (ticketErr || !ticketExists) {
          console.warn("[send-push] Rejected: ticket not found:", ticket_number);
          return jsonRes({ error: "Invalid ticket" }, 403);
        }
      }

      // Load VAPID keys (always the most recent row)
      const { data: vk } = await supaAdmin
        .from("vapid_keys")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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

      // Build notification content
      const payload = buildPayload(type ?? "new_client", {
        customer_name,
        ticket_number,
        service_names,
        isGeneral: !barber_id,
      });

      // Determine target subscriptions
      let query = supaAdmin.from("push_subscriptions").select("*");
      if (barber_id) query = query.eq("barber_id", barber_id);

      const { data: subs, error: subErr } = await query;
      if (subErr) {
        console.error("[send-push] DB error:", subErr);
        return jsonRes({ error: "DB error" }, 500);
      }

      if (!subs || subs.length === 0) {
        console.log("[send-push] No subscriptions found");
        return jsonRes({ message: "No subscriptions", sent: 0, results: [] });
      }

      console.log(`[send-push] Sending to ${subs.length} subscription(s)`);

      const results = await Promise.allSettled(
        subs.map(async (sub) => {
          const result = await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            vapid,
            payload,
          );

          if (result.err === "expired") {
            await supaAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            console.log("[send-push] Removed expired sub:", sub.id);
          }

          return { barber: sub.barber_id, ...result };
        }),
      );

      const summary = results.map((r) =>
        r.status === "fulfilled" ? r.value : { ok: false, err: String(r.reason) },
      );
      const delivered = summary.filter((s) => (s as { ok: boolean }).ok).length;
      console.log("[send-push] Done:", JSON.stringify(summary));

      return jsonRes({ sent: subs.length, delivered, results: summary });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (e) {
    console.error("[send-push] Fatal:", e);
    return jsonRes({ error: String(e) }, 500);
  }
});

function buildPayload(
  type: string,
  info: {
    customer_name?: string;
    ticket_number?: string;
    service_names?: string;
    isGeneral: boolean;
  },
) {
  const name = info.customer_name?.trim() || "Cliente";
  const ticket = info.ticket_number ? ` — Ticket ${info.ticket_number}` : "";
  const services = info.service_names ? ` • ${info.service_names}` : "";

  switch (type) {
    case "test":
      return {
        title: "🔔 Teste de notificação",
        body: "Está funcionando! Você receberá avisos assim que um cliente entrar na fila.",
        tag: "teste-push",
        url: "/admin/atendimento",
      };
    case "transfer":
      return {
        title: "🔄 Cliente transferido para você!",
        body: `${name}${ticket}`,
        tag: "transferencia-cliente",
        url: "/admin/atendimento",
      };
    case "client_left":
      return {
        title: "🚶 Cliente saiu da fila",
        body: `${name}${ticket} desistiu.`,
        tag: "cliente-saiu",
        url: "/admin/atendimento",
      };
    default:
      return {
        title: info.isGeneral
          ? "👥 Novo cliente na fila geral!"
          : "💈 Novo cliente na sua fila!",
        body: `${name}${services}${ticket}`,
        tag: `novo-cliente-${info.ticket_number ?? Date.now()}`,
        url: "/admin/atendimento",
      };
  }
}

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
