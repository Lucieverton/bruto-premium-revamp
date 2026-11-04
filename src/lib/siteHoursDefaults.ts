import { SHOP_TZ } from './businessDay';

export interface DayHours {
  open: boolean;
  start: string; // HH:MM
  end: string;
  /** Somente domingo: abre apenas no 1º e 2º domingo do mês. */
  firstTwoOnly?: boolean;
}

/** Índice 0 = Domingo ... 6 = Sábado */
export type WeekHours = DayHours[];

export const HOURS_KEY = 'business_hours';
export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const DEFAULT_HOURS: WeekHours = [
  { open: true, start: '09:00', end: '12:00', firstTwoOnly: true },
  ...Array.from({ length: 6 }, () => ({ open: true, start: '08:00', end: '19:00' })),
];

export const parseHours = (raw?: string): WeekHours => {
  if (!raw) return DEFAULT_HOURS;
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v) && v.length === 7) return v as WeekHours;
  } catch { /* ignore */ }
  return DEFAULT_HOURS;
};

const fmtH = (t: string) => {
  const [h, m] = t.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
};

/** Linhas legíveis agrupando dias seguidos com o mesmo horário (Seg→Sáb, depois Domingo). */
export const formatWeeklyHours = (w: WeekHours): string[] => {
  const order = [1, 2, 3, 4, 5, 6];
  const lines: string[] = [];
  let i = 0;
  while (i < order.length) {
    const d = w[order[i]];
    let j = i;
    while (
      j + 1 < order.length &&
      w[order[j + 1]].open === d.open &&
      (!d.open || (w[order[j + 1]].start === d.start && w[order[j + 1]].end === d.end))
    ) j++;
    const label = i === j ? DAY_NAMES[order[i]] : `${DAY_NAMES[order[i]]} a ${DAY_NAMES[order[j]]}`;
    if (d.open) lines.push(`${label}, das ${fmtH(d.start)} às ${fmtH(d.end)}`);
    i = j + 1;
  }
  const sun = w[0];
  if (sun.open) {
    lines.push(
      sun.firstTwoOnly
        ? `Domingo (1º e 2º do mês), das ${fmtH(sun.start)} às ${fmtH(sun.end)}`
        : `Domingo, das ${fmtH(sun.start)} às ${fmtH(sun.end)}`,
    );
  }
  const closed = [1, 2, 3, 4, 5, 6, 0].filter((k) => !w[k].open).map((k) => DAY_NAMES[k]);
  if (closed.length) lines.push(`Fechado: ${closed.join(', ')}`);
  return lines;
};

/** Horário de hoje no fuso da barbearia; null = fechado hoje. */
export const getTodayHours = (w: WeekHours, base: Date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: SHOP_TZ, weekday: 'short', day: 'numeric' }).formatToParts(base);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((p) => p.type === 'weekday')!.value);
  const day = Number(parts.find((p) => p.type === 'day')!.value);
  const d = w[wd];
  if (!d?.open) return null;
  if (wd === 0 && d.firstTwoOnly && day > 14) return null;
  return { start: d.start, end: d.end };
};
