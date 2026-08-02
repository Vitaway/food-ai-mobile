import PDFDocument from "pdfkit";
import { resolveEmailLogoPath } from "./email-logo";

export type PaymentReceiptInput = {
  receiptNumber: string;
  invoiceNumber: string | null;
  externalRef: string;
  customerName: string;
  customerEmail: string;
  planLabel: string;
  planCode: string;
  amount: number;
  currency: string;
  paidAt: Date;
  renewsOn: string | null;
  paymentMethod?: string | null;
};

function formatMoney(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString("en-RW")} ${currency}`;
}

/** Professional MiraFood payment receipt PDF. */
export async function buildPaymentReceiptPdf(input: PaymentReceiptInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const navy = "#023459";
    const green = "#1d9e75";
    const muted = "#696e5e";
    const logoPath = resolveEmailLogoPath();
    const logoSize = 52;
    const headerHeight = 92;
    const textLeft = logoPath ? 48 + logoSize + 14 : 48;

    doc.rect(0, 0, doc.page.width, headerHeight).fill(navy);

    if (logoPath) {
      doc.image(logoPath, 48, (headerHeight - logoSize) / 2, {
        width: logoSize,
        height: logoSize,
      });
    }

    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("MiraFood", textLeft, 28, { width: 280 });
    doc.fontSize(11).font("Helvetica").text("Payment receipt", textLeft, 56, { width: 280 });
    doc.fontSize(10).text(input.receiptNumber, 360, 56, { width: 180, align: "right" });

    doc.fillColor(navy).fontSize(16).font("Helvetica-Bold").text("Thank you for your payment", 48, 120);
    doc
      .fillColor(muted)
      .fontSize(10)
      .font("Helvetica")
      .text(
        "This confirms your MiraFood subscription payment. Keep this receipt for your records.",
        48,
        144,
        { width: 500 },
      );

    const boxTop = 180;
    doc.roundedRect(48, boxTop, 500, 210, 8).strokeColor("#ced0c8").lineWidth(1).stroke();

    const rows: Array<[string, string]> = [
      ["Receipt", input.receiptNumber],
      ["Invoice", input.invoiceNumber ?? "—"],
      ["Reference", input.externalRef],
      ["Customer", input.customerName || input.customerEmail],
      ["Email", input.customerEmail],
      ["Plan", `${input.planLabel} (${input.planCode})`],
      ["Amount paid", formatMoney(input.amount, input.currency)],
      ["Paid at", input.paidAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })],
      ["Access until", input.renewsOn ? new Date(input.renewsOn).toLocaleDateString("en-GB") : "—"],
      ["Method", input.paymentMethod?.trim() || "IremboPay"],
    ];

    let y = boxTop + 18;
    for (const [label, value] of rows) {
      doc.fillColor(muted).fontSize(9).font("Helvetica").text(label.toUpperCase(), 64, y, { width: 140 });
      doc.fillColor(navy).fontSize(10).font("Helvetica-Bold").text(value, 210, y, { width: 310 });
      y += 18;
    }

    doc
      .roundedRect(48, 420, 500, 56, 8)
      .fillOpacity(0.08)
      .fillAndStroke(green, green)
      .fillOpacity(1);
    doc
      .fillColor(green)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Total paid: ${formatMoney(input.amount, input.currency)}`, 64, 440);

    doc
      .fillColor(muted)
      .fontSize(9)
      .font("Helvetica")
      .text(
        "MiraFood by Vitaway Health · Questions? Contact support via mirafood.vitaway.org/support",
        48,
        760,
        { width: 500, align: "center" },
      );

    doc.end();
  });
}
