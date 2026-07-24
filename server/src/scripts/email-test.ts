import "reflect-metadata";
import { emailService } from "../services/email.service";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npm run email:test -- you@example.com");
    process.exit(1);
  }

  console.log("Verifying SMTP connection…");
  const verify = await emailService.verifyConnection();
  console.log(verify);

  if (!verify.ok) {
    console.error("Email is not configured. Set SMTP_USER and SMTP_PASS in server/.env");
    process.exit(1);
  }

  console.log(`Sending welcome email to ${to}…`);
  await emailService.sendWelcomeEmail(to, {
    displayName: "Test User",
    patientId: "MRN-26070001",
  });

  console.log("Done — check the inbox.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
