import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { resolveEmailLogoPath } from "./email-logo";
import {
  EMAIL_LOGO_CID,
  renderCredentialsBlock,
  renderEmailButton,
  renderInfoCallout,
  renderPatientIdBlock,
  renderSecondaryLink,
  renderVitawayEmailHtml,
  renderVitawayEmailText,
  vitawayParagraphStyle,
} from "./email-template";

function isEmailConfigured(): boolean {
  return Boolean(env.email.user && env.email.pass);
}

function createTransport() {
  if (env.email.service) {
    return nodemailer.createTransport({
      service: env.email.service,
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: env.email.host || "localhost",
    port: env.email.port,
    secure: env.email.secure,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });
}

type SendMailOptions = {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  textParagraphs: string[];
  preheader?: string;
  appUrl?: string;
  attachments?: Mail.Attachment[];
};

export class EmailService {
  isConfigured(): boolean {
    return isEmailConfigured();
  }

  async verifyConnection(): Promise<{ ok: boolean; message: string }> {
    if (!isEmailConfigured()) {
      return { ok: false, message: "SMTP_USER and SMTP_PASS are not set" };
    }
    const transport = createTransport();
    await transport.verify();
    return { ok: true, message: "SMTP connection verified" };
  }

  private getLogoAttachment(): Mail.Attachment | null {
    const logoPath = resolveEmailLogoPath();
    if (!logoPath) {
      logger.warn("Email logo not found at web/public/mirafood-logo.png or server/assets/mirafood-logo.png");
      return null;
    }
    return {
      filename: "mirafood-logo.png",
      path: logoPath,
      cid: EMAIL_LOGO_CID,
    };
  }

  private async sendBrandedEmail(opts: SendMailOptions) {
    const logoAttachment = this.getLogoAttachment();
    const html = renderVitawayEmailHtml({
      title: opts.title,
      bodyHtml: opts.bodyHtml,
      preheader: opts.preheader,
      appUrl: opts.appUrl,
      logoCid: logoAttachment ? EMAIL_LOGO_CID : undefined,
    });
    const text = renderVitawayEmailText(opts.title, opts.textParagraphs);

    if (!isEmailConfigured()) {
      if (env.NODE_ENV !== "production") {
        logger.info({ to: opts.to, subject: opts.subject }, "[mirafood] Email (dev — not sent)");
        if (opts.textParagraphs.length > 0) {
          logger.info(opts.textParagraphs.join("\n"));
        }
        return;
      }
      throw new Error("Email service is not configured");
    }

    const transport = createTransport();
    await transport.sendMail({
      from: env.email.from,
      to: opts.to,
      subject: opts.subject,
      text,
      html,
      attachments: [
        ...(logoAttachment ? [logoAttachment] : []),
        ...(opts.attachments ?? []),
      ],
    });
  }

  async sendWelcomeEmail(
    to: string,
    opts: { displayName?: string | null; patientId: string },
  ): Promise<void> {
    const firstName = opts.displayName?.trim().split(/\s+/)[0] || "";
    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
    const appUrl = env.APP_URL.replace(/\/$/, "");

    await this.sendBrandedEmail({
      to,
      subject: "Welcome to MiraFood — your Vitaway file is ready",
      title: "Welcome to MiraFood",
      preheader: `Your patient file ${opts.patientId} is ready. Finish onboarding in the app.`,
      appUrl,
      bodyHtml: `
        <p style="${vitawayParagraphStyle("margin:0 0 12px;color:#1a1c17;")}">${greeting}</p>
        <p style="${vitawayParagraphStyle()}">You're set up on MiraFood — snap meals on mobile, get coach-reviewed nutrition insights, and track your progress with your Vitaway patient file.</p>
        ${renderPatientIdBlock(opts.patientId)}
        ${renderInfoCallout("Next step", "Open the MiraFood app and finish your health profile so we can personalize calories, macros, and water targets.", "green")}
        ${renderEmailButton("Continue in the app", appUrl)}
        <p style="${vitawayParagraphStyle("margin:0;font-size:14px;")}">Coaches use your patient file ID when reviewing meals. Keep it somewhere safe.</p>
      `,
      textParagraphs: [
        greeting,
        "",
        "You're set up on MiraFood — snap meals on mobile, get coach-reviewed nutrition insights, and track your progress.",
        "",
        `Patient file ID: ${opts.patientId}`,
        "",
        "Next: finish your health profile in the mobile app.",
        "",
        appUrl,
      ],
    });
  }

  async sendCoachInviteEmail(
    to: string,
    opts: { displayName: string; temporaryPassword: string; organization?: string | null },
  ): Promise<void> {
    const appUrl = env.APP_URL.replace(/\/$/, "");
    const loginUrl = `${appUrl}/login`;
    const firstName = opts.displayName.trim().split(/\s+/)[0] || "Coach";

    await this.sendBrandedEmail({
      to,
      subject: "Your MiraFood coach dashboard access",
      title: "Coach account created",
      preheader: "Sign in to review client meals on the web dashboard.",
      appUrl,
      bodyHtml: `
        <p style="${vitawayParagraphStyle("margin:0 0 12px;color:#1a1c17;")}">Hi ${firstName},</p>
        <p style="${vitawayParagraphStyle()}">An admin created your MiraFood coach account${opts.organization ? ` for <strong>${opts.organization}</strong>` : ""}. Use the web dashboard to review meals, approve nutrition logs, and support your clients.</p>
        ${renderCredentialsBlock([
          { label: "Email", value: to },
          { label: "Temporary password", value: opts.temporaryPassword },
        ])}
        ${renderInfoCallout("Security", "Change your password after your first sign-in. Do not share these credentials.", "orange")}
        ${renderEmailButton("Open coach dashboard", loginUrl)}
        ${renderSecondaryLink("Coach sign-in:", loginUrl)}
      `,
      textParagraphs: [
        `Hi ${firstName},`,
        "",
        "Your MiraFood coach account is ready.",
        "",
        `Email: ${to}`,
        `Temporary password: ${opts.temporaryPassword}`,
        "",
        `Sign in: ${loginUrl}`,
      ],
    });
  }

  async sendMealStatusEmail(
    to: string,
    opts: {
      displayName?: string | null;
      mealName: string;
      status: "approved" | "rejected";
      coachNote?: string | null;
    },
  ): Promise<void> {
    const firstName = opts.displayName?.trim().split(/\s+/)[0] || "there";
    const appUrl = env.APP_URL.replace(/\/$/, "");
    const approved = opts.status === "approved";

    await this.sendBrandedEmail({
      to,
      subject: approved
        ? `Meal approved: ${opts.mealName}`
        : `Meal needs attention: ${opts.mealName}`,
      title: approved ? "Meal approved" : "Meal not approved",
      preheader: approved
        ? `${opts.mealName} was approved by your coach.`
        : `Your coach left feedback on ${opts.mealName}.`,
      appUrl,
      bodyHtml: `
        <p style="${vitawayParagraphStyle("margin:0 0 12px;color:#1a1c17;")}">Hi ${firstName},</p>
        <p style="${vitawayParagraphStyle()}">Your coach ${approved ? "approved" : "reviewed"} <strong>${opts.mealName}</strong>. ${approved ? "It now counts toward your daily totals in the app." : "Open the app to see their note and log an updated meal if needed."}</p>
        ${
          opts.coachNote?.trim()
            ? renderInfoCallout("Coach note", opts.coachNote.trim(), approved ? "green" : "orange")
            : ""
        }
        ${renderEmailButton("View in MiraFood", `${appUrl}/app/meals`)}
      `,
      textParagraphs: [
        `Hi ${firstName},`,
        "",
        `Meal: ${opts.mealName}`,
        `Status: ${opts.status}`,
        opts.coachNote?.trim() ? `Coach note: ${opts.coachNote.trim()}` : "",
        "",
        `${appUrl}/app/meals`,
      ].filter(Boolean),
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    mobileResetUrl?: string,
  ): Promise<void> {
    const appUrl = env.APP_URL.replace(/\/$/, "");
    const mobileLinkBlock = mobileResetUrl
      ? `
        ${renderEmailButton("Reset in the MiraFood app", mobileResetUrl)}
        ${renderSecondaryLink("Mobile app link:", mobileResetUrl)}
      `
      : "";

    await this.sendBrandedEmail({
      to,
      subject: "Reset your MiraFood password",
      title: "Password reset",
      preheader: "This link expires in one hour.",
      appUrl,
      bodyHtml: `
        <p style="${vitawayParagraphStyle()}">We received a request to reset the password for your MiraFood account.</p>
        ${renderEmailButton("Reset password on web", resetUrl)}
        ${mobileLinkBlock}
        ${renderInfoCallout("Didn't request this?", "You can ignore this email. Your password will stay the same.", "blue")}
        ${renderSecondaryLink("Or copy this web link:", resetUrl)}
        <p style="${vitawayParagraphStyle("margin:0;font-size:14px;")}">This link expires in 1 hour.</p>
      `,
      textParagraphs: [
        "Reset your MiraFood password:",
        resetUrl,
        ...(mobileResetUrl ? ["", "Open in the MiraFood app:", mobileResetUrl] : []),
        "",
        "This link expires in 1 hour.",
        "If you didn't request a reset, ignore this email.",
      ],
    });
  }
}

export const emailService = new EmailService();
