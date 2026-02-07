/**
 * Fire-and-forget helper to call the send-push edge function.
 * Failures are silently logged so they never block queue operations.
 *
 * Notification types:
 * - new_client:  sent to the assigned barber (or ALL barbers if barber_id is null / general queue)
 * - transfer:    sent only to the destination barber
 * - client_left: sent to the assigned barber so they know the slot freed up
 */
export type PushType = 'new_client' | 'transfer' | 'client_left';

export interface PushPayload {
  type: PushType;
  /** Customer's full name for the notification body */
  customer_name: string;
  /** Target barber – if null, all subscribed barbers receive it (general queue) */
  barber_id?: string | null;
  /** Ticket number for context */
  ticket_number: string;
  /** Optional comma-separated service names for richer messages */
  service_names?: string;
}

export const sendPushNotification = (data: PushPayload) => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch((err) => {
    console.warn('[Push] Failed to send notification:', err);
  });
};
