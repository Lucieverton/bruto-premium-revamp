// Anti-abuse utilities for queue system
// Enforces: only one active ticket at a time per browser

// Ticket persistence
const TICKET_KEY = 'my_queue_ticket';

export const saveMyTicket = (ticketId: string): void => {
  localStorage.setItem(TICKET_KEY, ticketId);
};

export const getMyTicket = (): string | null => {
  return localStorage.getItem(TICKET_KEY);
};

export const clearMyTicket = (): void => {
  localStorage.removeItem(TICKET_KEY);
};

// Check if user has an active ticket stored locally
export const hasStoredTicket = (): boolean => {
  return localStorage.getItem(TICKET_KEY) !== null;
};

// Validate if the stored ticket is still active (not completed/cancelled)
// Returns the ticket ID if valid, null if ticket should be cleared
export const validateStoredTicket = async (supabase: any): Promise<string | null> => {
  const ticketId = getMyTicket();
  if (!ticketId) return null;
  
  try {
    // IMPORTANT: Clients cannot read queue_items directly due to backend security.
    // Use secure RPC to verify status without exposing PII.
    const { data, error } = await supabase.rpc('get_queue_position', {
      p_ticket_id: ticketId,
    });

    if (error) {
      clearMyTicket();
      return null;
    }

    const row = (Array.isArray(data) ? data[0] : null) as
      | { ticket_status?: string | null }
      | null;

    const status = row?.ticket_status ?? null;
    const activeStatuses = ['waiting', 'called', 'in_progress'];

    if (status && activeStatuses.includes(status)) return ticketId;

    clearMyTicket();
    return null;
  } catch {
    // On error, clear for safety to allow re-entry
    clearMyTicket();
    return null;
  }
};

// Force clear ticket (manual exit from queue)
export const forceLeaveQueue = (): void => {
  clearMyTicket();
};
