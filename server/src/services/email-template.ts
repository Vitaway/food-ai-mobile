/** MiraFood / Vitaway design tokens — aligned with web + mobile palette */
export const EMAIL_BRAND = {
  navy: "#16304D",
  navyMid: "#1A3A5C",
  navyLight: "#21466B",
  blueSpruce50: "#eef4f8",
  blueSpruce600: "#023459",
  cinnamon400: "#ff6f32",
  cinnamon500: "#e2622d",
  shamrock500: "#1d9e75",
  ash50: "#f3f3f1",
  ash200: "#ced0c8",
  ash500: "#848a75",
  ash600: "#696e5e",
  ash900: "#1a1c17",
  white: "#ffffff",
} as const;

export const EMAIL_FONT_FAMILY =
  "'Sniglet', ui-rounded, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const EMAIL_DISPLAY_STYLE =
  "font-family:Georgia,'Times New Roman',serif;font-weight:400;text-transform:uppercase;letter-spacing:0.06em;";

export type VitawayEmailContent = {
  title: string;
  bodyHtml: string;
  preheader?: string;
  appUrl?: string;
};

const EMAIL_CELL_STYLE = `font-family:${EMAIL_FONT_FAMILY};`;

export function renderVitawayWordmarkHtml(variant: "light" | "dark" = "light", sizePx = 28) {
  const nameColor = variant === "light" ? EMAIL_BRAND.white : EMAIL_BRAND.navy;
  const dotColor = EMAIL_BRAND.cinnamon400;
  return `<span style="font-family:${EMAIL_FONT_FAMILY};font-size:${sizePx}px;font-weight:400;color:${nameColor};letter-spacing:-0.01em;">MiraFood</span><span style="font-family:${EMAIL_FONT_FAMILY};font-size:${sizePx}px;font-weight:400;color:${dotColor};">.</span>`;
}

export function vitawayParagraphStyle(extra = "") {
  return `margin:0 0 16px;font-family:${EMAIL_FONT_FAMILY};font-size:15px;line-height:1.65;color:${EMAIL_BRAND.ash600};${extra}`;
}

export function renderVitawayEmailHtml({ title, bodyHtml, preheader, appUrl }: VitawayEmailContent) {
  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>`
    : "";

  const logoUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/mirafood-logo.png` : "";
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="MiraFood" width="72" height="72" style="display:block;margin:0 auto 8px;border-radius:999px;border:0;" />`
    : `<div style="margin:0 auto 8px;width:72px;height:72px;border-radius:999px;background:${EMAIL_BRAND.white};line-height:72px;text-align:center;font-size:28px;">🍽</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.navy};font-family:${EMAIL_FONT_FAMILY};">
${hiddenPreheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(180deg,${EMAIL_BRAND.navy} 0%,${EMAIL_BRAND.navyMid} 50%,${EMAIL_BRAND.navyLight} 100%);${EMAIL_CELL_STYLE}">
<tr>
<td align="center" style="padding:40px 16px 32px;${EMAIL_CELL_STYLE}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;${EMAIL_CELL_STYLE}">
<tr>
<td align="center" style="padding:0 0 8px;${EMAIL_CELL_STYLE}">
${logoBlock}
</td>
</tr>
<tr>
<td align="center" style="padding:0 0 24px;${EMAIL_CELL_STYLE}font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.55);">
by Vitaway
</td>
</tr>
<tr>
<td style="background-color:${EMAIL_BRAND.white};border-radius:24px;padding:28px 24px 32px;box-shadow:0 20px 40px rgba(0,0,0,0.18);${EMAIL_CELL_STYLE}color:${EMAIL_BRAND.ash900};">
<p style="margin:0 0 16px;${EMAIL_DISPLAY_STYLE}font-size:22px;line-height:1.3;color:${EMAIL_BRAND.ash900};">${title}</p>
${bodyHtml}
</td>
</tr>
<tr>
<td align="center" style="padding:24px 8px 0;${EMAIL_CELL_STYLE}font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75);">
<p style="margin:0;font-family:${EMAIL_FONT_FAMILY};">MiraFood · Coach-reviewed nutrition</p>
<p style="margin:8px 0 0;font-family:${EMAIL_FONT_FAMILY};"><a href="mailto:hello@vitaway.com" style="color:${EMAIL_BRAND.white};text-decoration:underline;font-family:${EMAIL_FONT_FAMILY};">hello@vitaway.com</a></p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function renderVitawayEmailText(title: string, paragraphs: string[]) {
  return [
    "MiraFood by Vitaway",
    "",
    title,
    "",
    ...paragraphs,
    "",
    "—",
    "MiraFood · Coach-reviewed nutrition",
    "hello@vitaway.com",
  ].join("\n");
}

export function renderEmailButton(label: string, href: string) {
  return `<p style="margin:0 0 20px;"><a href="${href}" style="display:inline-block;padding:13px 24px;border-radius:999px;background:${EMAIL_BRAND.cinnamon400};color:${EMAIL_BRAND.white};font-family:${EMAIL_FONT_FAMILY};font-size:15px;font-weight:400;text-decoration:none;">${label}</a></p>`;
}

export function renderPatientIdBlock(patientId: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
<tr>
<td style="background-color:${EMAIL_BRAND.blueSpruce50};border:1px solid ${EMAIL_BRAND.ash200};border-radius:12px;padding:14px 16px;font-family:${EMAIL_FONT_FAMILY};">
<p style="margin:0 0 4px;font-size:11px;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_BRAND.blueSpruce600};font-family:${EMAIL_FONT_FAMILY};">Patient file ID</p>
<p style="margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:16px;font-weight:400;letter-spacing:0.06em;color:${EMAIL_BRAND.ash900};">${patientId}</p>
</td>
</tr>
</table>`;
}
