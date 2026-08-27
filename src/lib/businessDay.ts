// Helpers para o "dia" da barbearia (fuso fixo America/Fortaleza, UTC-3, sem horário de verão).
// Evita que o dia vire às 21h (horário local) por causa do relógio UTC.

export const SHOP_TZ = 'America/Fortaleza';
const SHOP_OFFSET = '-03:00';

/** Retorna a data local da barbearia no formato YYYY-MM-DD. */
export const shopDateISO = (base: Date = new Date()): string => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(base); // en-CA => YYYY-MM-DD
};

/** Instante correspondente a 00:00:00 do dia local da barbearia. */
export const shopDayStart = (base: Date = new Date()): Date =>
  new Date(`${shopDateISO(base)}T00:00:00.000${SHOP_OFFSET}`);

/** Instante correspondente a 23:59:59.999 do dia local da barbearia. */
export const shopDayEnd = (base: Date = new Date()): Date =>
  new Date(`${shopDateISO(base)}T23:59:59.999${SHOP_OFFSET}`);
