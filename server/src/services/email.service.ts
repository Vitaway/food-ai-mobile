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
  renderOtpCodeBlock,
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

  async sendPasswordResetOtpEmail(
    to: string,
    opts: { code: string; firstName?: string | null },
  ): Promise<void> {
    const appUrl = env.APP_URL.replace(/\/$/, "");
    const firstName = opts.firstName?.trim() || "";
    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
    const code = opts.code.trim();

    await this.sendBrandedEmail({
      to,
      subject: `${code} is your MiraFood reset code`,
      title: "Your reset code",
      preheader: `Use ${code} in MiraFood within 10 minutes to choose a new password.`,
      appUrl,
      bodyHtml: `
        <p style="${vitawayParagraphStyle("margin:0 0 12px;color:#1a1c17;")}">${greeting}</p>
        <p style="${vitawayParagraphStyle()}">Someone asked to reset the password for this MiraFood account. Enter the code below in the app or on the web — no link needed.</p>
        ${renderOtpCodeBlock(code)}
        ${renderInfoCallout(
          "How to finish",
          "Open MiraFood → enter this 6-digit code → choose a new password. The code expires in 10 minutes and can only be used once.",
          "green",
        )}
        ${renderInfoCallout(
          "Didn't request this?",
          "You can ignore this email. Your password will stay the same, and the code will expire on its own.",
          "blue",
        )}
        <p style="${vitawayParagraphStyle("margin:0;font-size:14px;")}">For your security, never share this code with anyone. MiraFood staff will never ask for it.</p>
      `,
      textParagraphs: [
        greeting,
        "",
        "Use this code in MiraFood to reset your password:",
        "",
        code,
        "",
        "It expires in 10 minutes and can only be used once.",
        "Enter it in the app or on the web — no reset link required.",
        "",
        "If you didn't request this, ignore this email. Your password will stay the same.",
        "Never share this code with anyone.",
      ],
    });
  }

  async sendStaffLoginOtpEmail(
    to: string,
    opts: { code: string; firstName?: string | null },
  ): Promise<void> {
    const appUrl = env.APP_URL.replace(/\/$/, "");
    const firstName = opts.firstName?.trim() || "";
    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
    const code = opts.code.trim();

    await this.sendBrandedEmail({
      to,
      subject: `${code} is your MiraFood sign-in code`,
      title: "Verify it’s you",
      preheader: `Use ${code} to finish signing in to MiraFood. Expires in 10 minutes.`,
      appUrl,
      bodyHtml: `
        <p style="${vitawayParagraphStyle("margin:0 0 12px;color:#1a1c17;")}">${greeting}</p>
        <p style="${vitawayParagraphStyle()}">Enter this code to finish signing in to the coach or admin dashboard.</p>
        ${renderOtpCodeBlock(code)}
        ${renderInfoCallout(
          "Security",
          "This code expires in 10 minutes and can only be used once. Never share it with anyone.",
          "green",
        )}
      `,
      textParagraphs: [
        greeting,
        "",
        "Your MiraFood sign-in code:",
        code,
        "",
        "Expires in 10 minutes. Never share this code.",
      ],
    });
  }
}

export const emailService = new EmailService();
