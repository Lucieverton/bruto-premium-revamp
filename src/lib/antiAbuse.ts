// Anti-abuse utilities for queue system

const DAILY_LIMIT = 5;
const STORAGE_KEY = 'queue_entries';

interface QueueEntry {
  date: string;
  count: number;
}

export const getQueueEntriesToday = (): number => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return 0;
  
  try {
    const entry: QueueEntry = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    
    if (entry.date === today) {
      return entry.count;
    }
    return 0;
  } catch {
    return 0;
  }
};

export const canJoinQueue = (): boolean => {
  return getQueueEntriesToday() < DAILY_LIMIT;
};

export const recordQueueEntry = (): void => {
  const today = new Date().toISOString().split('T')[0];
  const currentCount = getQueueEntriesToday();
  
  const entry: QueueEntry = {
    date: today,
    count: currentCount + 1,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
};

export const getRemainingEntries = (): number => {
  return Math.max(0, DAILY_LIMIT - getQueueEntriesToday());
};

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
