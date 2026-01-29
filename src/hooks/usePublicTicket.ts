import { useMemo } from 'react';
import { usePublicQueue, type PublicQueueItem } from '@/hooks/useQueue';

/**
 * Returns a single public-safe ticket from the public queue RPC.
 * This avoids reading protected tables directly (clients cannot SELECT queue_items).
 */
export const usePublicTicket = (ticketId: string | null) => {
  const { data: queue, isLoading, isError, error } = usePublicQueue();

  const ticket = useMemo<PublicQueueItem | null>(() => {
    if (!ticketId) return null;
    return queue?.find((q) => q.id === ticketId) ?? null;
  }, [queue, ticketId]);

  return { ticket, isLoading, isError, error };
};
