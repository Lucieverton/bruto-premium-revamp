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
    const { data, error } = await supabase
      .from('queue_items')
      .select('id, status')
      .eq('id', ticketId)
      .single();
    
    if (error || !data) {
      // Ticket not found - clear and allow new entry
      clearMyTicket();
      return null;
    }
    
    // Only these statuses mean the client is STILL in queue
    const activeStatuses = ['waiting', 'called', 'in_progress'];
    
    if (activeStatuses.includes(data.status)) {
      return ticketId;
    }
    
    // Ticket is completed, cancelled, or no_show - clear it so they can re-enter
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
