// Anti-abuse utilities for queue system
// Simplified: No daily limits, only checks for active ticket

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
