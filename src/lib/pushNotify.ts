/**
 * Fire-and-forget helper to call the send-push edge function.
 * Failures are silently logged so they never block queue operations.
 *
 * Notification types:
 * - new_client:  sent to the assigned barber (or ALL barbers if barber_id is null / general queue)
 * - transfer:    sent only to the destination barber
 * - client_left: sent to the assigned barber so they know the slot freed up
 * - test:        real push triggered by the barber to validate their device
 */
export type PushType = 'new_client' | 'transfer' | 'client_left' | 'test';

export interface PushPayload {
  type: PushType;
  /** Customer's full name for the notification body */
  customer_name?: string;
  /** Target barber – if null, all subscribed barbers receive it (general queue) */
  barber_id?: string | null;
  /** Ticket number for context */
  ticket_number?: string;
  /** Optional comma-separated service names for richer messages */
  service_names?: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const buildHeaders = (accessToken?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  apikey: ANON_KEY,
  Authorization: `Bearer ${accessToken || ANON_KEY}`,
});

export const sendPushNotification = (data: PushPayload) => {
  fetch(FUNCTION_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      const text = await res.text();
      if (!res.ok) {
        console.warn(`[Push] send-push failed [${res.status}]:`, text);
      } else {
        console.log('[Push] send-push ok:', text);
      }
    })
    .catch((err) => {
      console.warn('[Push] Failed to send notification:', err);
    });
};

/** Sends a REAL push (server → device) so the barber can test with the screen locked. */
export const sendTestPush = async (
  barberId: string,
  accessToken: string,
): Promise<{ ok: boolean; delivered: number; detail: string }> => {
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ type: 'test', barber_id: barberId }),
    });
    const text = await res.text();
    let delivered = 0;
    try {
      delivered = JSON.parse(text)?.delivered ?? 0;
    } catch {
      /* ignore */
    }
    return { ok: res.ok && delivered > 0, delivered, detail: text };
  } catch (err) {
    return { ok: false, delivered: 0, detail: String(err) };
  }
};
