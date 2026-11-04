export const CONTACT_DEFAULTS = {
  contact_street: 'Rua da Codeal',
  contact_number: '144',
  contact_complement: '',
  contact_district: 'Salvador Lyra',
  contact_city: 'Maceió',
  contact_state: 'AL',
  contact_zip: '',
  contact_reference: '',
  contact_maps_url: '',
} as const;

export type ContactKey = keyof typeof CONTACT_DEFAULTS;
export const CONTACT_KEYS = Object.keys(CONTACT_DEFAULTS) as ContactKey[];

export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export const maskCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

/** Resolve saved values, falling back to defaults only when nothing at all was saved. */
export const resolveContact = (texts?: Record<string, string>) => {
  const hasSaved = !!texts && CONTACT_KEYS.some((k) => texts[k] !== undefined);
  const out = {} as Record<ContactKey, string>;
  CONTACT_KEYS.forEach((k) => {
    out[k] = hasSaved ? (texts![k] ?? '').trim() : CONTACT_DEFAULTS[k];
  });
  return out;
};

export const formatAddress = (c: Record<ContactKey, string>) => {
  const line1 = [c.contact_street, c.contact_number].filter(Boolean).join(', ');
  const withComp = [line1, c.contact_complement].filter(Boolean).join(' – ');
  const cityUf = [c.contact_city, c.contact_state].filter(Boolean).join(' – ');
  const parts = [withComp, c.contact_district, cityUf].filter(Boolean).join(', ');
  return c.contact_zip ? `${parts}, CEP ${c.contact_zip}` : parts;
};

export const mapsUrl = (c: Record<ContactKey, string>) =>
  c.contact_maps_url?.trim() ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [c.contact_street, c.contact_number, c.contact_district, c.contact_city, c.contact_state, c.contact_zip].filter(Boolean).join(', '),
  )}`;
