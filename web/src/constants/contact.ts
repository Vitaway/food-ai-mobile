/** Public Vitaway contact details for marketing + support surfaces. */

export const CONTACT_EMAIL = 'support@vitaway.org';

/** Support line shown in the marketing header/footer. Override via VITE_SUPPORT_PHONE in `.env`. */
export const SUPPORT_PHONE_DISPLAY =
  import.meta.env.VITE_SUPPORT_PHONE ?? '+250 787 279 560';

export const SUPPORT_PHONE_TEL =
  import.meta.env.VITE_SUPPORT_PHONE_TEL ??
  SUPPORT_PHONE_DISPLAY.replace(/\s/g, '');
