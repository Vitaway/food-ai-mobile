import { createHmac } from "crypto";
import { parseIremboWebhookBody, verifyIremboSignature } from "./irembopay-webhook.util";

describe("irembopay-webhook.util", () => {
  const secret = "test-secret-key";
  const body = JSON.stringify({
    success: true,
    data: {
      amount: 15000,
      invoiceNumber: "880519183280",
      transactionId: "MF-ABC123",
      paymentStatus: "PAID",
      currency: "RWF",
    },
  });

  it("parses Irembo notification envelope", () => {
    const parsed = parseIremboWebhookBody(JSON.parse(body));
    expect(parsed.transactionId).toBe("MF-ABC123");
    expect(parsed.invoiceNumber).toBe("880519183280");
    expect(parsed.paymentStatus).toBe("PAID");
    expect(parsed.amount).toBe(15000);
  });

  it("parses legacy stub body", () => {
    const parsed = parseIremboWebhookBody({
      externalRef: "IREMBO-OLD",
      status: "succeeded",
    });
    expect(parsed.transactionId).toBe("IREMBO-OLD");
    expect(parsed.paymentStatus).toBe("PAID");
  });

  it("verifies t#body HMAC signature", () => {
    const t = String(Date.now());
    const s = createHmac("sha256", secret).update(`${t}#${body}`).digest("hex");
    expect(verifyIremboSignature(body, `t=${t},s=${s}`, secret)).toBe(true);
    expect(verifyIremboSignature(body, `t=${t},s=${"ab".repeat(32)}`, secret)).toBe(false);
    expect(verifyIremboSignature(body, undefined, secret)).toBe(false);
  });

  it("rejects stale timestamps", () => {
    const t = String(Date.now() - 10 * 60 * 1000);
    const s = createHmac("sha256", secret).update(`${t}#${body}`).digest("hex");
    expect(verifyIremboSignature(body, `t=${t},s=${s}`, secret)).toBe(false);
  });
});
