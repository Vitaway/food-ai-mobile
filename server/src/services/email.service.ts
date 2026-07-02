import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { env } from "../config/env";
import { logger } from "../config/logger";
import {
  renderEmailButton,
  renderPatientIdBlock,
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
  private async sendBrandedEmail(opts: SendMailOptions) {
    const html = renderVitawayEmailHtml({
      title: opts.title,
      bodyHtml: opts.bodyHtml,
      preheader: opts.preheader,
      appUrl: opts.appUrl,
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
      attachments: opts.attachments,
    });
  }

  async sendWelcomeEmail(
    to: string,
    opts: { displayName?: string | null; patientId: string },
  ): Promise<void> {
    const firstName = opts.displayName?.trim().split(/\s+/)[0] || "";
    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
    const appUrl = env.APP_URL.replace(/\/$/, "");
    const dashboardUrl = `${appUrl}/app`;

    await this.sendBrandedEmail({
      to,
      subject: "Welcome to MiraFood",
      title: "Welcome to MiraFood",
      preheader: `Your Vitaway patient file is ready · ${opts.patientId}`,
      appUrl,
      bodyHtml: `
        <p style="${vitawayParagraphStyle("margin:0 0 12px;color:#1a1c17;")}">${greeting}</p>
        <p style="${vitawayParagraphStyle()}">Your MiraFood account is ready. Log meals on mobile, get coach-reviewed nutrition insights, and track your progress on web — all under one Vitaway patient file.</p>
        ${renderPatientIdBlock(opts.patientId)}
        <p style="${vitawayParagraphStyle()}">Keep this ID handy — your coach uses it to find your file when reviewing meals.</p>
        ${renderEmailButton("Open your dashboard", dashboardUrl)}
        <p style="${vitawayParagraphStyle("margin:0;font-size:14px;")}">Tip: finish your health profile in the mobile app so we can personalize your calorie and macro targets.</p>
      `,
      textParagraphs: [
        greeting,
        "",
        "Your MiraFood account is ready. Log meals on mobile, get coach-reviewed nutrition insights, and track your progress on web — all under one Vitaway patient file.",
        "",
        `Your patient file ID: ${opts.patientId}`,
        "Keep this ID handy — your coach uses it when reviewing your meals.",
        "",
        `Open your dashboard: ${dashboardUrl}`,
        "",
        "Tip: finish your health profile in the mobile app so we can personalize your calorie and macro targets.",
      ],
    });
  }
}

export const emailService = new EmailService();
