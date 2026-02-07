/**
 * Fire-and-forget helper to call the send-push edge function.
 * Failures are silently logged so they never block queue operations.
 */
export const sendPushNotification = (data: {
  type: 'new_client' | 'transfer';
  customer_name: string;
  barber_id?: string | null;
  ticket_number: string;
}) => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch((err) => {
    console.warn('[Push] Failed to send notification:', err);
  });
};
