import { useSiteTexts } from './useSiteImages';
import { HOURS_KEY, parseHours, getTodayHours } from '@/lib/siteHoursDefaults';

export const useBusinessHours = () => {
  const { data } = useSiteTexts();
  const week = parseHours(data?.[HOURS_KEY]);
  return { week, today: getTodayHours(week) };
};

/** Texto curto para a fila: "Hoje: 08:00 – 19:00" ou "Hoje: fechado". */
export const useTodayHoursLabel = () => {
  const { today } = useBusinessHours();
  return today ? `Hoje: ${today.start} – ${today.end}` : 'Hoje: fechado';
};
