/** Support line shown in the marketing header. Override via VITE_SUPPORT_PHONE in `.env`. */
export const SUPPORT_PHONE_DISPLAY =
  import.meta.env.VITE_SUPPORT_PHONE ?? '+250 788 000 000';

export const SUPPORT_PHONE_TEL =
  import.meta.env.VITE_SUPPORT_PHONE_TEL ??
  SUPPORT_PHONE_DISPLAY.replace(/\s/g, '');
